# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables to prevent generating .pyc files and to buffer output
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download the required NLTK data corpora for the CrisisDetector
RUN python -m nltk.downloader vader_lexicon punkt

# Copy the rest of the application code into the container
COPY . .

# Run the application with Gunicorn, a production-ready web server
# It will listen on port 8000, which we'll map in Cloud Run
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]