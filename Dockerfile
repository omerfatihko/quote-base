# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app files
COPY . .

# Expose the app's port
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
