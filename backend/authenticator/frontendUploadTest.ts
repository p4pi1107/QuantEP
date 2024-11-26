import WebSocket from 'ws';

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';


async function sendCsvFile(filePath: string) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post('http://localhost:3000/import', form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    console.log('File uploaded successfully', response.data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// Example usage:
const filePath = '../dataStreamAPI/datasets/AAPL.csv';
sendCsvFile(filePath);


// ws.on('open', () => {
//   console.log('Connected to server');

//   ws.send('Hello, server!');
// });

// ws.on('message', (message) => {
//   console.log(JSON.parse(message)[1]);
// });



// ws.on('close', () => {
//   console.log('Disconnected from server');
// });

