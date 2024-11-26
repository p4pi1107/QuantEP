import { useState } from 'react';
import EventTable from './EventTable';


export function CustomEvents() {
    const [tables, setTables] = useState([<EventTable key={0}/>])
    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <h1>Events</h1>
            </div>
            {tables}
        </div>
    );
}