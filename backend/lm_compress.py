from transformers import AutoTokenizer, AutoModelForCausalLM
import base64
import torch
import numpy as np

NUM_STATE_BITS = 64
FREQ_SCALE_FACTOR = 1 << 32


class ArithmeticEncoder:
    """Integer-based arithmetic encoder with streaming bit output."""

    def __init__(self):
        full_range = 1 << NUM_STATE_BITS
        self.half_range = full_range >> 1
        self.quarter_range = self.half_range >> 1
        self.state_mask = full_range - 1
        self.low = 0
        self.high = self.state_mask
        self.pending_bits = 0
        self.output = bytearray()
        self.bit_index = 0

    def encode_symbol(self, cum_freqs: np.ndarray, symbol: int):
        """Encode a symbol given cumulative frequencies."""
        total = int(cum_freqs[-1])
        range_size = self.high - self.low + 1

        sym_high = int(cum_freqs[symbol])
        sym_low = int(cum_freqs[symbol - 1]) if symbol > 0 else 0

        self.high = self.low + sym_high * range_size // total - 1
        self.low = self.low + sym_low * range_size // total

        # Normalize: shift out matching top bits
        while ((self.low ^ self.high) & self.half_range) == 0:
            self._shift_bit()
            self.low = (self.low << 1) & self.state_mask
            self.high = ((self.high << 1) & self.state_mask) | 1

        # Handle underflow (interval straddles midpoint but is narrow)
        while (self.low & ~self.high & self.quarter_range) != 0:
            self.pending_bits += 1
            self.low = (self.low << 1) ^ self.half_range
            self.high = ((self.high ^ self.half_range) << 1) | self.half_range | 1

    def _shift_bit(self):
        """Output a bit and any pending underflow bits."""
        bit = self.low >> (NUM_STATE_BITS - 1)
        self._write_bit(bit)
        for _ in range(self.pending_bits):
            self._write_bit(bit ^ 1)
        self.pending_bits = 0

    def _write_bit(self, bit: int):
        """Write a single bit to output."""
        if self.bit_index == 0:
            self.output.append(0)
        self.output[-1] |= bit << (7 - self.bit_index)
        self.bit_index = (self.bit_index + 1) % 8

    def finish(self) -> bytes:
        """Finish encoding and return compressed bytes."""
        self._write_bit(1)
        return bytes(self.output)


class ArithmeticDecoder:
    """Integer-based arithmetic decoder."""

    def __init__(self, data: bytes):
        full_range = 1 << NUM_STATE_BITS
        self.half_range = full_range >> 1
        self.quarter_range = self.half_range >> 1
        self.state_mask = full_range - 1
        self.low = 0
        self.high = self.state_mask

        self.data = data
        self.byte_index = 0
        self.bit_index = 0

        # Initialize code with first NUM_STATE_BITS bits
        self.code = 0
        for _ in range(NUM_STATE_BITS):
            self.code = (self.code << 1) | self._read_bit()

    def _read_bit(self) -> int:
        """Read a single bit from input."""
        if self.byte_index >= len(self.data):
            return 0
        bit = (self.data[self.byte_index] >> (7 - self.bit_index)) & 1
        self.bit_index += 1
        if self.bit_index == 8:
            self.bit_index = 0
            self.byte_index += 1
        return bit

    def decode_symbol(self, cum_freqs: np.ndarray) -> int:
        """Decode a symbol given cumulative frequencies."""
        total = int(cum_freqs[-1])
        range_size = self.high - self.low + 1

        # Find symbol whose interval contains the code
        offset = self.code - self.low
        value = ((offset + 1) * total - 1) // range_size
        symbol = int(np.searchsorted(cum_freqs, value, side="right"))

        # Update interval
        sym_high = int(cum_freqs[symbol])
        sym_low = int(cum_freqs[symbol - 1]) if symbol > 0 else 0

        self.high = self.low + sym_high * range_size // total - 1
        self.low = self.low + sym_low * range_size // total

        # Normalize: shift out matching top bits
        while ((self.low ^ self.high) & self.half_range) == 0:
            self.code = ((self.code << 1) & self.state_mask) | self._read_bit()
            self.low = (self.low << 1) & self.state_mask
            self.high = ((self.high << 1) & self.state_mask) | 1

        # Handle underflow
        while (self.low & ~self.high & self.quarter_range) != 0:
            self.code = (
                (self.code & self.half_range)
                | ((self.code << 1) & (self.state_mask >> 1))
                | self._read_bit()
            )
            self.low = (self.low << 1) ^ self.half_range
            self.high = ((self.high ^ self.half_range) << 1) | self.half_range | 1

        return symbol


