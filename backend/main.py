import json
import os
import tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from lm_compress import LMCompress
from lm_compress_cpp import LMCompressCpp

# Load .env file for local development (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, that's okay for Cloud Run


def get_model_path():
    """Get model path from environment variable, downloading from GCS if needed."""
    model_path = os.getenv("MODEL_PATH")
    if not model_path:
        raise ValueError("MODEL_PATH environment variable is not set")
    
    # If it's a GCS path (gs://), download it
    if model_path.startswith("gs://"):
        from google.cloud import storage
        
        # Parse GCS path
        path_parts = model_path[5:].split("/", 1)  # Remove 'gs://' prefix
        bucket_name = path_parts[0]
        blob_name = path_parts[1] if len(path_parts) > 1 else ""
        
        if not blob_name:
            raise ValueError(f"Invalid GCS path: {model_path}. Must include blob name.")
        
        # Download to a temporary file
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        # Use a persistent temp file in /tmp (Cloud Run has writable /tmp)
        # Extract just the filename from the blob path
        filename = os.path.basename(blob_name) or "model.gguf"
        local_path = os.path.join(tempfile.gettempdir(), filename)
        
        if not os.path.exists(local_path):
            print(f"Downloading model from {model_path} to {local_path}...")
            blob.download_to_filename(local_path)
            print(f"Model downloaded successfully")
        else:
            print(f"Using cached model at {local_path}")
        
        return local_path
    
    # Otherwise, use the path as-is (local path or mounted path)
    return model_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # app.state.lm_compress = LMCompress("Qwen/Qwen3-4B")

    # app.state.lm_compress = LMCompressCpp(
    #     "/Users/liamwilbur/Desktop/College Stuff/CS109/llm-arithmetic-coder/backend/models/Llama-3.2-1B.Q5_K_M.gguf"
    # )
    model_path = get_model_path()
    app.state.lm_compress = LMCompressCpp(model_path)
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
