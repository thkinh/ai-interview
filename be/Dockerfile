FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy only main.py
COPY main.py .

# (Optional) Install dependencies if needed
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# Run the app
CMD ["python", "main.py"]
