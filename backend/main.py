import json
import os
import sys
import tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Add the backend directory to Python path to ensure imports work
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from lm_compress import LMCompress
    from lm_compress_cpp import LMCompressCpp
except ImportError as e:
    print(f"ERROR: Failed to import modules: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Backend directory: {backend_dir}")
    raise

# Load .env file for local development (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, that's okay for Cloud Run


def get_model_path(raw_path=None):
    """Get model path, downloading from GCS if needed."""
    # Use provided raw_path or get from app state or env
    if raw_path is None:
        if hasattr(app, 'state') and hasattr(app.state, 'raw_model_path'):
            raw_path = app.state.raw_model_path
        else:
            raw_path = os.getenv("MODEL_PATH")
    
    if not raw_path:
        raise ValueError("MODEL_PATH environment variable is not set")
    
    model_path = raw_path
    
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
    # Store the raw MODEL_PATH env var - don't download or process yet
    # This allows the server to start quickly
    try:
        raw_model_path = os.getenv("MODEL_PATH")
        app.state.raw_model_path = raw_model_path
        app.state.lm_compress = None  # Will be loaded on first request
        if raw_model_path:
            print(f"Model path configured (will download/load on first request): {raw_model_path}")
        else:
            print("WARNING: MODEL_PATH environment variable not set")
    except Exception as e:
        print(f"Error in lifespan startup: {e}")
        app.state.raw_model_path = None
        app.state.lm_compress = None
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


def get_lm_compress():
    """Lazy load the model on first request."""
    if app.state.lm_compress is None:
        if app.state.raw_model_path is None:
            raise ValueError("MODEL_PATH environment variable is not set")
        # Get the actual model path (downloads from GCS if needed)
        print(f"Getting model path from: {app.state.raw_model_path}")
        model_path = get_model_path(app.state.raw_model_path)
        print(f"Loading model from {model_path}...")
        app.state.lm_compress = LMCompressCpp(model_path)
        print("Model loaded successfully")
    return app.state.lm_compress


@app.get("/")
def hello():
    return {"message": "hello world"}


@app.get("/health")
def health():
    """Health check endpoint that doesn't require model to be loaded."""
    return {"status": "healthy", "model_loaded": app.state.lm_compress is not None}


@app.post("/compress")
def compress(text: str = Body(...)):
    lm_compress = get_lm_compress()
    def generate():
        for progress, result in lm_compress.compress_with_progress(text):
            if result is None:
                yield f"data: {json.dumps({'progress': progress})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': 1.0, 'result': result})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/decompress")
def decompress(text: str = Body(...)):
    lm_compress = get_lm_compress()
    def generate():
        for (
            progress,
            text_chunk,
            is_final,
        ) in lm_compress.decompress_with_progress(text):
            if is_final:
                yield f"data: {json.dumps({'progress': 1.0, 'result': text_chunk})}\n\n"
            elif text_chunk:
                yield f"data: {json.dumps({'progress': progress, 'chunk': text_chunk})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': progress})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
