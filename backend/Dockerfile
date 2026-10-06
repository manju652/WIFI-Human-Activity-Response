# Build context is the project root (see docker-compose.yml), so this
# Dockerfile can copy the backend/, ml/, dataset/, and models/ folders
# while preserving the same relative layout the app expects locally.

FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 / scipy wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Preserve sibling-folder layout: /app/backend, /app/ml, /app/dataset, /app/models
COPY backend/ backend/
COPY ml/ ml/
COPY dataset/ dataset/
COPY models/ models/

WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
