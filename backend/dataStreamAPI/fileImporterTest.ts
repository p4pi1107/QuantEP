import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export async function sendCsvFile(file) {
    // Create formData for csv file
    // const form = new FormData();
    // form.append('file', file);
  
    try {
      const response = await axios.post('http://localhost:8080/upload', file, {
        headers: {
          "Content-Type": "multipart/form-data" 
        },
      });
      return { message: 'File uploaded successfully' };
    } catch (error) {
      throw error
    }
  }