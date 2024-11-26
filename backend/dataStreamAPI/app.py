from event_processor import EventProcessor
import json
from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from datetime import datetime
import os
from flask_cors import CORS
from databaseManager import dbManager

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Global counter for unique IDs
eventProcessor = None

# Stream ingestion
@app.route('/stream_ingest', methods=['POST'])
def stream_ingest():
    try:
        db = dbManager('../database/database.sqlite3')
        token = request.headers.get('Authentication')
        savedFiles = db.getChosenFiles(token)
        
        stock_df1 = db.fetchCsvFromDb(savedFiles[0])
        stock_df2 = db.fetchCsvFromDb(savedFiles[1])
        print(stock_df1)
        # Convert date columns to datetime
        stock_df1['date'] = pd.to_datetime(stock_df1['date'], errors='coerce', utc=True)
        stock_df2['date'] = pd.to_datetime(stock_df2['date'], errors='coerce', utc=True)

        # Drop rows with invalid dates if any
        stock_df1 = stock_df1.dropna(subset=['date'])
        stock_df2 = stock_df2.dropna(subset=['date'])

        # Format dates
        stock_df1['date'] = stock_df1['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
        stock_df2['date'] = stock_df2['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # Rest global data records
        global eventProcessor
        eventProcessor = EventProcessor()

        # Combine the data into a single JSON object
        combined_data = {
            'set1': stock_df1.head(300).to_json(orient='records'),
            'set2': stock_df2.head(300).to_json(orient='records')
        }

        return jsonify(combined_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Detect events from given data
@app.route('/detect_events', methods=['POST'])
def detect_events_route():
    customEvents = []
    if len(request.get_json()) > 1:
        customEvents = request.get_json()[1]
    data = pd.DataFrame(request.get_json()[0], index=[0])
    if data.empty:
        return jsonify({"error": "No data provided"}), 400
    data['date'] = pd.to_datetime(data['date'], errors='coerce', utc=False)

    #save the previous data of the stock
    ticker = data.iloc[0]['ticker']
    global eventProcessor
    if ticker not in eventProcessor.database:
        eventProcessor.database[ticker] = {
            'data': data.iloc[0]
        }

    events = eventProcessor.defined_events(20000, 3, data.iloc[0], customEvents)
    complex_events = eventProcessor.detect_complex_events(events)

    # Convert numpy.int64 to native Python int
    for event in events:
        if 'data' in event and 'price' in event['data']:
            event['data']['price'] = float(event['data']['price'])
    
    for event in complex_events:
        if 'data' in event and 'price' in event['data']:
            event['data']['price'] = float(event['data']['price'])

    # Format the response
    formatted_response = []
    for event in events:
        if 'date' in event and 'data' in event:
            formatted_response.append({
                'data': {'name': ticker, 'price': event['data']['price']},
                'date': event['date'].strftime('%Y-%m-%d %H:%M:%S'),
                'action': event.get('action', 'hold')
            })
        else:
            formatted_response.append({
                'Eventid': event['id'],
                'Event': event.get('Event'),
                'condition': event.get('condition'),
                'action': event.get('action', 'hold'),
                'Complex': False
            })

    for complex_event in complex_events:
        formatted_response.append({
            'Eventid': complex_event['id'],
            'Event': complex_event.get('Complex Event'),
            'condition': complex_event.get('condition'),
            'action': complex_event.get('action', 'hold'),
            'Complex': True
        })
    
    return jsonify(formatted_response)

#upload data to the database and return a successful response or error msg to the server 
@app.route('/upload', methods=['POST'])
def upload_file():

    # Error detection
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    files = request.files.getlist('file')
 
    if not files:
        return jsonify({'error': 'No files selected for uploading'}), 400
 
    db = dbManager('../database/database.sqlite3')
    filenames = []
    returnMsg = 'was uploaded successfully!'

    # Save all files to db
    for file in files:
        if file.filename == '':
            return jsonify({'error': f'No file selected for one of the uploads'}), 400
        else:
            token = request.headers.get('Authentication')
            result = db.loadCsvToDb(file, token)
            if result == 'inDatabase':
                returnMsg = file.filename + 'already in the database'
            elif result == 'invalidUser':
                returnMsg = file.filename + 'could not be uploaded'
            
            filenames.append(file.filename)
    if returnMsg == 'was uploaded successfully!':
        return jsonify({'message': returnMsg}), 200
    else:
        return jsonify({'error': f'{", ".join(filenames)} {returnMsg}'}), 400


#Given two datasets of event and detect their relationships
@app.route("/detect_relationships", methods=["POST"])
def detect_relationships():
    try:
        data = request.get_json()
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format, expected a dictionary'}), 400

        events1 = data.get("event1")
        events2 = data.get("event2")
        # Validate that events1 and events2 are not None and are lists
        if events1 is None or events2 is None:
            return jsonify({'error': 'event1 and event2 must be provided in the request body'}), 400
        if not isinstance(events1, list) or not isinstance(events2, list):
            return jsonify({'error': 'event1 and event2 must be lists of dictionaries'}), 400

        # Correlate complex events without re-detecting them
        correlate_events = eventProcessor.correlate_complex_events(events1, events2)
        # Include relationships in the response
        correlation_results = {
            'relationships': correlate_events
        }
        return jsonify(correlation_results)
    except Exception as e:
        error_message = str(e)
        print(f"Error: {error_message}")
        return jsonify({'error': error_message}), 500

@app.route('/detectCorrelation', methods=['POST'])
def detect_correlation_route():
    try:
        data = request.get_json()
        stock1_data = pd.DataFrame(data.get('stock1', []))
        stock2_data = pd.DataFrame(data.get('stock2', []))

        correlation = eventProcessor.calculate_correlation(stock1_data, stock2_data)
        if abs(correlation) >= 0.7:
            result_corr = "Strong Correlation"
        elif abs(correlation) >= 0.3:
            result_corr = "Moderate Correlation"
        elif abs(correlation) >= 0.1:
            result_corr = "Weak Correlation"
        else: 
            result_corr = "No correlation"

        covariance = eventProcessor.calculate_covariance(stock1_data, stock2_data)
        if abs(covariance) >= 0.001:
            result_cov = "Strong covariance"
        elif abs(covariance) >= 0.0001:
            result_cov = "Moderate covariance"
        elif abs(covariance) >= 0.00001:
            result_cov = "Weak covariance"
        else:
            result_cov = "No covariance"

        return jsonify({
            'correlation':{
                'conditon' :result_corr ,
                'value': abs(correlation)
            },  
            'covariance': {
                'condition': result_cov,
                'value': abs(covariance),
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
