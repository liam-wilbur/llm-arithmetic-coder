import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from lm_compress import LMCompress
from lm_compress_cpp import LMCompressCpp


@asynccontextmanager
async def lifespan(app: FastAPI):
    # app.state.lm_compress = LMCompress("Qwen/Qwen3-4B")
    # app.state.lm_compress = LMCompressCpp(
    #     "/Users/liamwilbur/Desktop/College Stuff/CS109/llm-arithmetic-coder/backend/models/Llama-3.2-1B.Q5_K_M.gguf"
    # )
    # app.state.lm_compress = LMCompressCpp(
    #     "/Users/liamwilbur/Desktop/College Stuff/CS109/llm-arithmetic-coder/backend/models/Llama-3.2-1B.Q5_K_M.gguf"
    # )
    # app.state.lm_compress = LMCompressCpp(
    #     "/Users/liamwilbur/Desktop/College Stuff/CS109/llm-arithmetic-coder/backend/models/Llama-3.2-1B.Q5_K_M.gguf"
    # )
    app.state.lm_compress = LMCompressCpp(
        "/Users/liamwilbur/Desktop/College Stuff/CS109/llm-arithmetic-coder/backend/models/Llama-3.2-1B.Q5_K_M.gguf"
    )
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.get("/")
def hello():
    return {"message": "hello world"}


@app.post("/compress")
def compress(text: str = Body(...)):
    def generate():
        for progress, result in app.state.lm_compress.compress_with_progress(text):
            if result is None:
                yield f"data: {json.dumps({'progress': progress})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': 1.0, 'result': result})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/decompress")
def decompress(text: str = Body(...)):
    def generate():
        for (
            progress,
            text_chunk,
            is_final,
        ) in app.state.lm_compress.decompress_with_progress(text):
            if is_final:
                yield f"data: {json.dumps({'progress': 1.0, 'result': text_chunk})}\n\n"
            elif text_chunk:
                yield f"data: {json.dumps({'progress': progress, 'chunk': text_chunk})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': progress})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
