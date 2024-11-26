import numpy as np


class EventProcessor:
    def __init__(self):
        self.database = {
            'previous_day': None,
            'previous_short_term_ma': None,
            'previous_long_term_ma': None,
        }
        self.unique_id_counter = {'id': 0}

    #helper function to get complex relationships
    def correlate_complex_events(self, complex_events1, complex_events2):
        #initialize the relationship of complex event
        correlation_results = {
            'Bullish Market Confirmation': {
                "Exist": False,
                "Events": []
            }, 
            'Bearish Market Confirmation': {
                "Exist": False,
                "Events": []
            },
            'Gap and Go': {
                "Exist": False,
                "Events": []
            }
        }
        
        #detect the relationship between complex events 
        for event1 in complex_events1:
            for event2 in complex_events2:
                if event1.get("Complex") and event2.get("Complex") and event1.get('Event') == event2.get('Event'):
                    event_name = event1['Event']
                    correlation_results[event_name]["Exist"] = True
                    correlation_results[event_name]["Events"].append(event1['Eventid'])
                    correlation_results[event_name]["Events"].append(event2['Eventid'])

        #make the result of events unique
        for key in correlation_results:
            correlation_results[key]["Events"] = list(set(correlation_results[key]["Events"]))
        return correlation_results
    
    # Get unique id of event
    def get_unique_id(self):
        self.unique_id_counter['id'] += 1
        return self.unique_id_counter['id']
    
    # Detect system defined events
    def defined_events(self, vol_thresh, price_thresh, data, customEvents):
        events = []
        price_change = abs(data['close'] - data['open'])
        ticker_name = data['ticker']
        lastSaved = self.database[ticker_name]['data']

        # Default buy/sell/hold actions
        if lastSaved is not None:
            action = 'sell' if data['close'] > lastSaved['close'] else 'buy'
        else:
            # Default action if no previous day data is available
            action = 'hold'  

        # data header for the events
        events.append({'date': data['date'], 'data': {'price': float(data['close']), 'name': ticker_name}, 'action': action})

        checks = {'price_chg': False, 'volume_chg': False, 'sig_chg': False}
        #check if there are custom events
        if len(customEvents) != 0:
            for event in customEvents:
                #check if the price change surpassed threshold
                if event['condition'] == 'Price Change Threshold' and (float(price_change) > float(event['value']) or float(price_change) <= float(event['value'])):
                    events.append({'id': self.get_unique_id(), 'Event': 'Price change surpassed threshold', 'condition': f'Price change surpassed threshold of ${event["value"]}', 'action': f'{event["action"]}'})
                #check if volume change pass threshold           
                elif event['condition'] == 'Volume Change' and float(data['volume']) > float(event['value']):
                    events.append({'id': self.get_unique_id(), 'Event': 'High volume change', 'condition': f'Volume went pass threshold of {event["value"]}', 'action': f'{event["action"]}'})
        
        #System-defined events
        if float(price_change) > float(price_thresh):
            events.append({'id': self.get_unique_id(), 'Event': 'Price change surpassed threshold', 'condition': f'Price change surpassed threshold of ${price_thresh}', 'action': action})

        if float(data['volume']) > float(vol_thresh):
            events.append({'id': self.get_unique_id(), 'Event': 'High volume change', 'condition': f'Volume went pass threshold of {vol_thresh}', 'action': action})
        
        #detect percentage change
        if data['date'].day != lastSaved['date'].day:
            events = self.change_percentage_day(events, data, 2, customEvents)
            self.database[ticker_name]['data'] = data

        #detect Price Gap
        if self.database[ticker_name] is not None and data['open'] - lastSaved['close'] > float(price_thresh):
            events.append({'id': self.get_unique_id(), 'Event': 'Price gap detected', 'condition': f'Price gap detected as {data["open"] - lastSaved["close"]}', 'action': 'buy'})
        elif self.database[ticker_name] is not None and data['open'] - lastSaved['close'] < 0 - float(price_thresh):
            events.append({'id': self.get_unique_id(), 'Event': 'Price gap detected', 'condition': f'Price gap detected as {data["open"] - lastSaved["close"]}', 'action': 'sell'})

        #detect Price breakout above resistant level and Price breakout below support level
        if lastSaved is not None:
            resistance_level = max(lastSaved['high'], data['high'])
            support_level = min(lastSaved['low'], data['low'])
            if data['close'] > resistance_level:
                events.append({'id': self.get_unique_id(), 'Event': 'Price breakout above resistance', 'condition': f"Price break out above resistant level: ${resistance_level}", 'action': 'buy'})
            if data['close'] < support_level:
                events.append({'id': self.get_unique_id(), 'Event': 'Price breakout below support', 'condition': f"Price drops below support level: ${support_level}", 'action': 'sell'})
        
        return events
    
    # Helper function that detects the percentage change per day
    def change_percentage_day(self, events, data, pct_default, customEvents):
        #initialize the neccessary variables
        prev_close = float(self.database[data['ticker']]['data']['close'])
        pct_chg = (float(data['close']) - prev_close) / prev_close * 100
        #logging for error detection
        print(customEvents)

        #if there is custom event
        if len(customEvents) != 0:
            for event in customEvents:
                if event['condition'] == 'Price Up' and pct_chg >= float(event['value']):
                    events.append({'id': self.get_unique_id(), 'Event': 'Significant price increase', 'condition': f'Increased more than {event["value"]}% within 24 hours', 'action': f'{event["action"]}'})
                elif event['condition'] == 'Price Down' and pct_chg <= (0 - float(event['value'])):
                    events.append({'id': self.get_unique_id(), 'Event': 'Significant price decrease', 'condition': f'Decreased more than {event["value"]}% within 24 hours', 'action': f'{event["action"]}'}) 

        # System defined events
        action = 'buy' if pct_chg < 0 else 'sell'
        if pct_chg > pct_default:
            events.append({'id': self.get_unique_id(), 'Event': 'Significant percentage increase', 'condition': f'Increased more than {pct_default}% within 24 hours', 'action': action})
        elif pct_chg < (0 - pct_default):
            events.append({'id': self.get_unique_id(), 'Event': 'Significant percentage decrease', 'condition': f'Decreased more than {pct_default}% within 24 hours', 'action': action})
        return events

    #helper function that help get complex events based on a list of simple events
    def detect_complex_events(self, events):
        complex_events = []
        #Booleans that indicate whether simple events are happened within short period

        event_entries = [event for event in events if 'Event' in event]
        price_breakout_above = any(event['Event'] == 'Price breakout above resistance' for event in event_entries)
        price_breakout_below = any(event['Event'] == 'Price breakout below support' for event in event_entries)
        significant_price_change = any(event['Event'] == 'Price change surpassed threshold' for event in event_entries)
        high_volume = any(event['Event'] == 'High volume change' for event in event_entries)

        # Bullish Market Confirmation
        if price_breakout_above and significant_price_change and high_volume:
            complex_events.append({'id': self.get_unique_id(), 'Complex Event': 'Bullish Market Confirmation','condition': f'price breakout above resistance level + significant_price_change + high volume' , 'action': 'buy'})

        # Gap and Go
        price_gap = any(event['Event'] == 'Price gap detected' for event in event_entries)
        if price_gap and significant_price_change:
            if any(event.get('action') == 'buy' for event in event_entries) and any(event.get('action') == 'sell' for event in event_entries):
                action = 'hold'
            elif any(event.get('action') == 'buy' for event in event_entries):
                action = 'buy'
            else:
                action = 'sell'
            complex_events.append({'id': self.get_unique_id(), 'Complex Event': 'Gap and Go','condition': 'Price Gap detected + significant price change' ,'action': action})

        # Bearish Market Confirmation
        if price_breakout_below and high_volume and significant_price_change:
            complex_events.append({'id': self.get_unique_id(), 'Complex Event': 'Bearish Market Confirmation', 'condition': f'price breakoout below support level + high volume + significant price change' ,'action': 'sell'})

        return complex_events

    def calculate_correlation(self, stock1_data, stock2_data):
        # Calculate daily returns
        stock1_data['return'] = stock1_data['close'].pct_change()
        stock2_data['return'] = stock2_data['close'].pct_change()

        # Drop NaN values
        stock1_data.dropna(inplace=True)
        stock2_data.dropna(inplace=True)

        # Calculate correlation
        correlation = stock1_data['return'].corr(stock2_data['return'])
        
        return correlation

    def calculate_covariance(self, stock1_data, stock2_data):
        # Ensure 'close' column exists in both dataframes
        if 'close' not in stock1_data.columns or 'close' not in stock2_data.columns:
            raise ValueError("DataFrames must contain 'close' column")

        # Calculate daily returns
        stock1_data['return'] = stock1_data['close'].pct_change()
        stock2_data['return'] = stock2_data['close'].pct_change()

        # Drop NaN values resulting from pct_change
        stock1_data.dropna(inplace=True)
        stock2_data.dropna(inplace=True)

        # Compute covariance matrix
        covariance_matrix = np.cov(stock1_data['return'], stock2_data['return'])

        # Covariance is at [0, 1] or [1, 0] in the matrix
        covariance = covariance_matrix[0, 1]
        return covariance


