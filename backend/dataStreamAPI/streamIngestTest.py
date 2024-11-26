import requests

# This should probably be the manager
# Test stream_ingest endpoint
response = requests.post('http://127.0.0.1:5000/stream_ingest')
try:
    response_data = response.json()
    print(response_data)
except requests.exceptions.JSONDecodeError as e:
    print("Response is not in JSON format.")
    print(response.text)
# Use the response from stream_ingest to test detect_events
data = response.json()
response = requests.post('http://127.0.0.1:5000/detect_events', json=data)
print(response.json())


