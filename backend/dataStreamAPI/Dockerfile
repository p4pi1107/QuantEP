FROM python:3.9-slim

WORKDIR /app/backend/dataStreamAPI

# Copy requirements.txt and install dependencies
COPY . /app/backend/dataStreamAPI/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -U flask-cors

# Expose the necessary port
EXPOSE 8080

# Command to run the API
CMD ["python", "app.py"]