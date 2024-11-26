# QuantEP

Welcome to QuantEP! This project uses a complex event processing engine to detect relationships and events in stock data. Below are the steps to get started with the application, from creating an account to applying custom events on stock datasets.

## Table of Contents

- [Creating an Account](#creating-an-account)
- [Uploading Stock CSV Files](#uploading-stock-csv-files)
- [Selecting Files to Be Processed](#selecting-files-to-be-processed)
- [Applying Custom Events](#applying-custom-events)
- [Dashboard Overview](#dashboard)

## Creating an Account

To use the application, you must first create an account:

1. **Sign Up:** Navigate to the registration page and enter a valid email address.
2. **Password Requirements:** Your password must meet the following criteria:
   - At least 8 characters long
   - Contains both uppercase and lowercase letters
   - Includes at least one special character

3. **Create Account:** After entering your email and password, click the "Create Account" button. You will receive a confirmation email to verify your account.

## Uploading Stock CSV Files

To upload stock data for processing, follow these steps:

1. **Navigate to Custom Events:** From the top menu, select the "Custom Events" tab.
2. **Import Files:** Click the "Import Files" button and select two or more stock CSV files from the Datasets folder provided by us.
3. **Upload Files:** Once selected, press the "Upload" button to upload the files to the database.

## Selecting Files to Be Processed

After uploading your files, you can choose to process them using system-defined events:

1. **Select Files:** Check the boxes next to the files you want to process.
2. **Submit Events:** To process the datasets with system-defined events, click the "Submit Events" button.
3. **Optional:** Alternatively, you can press "Confirm Selection" after checking the boxes and then navigate back to the "Home" tab to automatically process the datasets with the system-defined events.

## Applying Custom Events

For more control over data processing, you can apply custom events:

1. **Input Conditions:** In the custom events section, enter the desired conditions and values into the input boxes.
2. **Add More Events:** If you wish to add additional custom events, click the "Add" button to input more conditions and values.
3. **Submit Events:** Once you've finished defining your custom events, click "Submit Events" to apply them and process the datasets accordingly.

## Dashboard

For Dashboard, click "Home" to see the dashboard after uploading the csv and/or events.

1. **Relationship cards** In the "My Relationship" section, the cards shown are the incurred relationships found among the 2 datasets. Click on it to see the stock graphs of both stocks.
2. **Stock Graph Section** In the "My stocks" section, the stock prices and the events occurred at each prices point are visualized in the form of a graph. Hover the cursor to the graph to see the events at each price. Users can select the start and end times of the charts as well.
3. **Events section** In the "My events" section, events are shown in the form of a list. Click on the top row showing the fields to sort and filter. Below the list, there is a bar chart showing the distribution of events. Choose a field to see the distribution in.
