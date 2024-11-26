import { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import './Dashboard.css';
import { useWindowWidth, useWindowHeight} from '@react-hook/window-size';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BarChart } from '@mui/x-charts';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export function Dashboard(isLoggedIn) {
    // STATES
    // keep track of list of relationsips
    const [relationships, setRelationships] = useState([]);
    const [compRelationshipData, setCompRelationshipData] = useState({});
    // keep track of list of events
    const [events, setEvents] = useState([]);
    // stock prices for graphs.
    const [stockPrices, setStockPrices] = useState([]);
    const [stockPrices2, setStockPrices2] = useState([]);
    //set states for showing stocks
    const [isEvent, setIsEvent] = useState(true);
    const [stockNum, setStockNum] = useState(99999);
    const [stockName, setStockName] = useState('null');
    const [stockName2, setStockName2] = useState('null');
    // window size state
    const winHeight = useWindowHeight();
    const winWidth = useWindowWidth();
    // for time period: store the current start and end time
    const [startTimeIndex, setStartTimeIndex] = useState(0);
    const [endTimeIndex, setEndTimeIndex] = useState(0);
    const [startTimeIndex2, setStartTimeIndex2] = useState(0);
    const [endTimeIndex2, setEndTimeIndex2] = useState(0);
    // usestate for barchart
    const [barChartField, setBarChartField] = useState('name');
    const [barChartDataset, setBarChartDataset] = useState([]);

    // FUNCTIONS AND CONSTS

    // for parsing the whole data stream
    function parsingEvents(messageStream, stockNum) {
        // map out all events
        const evnts = []
        for (let i = 0; i < messageStream.length; i++) {
            // check if event exist in index 1
            if (messageStream[i][1] != null && messageStream[i][0] != null) {
                //set const, then add date to the dict
                // loop through all the events in the time period
                for (let j = 1; j < messageStream[i].length; j++) {
                    let e = messageStream[i][j];
                    e.id = messageStream[i][j].Eventid;
                    //set datec
                    e.name = messageStream[i][0].data.name;
                    // set stockname
                    if (stockNum === 1) {
                        setStockName(e.name);
                    } else {
                        setStockName2(e.name);
                    }

                    e.stock = stockNum;
                    e.time = new Date(messageStream[i][0].date);
                    e.action = messageStream[i][j].action.charAt(0).toUpperCase() + messageStream[i][j].action.slice(1);
                    //push the event to the list
                    evnts.push(e);
                    setEvents(ev => [...ev, e]);
                }
            }
        }
        return evnts;
    }

    // for parsing the prices of a stock
    function parsingPrices(messageStream, stockNum) {
        const prices = [];
        for (let i = 0; i < messageStream.length; i++) {
            //set const and add date
            if (messageStream[i][0] != null) {  
                const p = messageStream[i][0].data;
                p.time = new Date(messageStream[i][0].date);
                // initially null event
                p.event = [];
                for (let j = 0; j < messageStream[i].length; j++) {
                    p.event.push(messageStream[i][j]);
                }
                prices.push(messageStream[i][0].data);
            }
        }

        if (stockNum === 1) {
            setStockPrices(prices);
            setEndTimeIndex(prices.length - 1);

        } else {
            setStockPrices2(prices);
            setEndTimeIndex2(prices.length - 1);

        }
        return prices;
    }

    // function for finding event according to id
    function findEvent(eid) {
        for (let i = 0; i < events.length; i++) {
            if (events[i].id === eid) {
                return events[i];
            }
        }
        return null;
    }
    

    // find unique date values
    // return a list of dates
    function uniqueDatesRelationships() {
        const result = []
        const dates = []
        for (let i = 0; i < relationships.length; i++) {
            // if not in list, push
            if (! dates.includes(relationships[i].date)) {
                result.push(relationships[i]);
                dates.push(relationships[i].date)
            }
        }
        result.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
        return result.reverse();
    }
    //function for generating relationships
    function generateRelationshipCards() {
        // new reg exp for detectiing if relationship is pos or negative
        const posRelation = new RegExp('Bullish');
        // const negRelation = new RegExp('Bearish');
        // replace string in conclusion
        // only 3 cards, so only the first 3 relationships
        // sort the relationships first, in reverse order
        const reverseSortedRelationships = uniqueDatesRelationships();
        const l = reverseSortedRelationships.slice(0, 3).map((relationship) =>
            <div className="relationship-card" onClick={ () => relationshipClicked() }>
                <div className='r-card-left-border' style={ posRelation.test(relationship.conclusion) ? {backgroundColor: 'lightgreen'} : {backgroundColor: '#FF474C'} }></div>            
                <div className='r-card-group'>
                    <h3 className='r-card-title'> { relationship.conclusion } </h3>
                    <p> {`${String(relationship.date).slice(4,24)}`} </p>
                    <div className='r-card-events'>
                        <p> {relationship.event1.condition === null ? `${relationship.event1.name}, ${relationship.event2.name}` : `${relationship.event1.name}, ${relationship.event2.name}: ${relationship.event1.condition}`} </p>
                    </div>
                    { posRelation.test(relationship.conclusion) ? 
                        <svg className='relationship-card-sign' width="50px" height="50px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 7L13 15L9 11L3 17M21 7H15M21 7V13" stroke="#008000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>

                        : <svg width="50px" height="50px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 17L13 9L9 13L3 7M21 17H15M21 17V11" stroke="#FF0000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    }
                </div>
            </div>
        )
        return l;
    }

    // function for parsing complex relationship
    // adds to the relationship list
    function parseRelationships (data) {
        const rels = []
        const relationshipData = data.relationships;
        // loop through all properties
        for (const rel in relationshipData) {
            // if rel .exist is true, get the details and form relationship
            if (relationshipData[rel].Exist === true || relationshipData[rel].Exist === 'true') {
                // find the details using events list
                // only get last 2 events (latest 2)
                let eventsList = relationshipData[rel].Events
                findEvent(eventsList[eventsList.length - 1]);
                let newRel = {
                    conclusion: rel,
                    date: findEvent(eventsList[eventsList.length - 1]).time,
                    event1: findEvent(eventsList[eventsList.length - 2]),
                    event2: findEvent(eventsList[eventsList.length - 1]),
                }
                rels.push(newRel);
                setRelationships(relss => [...relss, newRel]);
            }
        }
    }



    // useeffect for web socket
    // gets the data from the web socket connected to backend
    // TCP

    useEffect(() => {
        //web socket
        const ws = new WebSocket('ws://localhost:3000');
        if (isLoggedIn) {
            const loadingToastID = toast('⌛ Loading events... hang on!', {
                autoClose: false
            });
            
            // open the connection to server
            ws.onopen = () => {
                //request data from server
                ws.send(JSON.stringify({type: 'dataReq', authentication: window.localStorage.getItem('token')}));
            }
    
            // what to do when gets the message from server
            ws.onmessage = (message) => {
                let readData = JSON.parse(message.data);
                if (typeof readData[1] != 'undefined' && typeof readData[2] != 'undefined') {
                    // parse both stock data
                    parsingEvents(readData[1], 1);
                    parsingPrices(readData[1], 1);
                    parsingEvents(readData[2], 2);
                    parsingPrices(readData[2], 2);
                    toast.update(loadingToastID, {
                        render:'✅ Done!',
                        autoClose: 3000,
                    });
                } else if (readData.error) {
                    // if error (no message yet), raise error toast
                    toast.update(loadingToastID, {
                        render:'No data available yet: go to the custom events page to upload data and come back.',
                        autoClose: 3000,
                    });
                } else if (readData.relationships) {
                    // if its relationship message, set relationships state
                    setCompRelationshipData(readData);
                }
            };
    
            ws.onclose = () => {
                console.log('Disconnected from server');
            }
        } else {
            ws.close()
        }
    }, []);
    
    // function for loading graph labels
    function graphLabels (Events) {
        // result string
        let res = `$${Events[0].data.price}; `
        // loop through events
        for (let i = 1; i < Events.length; i++) {
            // form string
            res = res + `${Events[i].Event}; `
        }
        return res;
    }

    // function for fixing time string format
    function generateTimeString(timeString) {
        const strList = timeString.split(' ');
        return strList[1] + ' ' + strList[2] + ' ' + strList[3] + ' ' + strList[4];
    }
    // function for generating dropdown option
    function generateDropdown() {
        // initialize empty list
        const res = stockPrices.map((p, i) =>
            <MenuItem value={i}>{generateTimeString(p.time.toString())}</MenuItem>
        );
        return res;
    }

    function generateDropdown2() {
        // initialize empty list
        const res = stockPrices2.map((p, i) => 
            <MenuItem value={i}>{generateTimeString(p.time.toString())}</MenuItem>
        );
        return res;
    }

    //use effect for events distribution analysis
    //listens to changes in barChartField
    useEffect(() => {
        //form list according to given field
        // find all unique vals of the field
        const vals = [];
        for (let i = 0; i < events.length; i++) {
            if ( ! vals.includes(events[i][barChartField]) ) {
                // if not included, add to the list
                vals.push(events[i][barChartField]);
            }
        }

        const res = [];
        //now that vals contains only unique values of the given field, now map it
        for (let i = 0; i < vals.length; i++) {
            // set item first
            let itemToAdd = {};
            //change field and count
            itemToAdd[barChartField] = vals[i];
            itemToAdd['count'] = events.filter(e => e[barChartField] === vals[i]).length;
            // push item
            res.push(itemToAdd);
        }
        // mutate the array state (bar chart dataset)
        setBarChartDataset([...res]);
    }, [events, barChartField]);


    // handles the start time changes
    // ref: https://mui.com/material-ui/react-select/
    const handleChangeStartTime = (event) => {
        // check if the start index is smaller or equal to end index
        // if not, raise an error
        if (event.target.value > endTimeIndex) {
            toast.error('Error: Please use a start time that is before the end time.', {});
        } else {
            setStartTimeIndex(event.target.value);
        }
    };

    // handles the end time changes
    // ref: https://mui.com/material-ui/react-select/
    const handleChangeEndTime = (event) => {
        // check if the start index is smaller or equal to end index
        // if not, raise an error
        if (event.target.value < startTimeIndex) {
            toast.error('Error: Please use an end time that is after the start time.', {});
        } else {
            setEndTimeIndex(event.target.value);
        }
    };

    // handles the start time changes
    // ref: https://mui.com/material-ui/react-select/
    const handleChangeStartTime2 = (event) => {
        // check if the start index is smaller or equal to end index
        // if not, raise an error
        if (event.target.value > endTimeIndex2) {
            toast.error('Error: Please use a start time that is before the end time.', {});
        } else {
            setStartTimeIndex2(event.target.value);
        }
    };

    // handles the end time changes 2
    // ref: https://mui.com/material-ui/react-select/
    const handleChangeEndTime2 = (event) => {
        // check if the start index is smaller or equal to end index
        // if not, raise an error
        if (event.target.value < startTimeIndex2) {
            toast.error('Error: Please use an end time that is after the start time.', {});
        } else {
            setEndTimeIndex2(event.target.value);
        }
    };


    useEffect(() => {
        // find simple relationships according to price events
        // logic handled in frontend
        function findSimpleRelationships() {
            //filter events to just price events
            const priceEvents = events.filter((e) => (e.Event === "Significant percentage increase" || e.Event === "Significant percentage decrease"));
            priceEvents.sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
            const rels = [];
            // loop through all events
            for (let i = 0; i < priceEvents.length; i++) {
                // see condition
                // possible conditions:
                /*
                "Increased more than 2% within 24 hours"
                "Decreased more than 2% within 24 hours"
                */
                let cond = priceEvents[i].condition;
                let stkname = priceEvents[i].name;
                let dte = Date.parse(priceEvents[i].time);
                // loop through all the events after that
                for (let j = i + 1; j < priceEvents.length; j++) {
                    // if same condition and diff name, check date
                    if (cond === priceEvents[j].condition && stkname !== priceEvents[j].name) {
                        // if the date is within 24 hours, add to the relationship list
                        // calculation ref: https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
                        let dte2 = Date.parse(priceEvents[j].time);
                        let daysDiff = Math.round((dte2 - dte) / (1000 * 3600 * 24));
                        let relationshipCond = "";
                        // set relationship condition
                        if (cond === "Increased more than 2% within 24 hours") {
                            relationshipCond = "Simple Bullish Market";
                        } else {
                            relationshipCond = "Simple Bearish Market";
                        }
                        // see if the event is less than 1 day apart
                        if (daysDiff <= 1) {
                            // append new relationship
                            if (dte < dte2) {
                                let newRel = {
                                    conclusion: relationshipCond,
                                    date: priceEvents[j].time,
                                    event1: priceEvents[i],
                                    event2: priceEvents[j],
                                }
                                rels.push(newRel);
                                setRelationships(relss => [...relss, newRel]);
                            }
                        }
                    }
                }
            }
        }
        findSimpleRelationships();
        parseRelationships(compRelationshipData);
    }, [events, compRelationshipData])

    // const of graph 1 and 2
    const stockGraph1 = () => {
        return (
            <div>
                <h4><center>Showing stocks: {stockName} </center></h4>
                <center>
                    <FormControl sx={{backgroundColor: "#111111 !important", color: "#ffffff !important", borderColor: "#E0E0E0"}}>
                        <InputLabel id="start-label"sx={{color: "#E0E0E0 !important"}}>Start</InputLabel>
                        <Select
                            sx={{
                                "& .MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl":{
                                    borderColor: "#E0E0E0 !important",
                                },

                                "& .MuiSelect-select":{
                                    color: "#E0E0E0 !important",
                                },

                                "& .MuiSvgIcon-root":{
                                    color: "#E0E0E0 !important",
                                },
                                "& .MuiOutlinedInput-notchedOutline ":{
                                    borderColor: "#E0E0E0 !important",
                                }
                            }}
                            labelId="start-label"
                            id="start"
                            value={startTimeIndex}
                            label="Start Time"
                            onChange={handleChangeStartTime}
                        >
                            {generateDropdown()}
                        </Select>
                    </FormControl>
                    <FormControl sx={{backgroundColor: "#111111 !important", color: "#ffffff !important", borderColor: "#E0E0E0"}}>
                        <InputLabel id="end-label"sx={{color: "#E0E0E0 !important"}}>End</InputLabel>
                        <Select
                            sx={{
                                "& .MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl":{
                                    borderColor: "#E0E0E0 !important",
                                },

                                "& .MuiSelect-select":{
                                    color: "#E0E0E0 !important",
                                },

                                "& .MuiSvgIcon-root":{
                                    color: "#E0E0E0 !important",
                                },
                                "& .MuiOutlinedInput-notchedOutline ":{
                                    borderColor: "#E0E0E0 !important",
                                }
                            }}
                            labelId="end-label"
                            id="end"
                            value={endTimeIndex}
                            label="End Time"
                            onChange={handleChangeEndTime}
                        >
                            {generateDropdown()}
                        </Select>
                    </FormControl>
                </center>

                <LineChart
                    grid={{horizontal: true}}
                    sx={{
                        "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel":{
                            strokeWidth:"1",
                            fill:"#E0E0E0"
                        },

                        "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel":{
                            fill:"#E0E0E0"
                        },
                        "& .MuiChartsLegend-itemLabel": {
                        color: "#ffffff !important", // Ensure the text color is white
                        },
                        "& .MuiChartsLegend-root text": {
                            fill: "#ffffff !important", // Ensure the text color is white
                        },
                        fontFamily: '"Inter", sans-serif',
                        color: '#E0E0E0'
                    }} 
                        dataset={stockPrices.slice(startTimeIndex, endTimeIndex + 1)}
                    xAxis={[
                        {
                            scaleType: "time",
                            dataKey: 'time',
                            axisLabel: 'Time',
                        }
                    ]}
                    series={[
                        {
                            curve: "linear",
                            dataKey: 'price',
                            label: stockName,
                            color: '#3f51b5', //change the colour of graph
                            showMark: ({ index }) => stockPrices[index].event.length < 0,
                            valueFormatter: (v, {dataIndex}) => {
                                if (stockPrices[dataIndex].event.length <= 1) {
                                    return `$${v} --- No event detected here.`
                                } else {
                                    return graphLabels(stockPrices[dataIndex].event)
                                }
                            }
                        }
                    ]}
                    height={winWidth > 600 ? winHeight * 0.45 : winHeight * 0.7}
                    width={winWidth > 600 ? winWidth * 0.45 : winWidth * 0.85}
                />

            </div>
        );
    }

    //second stock graph
    const stockGraph2 = () => {
        return (
            <div>
                <h4><center>Showing stocks: {stockName2} </center></h4>
                <center>
                    <FormControl sx={{backgroundColor: "#111111 !important", color: "#ffffff !important", borderColor: "#E0E0E0"}}>
                        <InputLabel id="start-label2"sx={{color: "#E0E0E0 !important"}}>Start</InputLabel>
                        <Select
                            sx={{
                                "& .MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl":{
                                    borderColor: "#E0E0E0 !important",
                                },

                                "& .MuiSelect-select":{
                                    color: "#E0E0E0 !important",
                                },

                                "& .MuiSvgIcon-root":{
                                    color: "#E0E0E0 !important",
                                },
                                "& .MuiOutlinedInput-notchedOutline ":{
                                    borderColor: "#E0E0E0 !important",
                                }
                            }}
                            labelId="start-label"
                            id="start2"
                            value={startTimeIndex2}
                            label="Start Time 2"
                            onChange={handleChangeStartTime2}
                        >
                            {generateDropdown2()}
                        </Select>
                    </FormControl>
                    <FormControl sx={{backgroundColor: "#111111 !important", color: "#ffffff !important", borderColor: "#E0E0E0"}}>
                        <InputLabel id="end-label2" sx={{color: "#E0E0E0 !important"}}>End</InputLabel>
                        <Select
                            sx={{
                                "& .MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl":{
                                    borderColor: "#E0E0E0 !important",
                                },

                                "& .MuiSelect-select":{
                                    color: "#E0E0E0 !important",
                                },

                                "& .MuiSvgIcon-root":{
                                    color: "#E0E0E0 !important",
                                },
                                "& .MuiOutlinedInput-notchedOutline ":{
                                    borderColor: "#E0E0E0 !important",
                                }
                            }}
                            labelId="end-label2"
                            id="end2"
                            value={endTimeIndex2}
                            label="End Time 2"
                            onChange={handleChangeEndTime2}
                        >
                            {generateDropdown2()}
                        </Select>
                    </FormControl>
                </center>
            
                <LineChart
                    grid={{horizontal: true}}
                    sx={{
                        "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel":{
                            strokeWidth:"1",
                            fill:"#E0E0E0"
                        },

                        "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel":{
                            fill:"#E0E0E0"
                        },
                        "& .MuiChartsLegend-itemLabel": {
                        color: "#ffffff !important", // Ensure the text color is white
                    },
                    "& .MuiChartsLegend-root text": {
                        fill: "#ffffff !important", // Ensure the text color is white
                    },
                        fontFamily: '"Inter", sans-serif',
                    }}
                    dataset={stockPrices2.slice(startTimeIndex2, endTimeIndex2 + 1)}
                    xAxis={[
                        {
                            scaleType: "time",
                            dataKey: 'time',
                            axisLabel: 'Time',
                        }
                    ]}
                    series={[
                        {
                            curve: "linear",
                            dataKey: 'price',
                            label: stockName2,
                            color: '#DA7C30', //change the colour of graph
                            showMark: ({ index }) => stockPrices2[index].event.length < 0,
                            valueFormatter: (v, {dataIndex}) => {
                                if (stockPrices2[dataIndex].event.length <= 1) {
                                    return `$${v} --- No event detected here.`
                                } else {
                                    return graphLabels(stockPrices2[dataIndex].event)
                                }
                            }
                        }
                    ]}
                    height={winWidth > 600 ? winHeight * 0.45 : winHeight * 0.7}
                    width={winWidth > 600 ? winWidth * 0.45 : winWidth * 0.85}
                />
            </div>
        );
    }
    // function for loading graphs
    // if an event is clicked, show the stock prices chart according to stock number (1 or 2)
    // else: show all graphs
    function loadGraphs (isEvent, stockNum) {
        if (isEvent) {
            // load event according to stock number
            if (stockNum === 1) {
                // show first stock
                return (
                    stockGraph1()
                );
            } else if (stockNum === 2) {
                // show second stock
                return (
                    stockGraph2()
                );
            } else {
                return (
                    <>
                        <h2><center>Click on a relationship/event to see stock graphs!</center></h2>
                    </>
                );
            }
        } else {
            return (
                [stockGraph1(), stockGraph2()]
            );
        }
    }

    // event click event
    function eventClicked(stockNumber) {
        //set stock number and isevent
        setStockNum(stockNumber);
        setIsEvent(true);
    }

    function relationshipClicked() {
        setIsEvent(false)
    }

    //defining columns for the events list
    const columns = [
        { field: 'id', headerName: 'EventID', minWidth: 120, headerClassName:'super-app-theme--header'},
        { field: 'name', headerName: 'Stock', minWidth: 100, headerClassName:'super-app-theme--header'},
        { field: 'Event', headerName: 'Event', minWidth: 250, headerClassName:'super-app-theme--header'},
        { field: 'action', headerName: 'Action', minWidth: 150, headerClassName:'super-app-theme--header'},
        { field: 'condition', headerName: 'Condition', minWidth: 350, headerClassName:'super-app-theme--header'},
        { field: 'time', headerName: 'Time', minWidth: 400, headerClassName:'super-app-theme--header', valueFormatter: params => String(params).slice(4,24)},
      ];
    
    const handleChangeField = (event) => {
        setBarChartField(event.target.value);
    };

    return (
        // return list of relationship cards (3 cards)
        // showing the 3 latest relationsips detected, left to right
        
        // Events list section
        // For each event, show condition satisfied, stock and the action
        <div className='dashboard-body'>
            <div className='dashboard-title-section'>
                <h1><center>{(stockName !== 'null' && stockName2 !== 'null') ? `Analysing Stocks: ${stockName} & ${stockName2}` : 'No Stocks Yet!'}</center></h1>
                <h1><center>You have <b>{events.length}</b> Events 📈.</center></h1>
            </div>
            <div className='relationship-block'>
                <h2><center> My Relationships </center></h2>
                <div className="relationship-section">
                    {generateRelationshipCards()}
                </div>
            </div>
            <div className='stock-chart-section'>
                <div className='chart-container'>
                    { loadGraphs(isEvent, stockNum) }
                </div>
            </div>
            <div className='events-list-section'>
                <h2> <center>My Events</center></h2>

                <Box sx={{
                    fontWeight: 'bold',
                    margin: 'auto',
                    maxWidth: '90%',
                    borderColor:'#444444',
                }}>
                    <DataGrid
                        sx={{
                            color:'#E0E0E0',
                            backgroundColor: '#444444',
                            '& .super-app-theme--header': {
                                backgroundColor: '#363636',
                            },
                            '&:hover': {
                                cursor: 'pointer',
                            },
                            fontFamily: '"Inter", sans-serif',
                            '& .action-Buy': {
                                backgroundColor: '#16a085',
                            },
                            '& .action-Sell': {
                                backgroundColor: '#e23636',
                            },
                            '& .action-Hold': {
                                backgroundColor: '#043b5c',
                            },
                        }}
                        getRowClassName={(params) => `action-${params.row.action}`}
                        onRowClick={(params) => eventClicked(params.row.stock)}
                        rows={events}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 10 },
                            },
                        }}
                        pageSizeOptions={[5, 10, 100]}
                        checkboxSelection={false}
                    />
                    <h2> <center>Events analysis</center></h2>
                    <FormControl fullWidth sx={{backgroundColor: "#111111 !important", color: "#ffffff !important", borderColor: "#E0E0E0"}}>
                        <InputLabel id="field-label" sx={{color: "#E0E0E0 !important"}}>Field</InputLabel>
                        <Select
                            sx={{
                                "& .MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl":{
                                    borderColor: "#E0E0E0 !important",
                                },

                                "& .MuiSelect-select":{
                                    color: "#E0E0E0 !important",
                                },

                                "& .MuiSvgIcon-root":{
                                    color: "#E0E0E0 !important",
                                },
                                "& .MuiOutlinedInput-notchedOutline ":{
                                    borderColor: "#E0E0E0 !important",
                                }
                            }}
                            labelId="field-label"
                            id="field"
                            value={barChartField}
                            label="Field"
                            onChange={handleChangeField}
                        >
                            <MenuItem value={'action'}>Action</MenuItem>
                            <MenuItem value={'name'}>Stock</MenuItem>
                            <MenuItem value={'Event'}>Event</MenuItem>
                        </Select>
                    </FormControl>
                        <center>
                            <BarChart
                                sx={{
                                    "& .MuiChartsAxis-left .MuiChartsAxis-tickLabel":{
                                        fill:"#E0E0E0",
                                    },

                                    "& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel":{
                                        fill:"#E0E0E0",
                                    },

                                    "&. MuiChartsLegend-series": {
                                        fill:"#E0E0E0",
                                    },
                                    "& .MuiChartsLegend-itemLabel": {
                                        color: "#ffffff !important", // Ensure the text color is white
                                    },
                                    "& .MuiChartsLegend-root text": {
                                        fill: "#ffffff !important", // Ensure the text color is white
                                    },
                                    fontFamily: '"Inter", sans-serif',
                                }}
                                margin={{left: 200}}
                                dataset={barChartDataset}
                                yAxis={[{ scaleType: 'band', dataKey: barChartField }]}
                                series={[{ dataKey: 'count', label: barChartField }]}
                                layout="horizontal"
                                grid={{ vertical: true }}
                                height={winWidth > 600 ? winHeight * 0.45 : winHeight * 0.7}
                                width={winWidth > 600 ? winWidth * 0.45 : winWidth * 0.7}
                            />
                        </center>
                </Box>
            </div>
        </div>
    );
}