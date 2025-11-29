from lm_compress import LMCompress


def test_roundtrip():
    lm = LMCompress("Qwen/Qwen3-0.6B")
    assert lm.decompress(lm.compress("hello world")) == "hello world"


def test_compression_does_something():
    lm = LMCompress("Qwen/Qwen3-0.6B")
    assert len(lm.compress("hello world")) < len("hello world")


def test_weird_characters():
    lm = LMCompress("Qwen/Qwen3-0.6B")
    try:
        lm.compress("hello 🌍 world")
    except Exception as e:
        assert False, f"Compression raised an exception: {e}"
