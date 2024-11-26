import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import { login, register, logout, verifyToken } from './authenticator/auth';
import http, { get } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { deleteFile, getCustomEvents, getFileList, getSelectState, processEvents, saveCustomEvents, saveFileChoice } from './eventManager';
import { dbManager } from './database/databaseManager'
import fs from 'fs';
import multer from 'multer';


// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
const importer = multer({ storage: multer.memoryStorage() } );

const db = new dbManager()
if (!fs.existsSync("/database/database.sqlite3")) {
  db.initDb()
}


const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = '0.0.0.0';

// Login endpoint
app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password, db)
    return res.json(result)

  } catch (error) {
    next(error);
  }
});

// Register endpoint
app.post('/register', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    console.log(email, password, username)
    const result = await register(email, password, username, db);
    return res.json(result)

  } catch (error) {
    next(error);
  }
});

// Logout endpoint
app.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.token as string
    const result = await logout(token, db);
    return res.json(result)

  } catch (error) {
    next(error);
  }
});

// Token verification endpoint
app.post('/verify', async (req, res, next) => {
  try {
    const token = req.headers.token as string
    const result = await verifyToken(token, db)
    return res.json(result)
  } catch (error) {
    next(error)
  }
})

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

// Open websocket server
wss.on('connection', async (ws) => {
  console.log('Client connected');
  // Starts listening for messages from frontend, run operations based on received message

  ws.on('message', async (message: any) => {
    console.log(`Received message from client: ${message}`);
    message = JSON.parse(message);
    // Saves user file choices and custom events
    if (message.type == 'CustomEvents') {
      try {
        await saveFileChoice(message.fileList, db, message.authentication);
        await saveCustomEvents(message.payload, db, message.authentication);
        ws.send(JSON.stringify({ success: 'Succesful' }))
      } catch (error) {
        console.error('Error fetching or processing data:', error);
        ws.send(JSON.stringify({ error: 'Error fetching or processing data' }));
      }
    }

    // Saves only user file choices for system defined events
    else if (message.type == 'fileSelection') {
      try {
        await saveFileChoice(message.fileList, db, message.authentication);
        ws.send(JSON.stringify({ success: 'Succesful' }))
      } catch (error) {
        console.error('Error saveing files:', error);
        ws.send(JSON.stringify({ error: 'Error saving files' }));
      }
    }

    // Fetches processed data from flask engine
    else if (message.type == 'dataReq') {
      try {
        // Ensures user selected files to process
        const selectState = await getSelectState(db, message.authentication)
        if (selectState == false) {
          ws.send(JSON.stringify({ error: 'User has not selected file' }));
        } 
        // Process events with or without custom events
        else {
          const customEvents: [] = await getCustomEvents(db, message.authentication)
          if (customEvents.length == 0) {
            await processEvents(ws, message.authentication);
          } else {
            await processEvents(ws, message.authentication, customEvents);
          }
        }
      } catch (error) {
        console.error('Error fetching or processing data:', error);
        ws.send(JSON.stringify({ error: 'Error fetching or processing data' }));
      }
    } 

    // Fetches list of user files stored in db
    else if (message.type == 'fileList') {
      try {
        const fileList: [] = await getFileList(db, message.authentication)
        if (fileList.length == 0) {
          ws.send(JSON.stringify({ fileList: [] }));
        } else {
          ws.send(JSON.stringify({ fileList: fileList }));
        }
      } catch (error) {
        console.error('Error fetching fileList:', error);
        ws.send(JSON.stringify({ error: 'Error fetching fileList' }));
        }
    } 
    
    // Deletes file from db based list provided by frontend
    else if (message.type == 'deleteFile') {
      try {
        const result = await deleteFile(db, message.authentication, message.filetoDelete)
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Error deleting file' }));
      }
    }
  });
    
});


// start server
server.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  db.close()
  server.close(() => console.log('Shutting down server gracefully.'));
});
