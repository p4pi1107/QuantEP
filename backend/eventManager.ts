import WebSocket from "ws";
import { dbManager } from "./database/databaseManager";
import { token } from "morgan";

// Function to manage event processing
export async function processEvents(ws: WebSocket, token: string, customEvents?: []) {

  // Fetches data from flask
  const response = await fetch('http://backendengine:8080/stream_ingest', {
    method: 'POST',
    headers: { 'Authentication': token }
  });
  const data = await response.json();
  const { set1, set2 } = data;

  //parse the data
  const parsedData1 = JSON.parse(set1);
  const parsedData2 = JSON.parse(set2);
  const maxLength = Math.max(parsedData1.length, parsedData2.length);

  const events: any = {
    1: [],
    2: []
  };

  const eventPromises: Promise<void>[] = [];

  // Send the data to flask row by row 
  for (let i = 0; i < maxLength; i++) {
    let data1 = [parsedData1[i]];
    let data2 = [parsedData2[i]];
    if (customEvents != undefined) {
      console.log("Custom event not empty")
      data1.push(customEvents)
      data2.push(customEvents)
    }
    // Promise to avoid async issues
    eventPromises.push(new Promise<void>((resolve) => {
      setTimeout(async () => {

        // Detect events for set1
        const eventsResponse1 = await fetch('http://backendengine:8080/detect_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data1) // Send each row wrapped in an array
        });
        const res1 = await eventsResponse1.json();
        events[1].push(res1);  // Maintain the original nested structure

        // Detect events for set2
        const eventsResponse2 = await fetch('http://backendengine:8080/detect_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data2) // Send each row wrapped in an array
        });
        const res2 = await eventsResponse2.json();
        events[2].push(res2);  // Maintain the original nested structure

        resolve();
      }, i * 25); 
    }));
  }
  // Waits for all simple event detections to finish
  await Promise.all(eventPromises);

  // Prepare data for detecting complex relationships
  const flatEvents1 = events[1].flat();  // Flattening nested lists
  const flatEvents2 = events[2].flat();  // Flattening nested lists
  const relationshipsResponse = await fetch('http://backendengine:8080/detect_relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event1: flatEvents1,
      event2: flatEvents2
    })
  });

  const res3 = await relationshipsResponse.json();
  console.log('Relationships Response:', res3);

  // Detect correlations
  const Rescorrelation = await fetch('http://backendengine:8080/detectCorrelation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stock1: parsedData1,
      stock2: parsedData2
    })
  });
  const res4 = await Rescorrelation.json();
  console.log(res4);
  // Send the original events format and relationships to the WebSocket
  ws.send(JSON.stringify(events));
  ws.send(JSON.stringify(res3));
  ws.send(JSON.stringify(res4));
}

// Helper to save custom events to db
export async function saveCustomEvents(customEvents, db: dbManager, token: string) {
  try {
    // Clears user's custom events
    await db.deleteEvents(token)
    for (const customEvent of customEvents) {
      console.log(customEvent)
      // Does nothing if one of the fields are empty
      if (customEvent.condition == "" || (customEvent.percentage == "" && customEvent.threshold == "") || customEvent.action == "") {
        return
      }
      // Saves custom events based on threshold type or percentage type
      if (customEvent.threshold !== undefined) {
        await db.createCustomEvent(token, customEvent.condition, customEvent.threshold, customEvent.action)
      } else {
        await db.createCustomEvent(token, customEvent.condition, customEvent.percentage, customEvent.action)
      }
    }
  } catch (error) {
    throw error
  }
}

// Helper to save file choices
export async function saveFileChoice(fileList: [string], db: dbManager, token: string) {
  await db.saveFileChoice(fileList, token);
}

// Helper to fetch custom events of user
export async function getCustomEvents(db: dbManager, token: string) {
  const customEvents: [] = await db.getCustomEvents(token)
  return customEvents
}

// Helper to fetch list of files in db of user
export async function getFileList(db: dbManager, token: string) {
  try {
    console.log(token)
    const fileList: [] = await db.getFileList(token)
    return fileList
  } catch (error) {
    throw error
  }
}

// Helper to get state of user selections
export async function getSelectState(db: dbManager, token: string) {
  try {
    const selectState = await db.getSelectState(token)
    return selectState
  } catch (error) {
    throw error
  }
}

// Helper to delete saved files
export async function deleteFile(db: dbManager, token: string, filetoDelete: string) {
  try {
    await db.deleteFile(token, filetoDelete)
  } catch (error) {
    throw error
  }
}

