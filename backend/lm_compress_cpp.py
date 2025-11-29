from llama_cpp import Llama
import base64
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

        while ((self.low ^ self.high) & self.half_range) == 0:
            self._shift_bit()
            self.low = (self.low << 1) & self.state_mask
            self.high = ((self.high << 1) & self.state_mask) | 1

        while (self.low & ~self.high & self.quarter_range) != 0:
            self.pending_bits += 1
            self.low = (self.low << 1) ^ self.half_range
            self.high = ((self.high ^ self.half_range) << 1) | self.half_range | 1

    def _shift_bit(self):
        bit = self.low >> (NUM_STATE_BITS - 1)
        self._write_bit(bit)
        for _ in range(self.pending_bits):
            self._write_bit(bit ^ 1)
        self.pending_bits = 0

    def _write_bit(self, bit: int):
        if self.bit_index == 0:
            self.output.append(0)
        self.output[-1] |= bit << (7 - self.bit_index)
        self.bit_index = (self.bit_index + 1) % 8

    def finish(self) -> bytes:
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

        self.code = 0
        for _ in range(NUM_STATE_BITS):
            self.code = (self.code << 1) | self._read_bit()

    def _read_bit(self) -> int:
        if self.byte_index >= len(self.data):
            return 0
        bit = (self.data[self.byte_index] >> (7 - self.bit_index)) & 1
        self.bit_index += 1
        if self.bit_index == 8:
            self.bit_index = 0
            self.byte_index += 1
        return bit

    def decode_symbol(self, cum_freqs: np.ndarray) -> int:
        total = int(cum_freqs[-1])
        range_size = self.high - self.low + 1

        offset = self.code - self.low
        value = ((offset + 1) * total - 1) // range_size
        symbol = int(np.searchsorted(cum_freqs, value, side="right"))

        sym_high = int(cum_freqs[symbol])
        sym_low = int(cum_freqs[symbol - 1]) if symbol > 0 else 0

        self.high = self.low + sym_high * range_size // total - 1
        self.low = self.low + sym_low * range_size // total

        while ((self.low ^ self.high) & self.half_range) == 0:
            self.code = ((self.code << 1) & self.state_mask) | self._read_bit()
            self.low = (self.low << 1) & self.state_mask
            self.high = ((self.high << 1) & self.state_mask) | 1

        while (self.low & ~self.high & self.quarter_range) != 0:
            self.code = (
                (self.code & self.half_range)
                | ((self.code << 1) & (self.state_mask >> 1))
                | self._read_bit()
            )
            self.low = (self.low << 1) ^ self.half_range
            self.high = ((self.high ^ self.half_range) << 1) | self.half_range | 1

        return symbol


class LMCompressCpp:
    def __init__(self, model_path: str, n_ctx: int = 2048, n_gpu_layers: int = -1):
        """Initialize with a GGUF model path."""
        self.llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_gpu_layers=n_gpu_layers,
            verbose=False,
        )
        self.eos_token_id = self.llm.token_eos()
        self.bos_token_id = self.llm.token_bos()

    def _compute_cdf(self, logits) -> np.ndarray:
        """Convert logits to cumulative frequencies."""
        logprobs = self.llm.logits_to_logprobs(logits)
        probs = np.exp(logprobs).astype(np.float64)
        freqs = np.maximum(1, np.round(FREQ_SCALE_FACTOR * probs))
        return np.cumsum(freqs)

    def compress(self, text: str) -> str:
        for progress, result in self.compress_with_progress(text):
            pass
        return result

    def compress_with_progress(self, text: str):
        """Compress using generate() with logits_processor for O(n) performance."""
        self.llm.reset()
        tokens = self.llm.tokenize(text.encode("utf-8"), add_bos=False)
        tokens.append(self.eos_token_id)
        total = len(tokens)

        encoder = ArithmeticEncoder()
        next_token_idx = 0
        progress_holder = [0.0]

        def process_logits(_, logits):
            nonlocal next_token_idx
            if next_token_idx >= len(tokens):
                # Already done, force EOS to stop generation
                logits[self.eos_token_id] = np.inf
                return logits
            next_token = tokens[next_token_idx]
            next_token_idx += 1
            cdf = self._compute_cdf(logits)
            encoder.encode_symbol(cdf, next_token)
            progress_holder[0] = next_token_idx / total
            # Force this token to be selected by generate()
            logits[next_token] = np.inf
            return logits

        def should_stop(tokens_so_far, logits):
            return (
                next_token_idx >= len(tokens) or len(tokens_so_far) >= self.llm.n_ctx()
            )

        # Yield initial progress
        yield 0.0, None

        # Use generate() - maintains KV cache, O(n) instead of O(n²)
        for _ in self.llm.generate(
            tokens=[self.bos_token_id],
            temp=0.0,
            logits_processor=[process_logits],
            stopping_criteria=should_stop,
        ):
            yield progress_holder[0], None

        encoder.finish()
        yield 1.0, base64.b64encode(encoder.output).decode("utf-8")

    def decompress(self, compressed: str) -> str:
        for progress, text, is_final in self.decompress_with_progress(compressed):
            if is_final:
                return text
        return ""

    def decompress_with_progress(self, compressed: str):
        """Decompress using generate() with logits_processor for O(n) performance.

        Yields:
            Tuples of (progress, text, is_final).
            During decoding: text is the newly decoded chunk.
            Final yield: text is the complete result.
        """
        self.llm.reset()
        data = base64.b64decode(compressed)
        decoder = ArithmeticDecoder(data)
        total_bytes = len(data)

        decoded_tokens = []
        done = False
        progress_holder = [0.0]
        chunk_holder = [""]
        full_text_holder = [""]

        def process_logits(_, logits):
            nonlocal done
            if done:
                logits[self.eos_token_id] = np.inf
                chunk_holder[0] = ""
                return logits

            cdf = self._compute_cdf(logits)
            token = decoder.decode_symbol(cdf)
            logits[token] = np.inf

            if token == self.eos_token_id:
                done = True
                chunk_holder[0] = ""
                return logits

            decoded_tokens.append(token)
            # Detokenize just this token for streaming
            new_chunk = self.llm.detokenize([token]).decode("utf-8", errors="replace")
            chunk_holder[0] = new_chunk
            full_text_holder[0] += new_chunk
            progress_holder[0] = (
                min(decoder.byte_index / total_bytes, 0.99) if total_bytes > 0 else 0.5
            )
            return logits

        def should_stop(tokens_so_far, logits):
            return done or len(tokens_so_far) >= self.llm.n_ctx()

        yield 0.0, "", False

        for _ in self.llm.generate(
            tokens=[self.bos_token_id],
            temp=0.0,
            logits_processor=[process_logits],
            stopping_criteria=should_stop,
        ):
            yield progress_holder[0], chunk_holder[0], False

        # Final yield with complete text (re-detokenize all for accuracy)
        final_text = self.llm.detokenize(decoded_tokens).decode("utf-8")
        yield 1.0, final_text, True


if __name__ == "__main__":
    model_path = "/Users/dylanwilbur/llm_compress/backend/models/Qwen3-4B-Q4_K_M.gguf"

    lm = LMCompressCpp(model_path)
    original = "The quick brown fox jumps over the lazy dog."
    print(f"Original: {original}")
    compressed = lm.compress(original)
    print(f"Compressed: {compressed} ({len(compressed)} chars)")
    decompressed = lm.decompress(compressed)
    print(f"Decompressed: {decompressed}")
    print(f"Match: {original == decompressed}")
