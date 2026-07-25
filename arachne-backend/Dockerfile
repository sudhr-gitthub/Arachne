FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly install scikit-learn in case compilation was bypassed
RUN pip install --no-cache-dir scikit-learn

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
