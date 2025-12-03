# Use Python 3.11 as specified in runtime.txt
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for llama-cpp-python and other packages
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY backend/ ./backend/

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose the port Cloud Run expects
EXPOSE 8080

# Run the application - Cloud Run sets PORT env var automatically
CMD python3 -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1