class LMCompress:
    def __init__(self, model_name: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        self.eos_token_id = self.tokenizer.eos_token_id

    def _get_cum_freqs(self, logits: torch.Tensor) -> np.ndarray:
        """Convert logits to cumulative frequencies for arithmetic coding."""
        probs = torch.softmax(logits, dim=-1).numpy().astype(np.float64)
        # Scale to integers, ensure minimum frequency of 1
        freqs = np.maximum(1, np.round(FREQ_SCALE_FACTOR * probs))
        return np.cumsum(freqs)

    def _get_logits(self, context: list[int]) -> torch.Tensor:
        """Get next-token logits given context."""
        with torch.no_grad():
            if context:
                input_ids = torch.tensor([context])
            else:
                bos_id = self.tokenizer.bos_token_id
                if bos_id is not None:
                    input_ids = torch.tensor([[bos_id]])
                else:
                    # Return uniform distribution
                    return torch.zeros(self.model.config.vocab_size)
            return self.model(input_ids).logits[0, -1, :]

    def compress(self, text: str) -> str:
        """Compress text using LLM-guided arithmetic coding.

        Args:
            text: The text to compress.

        Returns:
            Base64-encoded compressed data.
        """
        for progress, result in self.compress_with_progress(text):
            pass
        return result

    def compress_with_progress(self, text: str):
        """Compress text, yielding progress updates.

        Yields:
            Tuples of (progress_fraction, result). Result is None until final yield.
        """
        tokens = self.tokenizer.encode(text)
        tokens.append(self.eos_token_id)
        total = len(tokens)

        encoder = ArithmeticEncoder()
        context = []

        for i, token in enumerate(tokens):
            logits = self._get_logits(context)
            cum_freqs = self._get_cum_freqs(logits)
            encoder.encode_symbol(cum_freqs, token)
            context.append(token)
            yield (i + 1) / total, None

        compressed = encoder.finish()
        yield 1.0, base64.b64encode(compressed).decode("utf-8")

    def decompress(self, compressed: str) -> str:
        """Decompress base64-encoded compressed data back to text."""
        for progress, result in self.decompress_with_progress(compressed):
            pass
        return result

    def decompress_with_progress(self, compressed: str):
        """Decompress, yielding progress updates.

        Yields:
            Tuples of (progress_fraction, result). Result is None until final yield.
        """
        data = base64.b64decode(compressed)
        decoder = ArithmeticDecoder(data)
        total_bytes = len(data)
        context = []
        tokens = []

        while True:
            logits = self._get_logits(context)
            cum_freqs = self._get_cum_freqs(logits)
            token = decoder.decode_symbol(cum_freqs)

            if token == self.eos_token_id:
                break

            tokens.append(token)
            context.append(token)
            # Progress based on bytes consumed
            progress = (
                min(decoder.byte_index / total_bytes, 0.99) if total_bytes > 0 else 0.5
            )
            yield progress, None

        yield 1.0, self.tokenizer.decode(tokens)


if __name__ == "__main__":
    lm = LMCompress("Qwen/Qwen3-4B")
    # dec_of_independence = """
    # The unanimous Declaration of the thirteen united States of America, When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.
    # """

    original = "The quick brown fox jumps over the lazy dog."
    print(f"Original: {original}")
    compressed = lm.compress(original)
    print(f"Compressed: {compressed} ({len(compressed)} chars)")
    decompressed = lm.decompress(compressed)
    print(f"Decompressed: {decompressed}")
    print(f"Match: {original == decompressed}")
