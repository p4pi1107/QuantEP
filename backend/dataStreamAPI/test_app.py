import unittest
from app import app, calculate_moving_averages, defined_events, detect_complex_events, correlate_complex_events, change_percentage_day
import json
from flask import jsonify
import pandas as pd
import numpy as np
from datetime import datetime

class TestApp(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_calculate_moving_averages(self):
        data = pd.DataFrame({
            'close': [10, 20, 30, 40, 50]
        })
        result = calculate_moving_averages(data)
        self.assertIn('short_term_ma', result.columns)
        self.assertIn('long_term_ma', result.columns)
    
    # def test_defined_events(self):
    #     data = {
    #         'date': datetime.now(),
    #         'close': 100,
    #         'open': 90,
    #         'volume': 25000,
    #         'short_term_ma': 95,
    #         'long_term_ma': 85,
    #         'ticker': 'AAPL'
    #     }
    #     customEvents = []
    #     result = defined_events(20000, 3, pd.Series(data), customEvents)
    #     self.assertIsInstance(result, list)
    #     self.assertGreater(len(result), 0)
    
    def test_detect_complex_events(self):
        events = [
            {'Event': 'Bullish moving average crossover'},
            {'Event': 'High volume change'}
        ]
        result = detect_complex_events(events)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_correlate_complex_events(self):
      complex_events1 = [
        {'Complex': True , 'Event': 'Bullish Market Confirmation', 'Eventid': 1}
      ]
      complex_events2 = [
        {'Complex': True, 'Event': 'Bullish Market Confirmation', 'Eventid': 2}
      ]
      result = correlate_complex_events(complex_events1, complex_events2)
      self.assertIsInstance(result, dict)
      self.assertIn('Bullish Market Confirmation', result)
      self.assertTrue(result['Bullish Market Confirmation']['Exist'])
      self.assertEqual(len(result['Bullish Market Confirmation']['Events']), 2)


    
    # def test_detect_events_route(self):
    #     data = [{
    #         'date': '2023-01-01 00:00:00',
    #         'close': 100,
    #         'open': 90,
    #         'volume': 25000,
    #         'ticker': 'AAPL'
    #     }]
    #     response = self.app.post('/detect_events', json=data)
    #     self.assertEqual(response.status_code, 200)
    #     self.assertIn('application/json', response.content_type)

    # def test_upload_file(self):
    #     # Add test implementation for upload_file route
    #     pass

    def test_detect_relationships(self):
        data = {
            'event1': [{'Complex': True, 'Event': 'Bullish Market Confirmation', 'Eventid': 1}],
            'event2': [{'Complex': True, 'Event': 'Bullish Market Confirmation', 'Eventid': 2}]
        }
        response = self.app.post('/detect_relationships', json=data)
        print(response.data)  # Log the response data
        self.assertEqual(response.status_code, 200)
        self.assertIn('application/json', response.content_type)
        response_data = json.loads(response.data)
        print(response_data)
        self.assertTrue(response_data['relationships']['Bullish Market Confirmation']['Exist'])
        self.assertEqual(len(response_data['relationships']['Bullish Market Confirmation']['Events']), 2)

if __name__ == '__main__':
    unittest.main()
