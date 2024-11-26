import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EventTable.css';
import {
    Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Select, MenuItem, Input, Box, FormControlLabel, 
    Checkbox, List, ListItem, ListItemText
} from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const EventTable  = () => {
    const [data, setData] = useState([{ condition: '', action: '', percentage: '' }]);
    const [newEvent, setNewEvent] = useState({condition: '', action:'', percentage: ''});
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [stockNames, setStockNames] = useState([]);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [hasSufficientFiles, setHasSufficientFiles] = useState(false);
    const navigate = useNavigate();

    //Render dataset from backend
    useEffect(() => {
        toast.dismiss();
        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            ws.send(JSON.stringify({type: 'fileList', authentication: window.localStorage.getItem('token')}));
        }

        ws.onmessage = (message) => {
            const parsedData = JSON.parse(message.data);
            const collectedList = parsedData.fileList 
            //Check if the amount of data in the backend is not empty
            if (collectedList.length !== 0) {
                let stocknum = 0
                let stocknames = [];
                const initial = [];
                for (const key in collectedList) {
                    // collect the stock names
                    stocknames.push(collectedList[key].savedFile);
                    if (collectedList[key].inUse === 1) {
                        initial.push(collectedList[key].savedFile);
                    }
                    stocknum += 1;
                }
                setStockNames(stocknames);
                setSelectedStocks(initial);
                if (stocknum >= 2) {
                    setHasSufficientFiles(true);
                }
            } else {
                toast.error('No data currently in the database');
            }
        };

        ws.onclose = () => {
        };

        return () => {
            ws.close();
        };
    }, []);
    //Handles user changing what files they want to import
    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
    };
    //Handles uploading files to the backend
    const handleFileUpload = async () => {
        if (selectedFiles.length >= 2) {
            const formData = new FormData();
            selectedFiles.forEach((file, index) => {
                formData.append(`file`, file);
            });
            const loadingToastId = toast('Uploading file...', {
                autoClose: true,
            });
            try {
                const response = await axios.post('http://localhost:8080/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authentication': window.localStorage.getItem('token')
                    },
                });
                toast.update(loadingToastId, { 
                    render: 'Uploading file..', 
                    type: 'success',
                    autoClose: true,
                });
                const uploadedFileNames = selectedFiles.map(file => file.name);
                //Used so that the page rerenders to show that the database has been updated with the new files
                setStockNames(prevStockNames => [...prevStockNames, ...uploadedFileNames]);
                setSelectedFiles([]);
                if (stockNames.length + uploadedFileNames.length >= 2) {
                    setHasSufficientFiles(true);
                }
            } catch (error) {
                const errMsg = error.response.data.error;
                toast.update(loadingToastId, { 
                    render: errMsg, 
                    type: 'error',
                    autoClose: true, 
                });
            }
        } else {
            toast.error('Please import at least 2 files');
        }
    }; 
    //Handle adding more custom events
    const handleAddEvent = async () => {
        setData([...data, {...newEvent}]);
        setNewEvent({ condition: '', action: '', percentage: '' });
    };
    //Handles each custom event row when they change their condition/amount/action
    const handleEventChange = (index, e) => {
        const { name, value } = e.target;
        const newData = [...data];
        newData[index][name] = value;
        setData(newData);
    };
    //Handles sending the custom events to the backend
    const handleEventsUpload = () => {
        if (selectedStocks.length < 2) {
            toast.error('Please select at least two stocks');
        } else {
            const ws = new WebSocket('ws://localhost:3000');
            ws.onopen = () => {
                ws.send(JSON.stringify({type: 'CustomEvents', payload: data, fileList: selectedStocks, authentication: window.localStorage.getItem('token')}));
            };
            ws.onmessage = (message) => {
                const response = JSON.parse(message.data)
                if (response.success) {
                    navigate('/');
                } else {
                    toast.error('An error has occured')
                }
            }
        }
    };
    //Send the file choices for the user for what files they want to to process
    const handleFileChoice = async () => {
        if (selectedStocks.length < 2) {
            toast.error('Please Select at least two stocks');
        }
        else {
            const ws = new WebSocket('ws://localhost:3000');
            ws.onopen = () => {
                ws.send(JSON.stringify({type: 'fileSelection', fileList: selectedStocks, authentication: window.localStorage.getItem('token')}));
            };
            ws.onmessage = (message) => {
                const response = JSON.parse(message.data);
                if (response.success) {
                    toast.success('Confirmed Selection.Press "Submit Events" to apply your custom event or navigate to home to see the default events')
                } else {
                    toast.error('An error has occured');
                }
            }
        }
    }
    //Handles the checkbox selection changes
    const handleStockChange = (stockName) => {
        setSelectedStocks(prevSelected => {
            if (prevSelected.includes(stockName)) {
                return prevSelected.filter(stock => stock !== stockName);
            } else if (prevSelected.length < 2) {
                return [...prevSelected, stockName];
            } else {
                toast.error('You can only select up to 2 stocks');
                return prevSelected;
            }
        });
    };
    //Handles deleting custom event rows
    const handleDeleteEvent = (index) => {
        const newData = [...data];
        newData.splice(index,1);
        setData(newData);
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '3%',
            justifyContent: 'center',
            gap: '2em',
        }}>
            {stockNames.length > 0 && (
                <Box sx={{ backgroundColor: '#202020', width: '30%', padding: '5%', borderRadius: '8px' }}>
                    <Typography variant="h6">Select Stocks</Typography>
                    {stockNames.map((stock, index) => (
                        <FormControlLabel
                            key={index}
                            control={
                                <Checkbox
                                    checked={selectedStocks.includes(stock)}
                                    onChange={() => handleStockChange(stock)}
                                    name={stock}
                                    sx={{
                                        color: '#ffffff',
                                        '&.Mui-checked': {
                                            color: '#1976d2', // This changes the color of the checked checkbox
                                        },
                                    }}
                                />
                            }
                            label={<span>{stock}</span>}
                        />
                    ))}
                    <Button variant='contained' className='upload-button' onClick={handleFileChoice} sx={{ mt: 2 }}>
                        Confirm Selection
                    </Button>
                </Box>
            )}
            <Box sx={{ width: '100%', padding: '3%', background: '#202020', borderRadius: '8px', maxWidth: '600px'}}>
                <Box sx={{ display:'flex', flexDirection: 'column', justifyContent: 'space-between' , alignItems: 'center', m: 1 }}>
                    <Typography variant='h6'sx={{ marginBottom: '1rem' }}>Events</Typography>
                    <Box>
                        <input 
                            type='file'
                            accept='.csv'
                            onChange={handleFileChange}
                            id='file-input'
                            style={{ display: 'none' }}
                            multiple
                        />
                        <Button variant='contained' sx={{ marginRight:2 }} className='import-button' onClick={() => document.getElementById('file-input').click()}>
                            Import CSV
                        </Button>
                        <Button variant='contained' className='upload-button' onClick={handleFileUpload}>
                            Upload Files
                        </Button>
                    </Box>
                </Box>
                {selectedFiles.length > 0 && (
                    <Box mb={2} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '%'}}>
                        <Typography sx={{ textAlign: 'center', marginTop: '1rem' }}>Files selected for upload</Typography>
                            <List sx={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center' }}>
                                {selectedFiles.map((file, index) => (
                                    <ListItem key={index} sx={{ borderBottom: '1px solid #ddd' }}>
                                        <ListItemText primary={file.name} />
                                    </ListItem>
                                ))}
                           </List>
                    </Box>
                )}
                {hasSufficientFiles && (
                    <>
                        <TableContainer component={Paper}>
                        <Table sx={{ bodrderCollapse: 'seperate', borderSpacing: '0 8px' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Condition</TableCell>
                                     <TableCell>{data.some(row => ['Price Change Threshold', 'Volume Change'].includes(row.condition)) ? 'Threshold' : 'Percentage'}</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Select
                                                name="condition"
                                                value={row.condition}
                                                onChange={(e) => handleEventChange(index, e)}
                                                fullWidth
                                            >
                                                <MenuItem value="">Select Condition</MenuItem>
                                                <MenuItem value="Price Up">Price Up</MenuItem>
                                                <MenuItem value="Price Down">Price Down</MenuItem>
                                                <MenuItem value="Price Change Threshold">Price Change Threshold</MenuItem>
                                                <MenuItem value="Volume Change">Volume Change</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                        {['Price Change Threshold', 'Volume Change'].includes(row.condition) ? (
                                                <Input
                                                    type="number"
                                                    name="threshold"
                                                    value={row.threshold || ''}
                                                    onChange={(e) => handleEventChange(index, e)}
                                                    placeholder="Threshold"
                                                    fullWidth
                                                />
                                            ) : (
                                                <Input
                                                    type="number"
                                                    name="percentage"
                                                    value={row.percentage}
                                                    onChange={(e) => handleEventChange(index, e)}
                                                    placeholder="Percentage"
                                                    inputProps={{ min: 0 }}
                                                    fullWidth
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                name="action"
                                                value={row.action}
                                                onChange={(e) => handleEventChange(index, e)}
                                                fullWidth
                                            >
                                                <MenuItem value="">Select Action</MenuItem>
                                                <MenuItem value="Buy">Buy</MenuItem>
                                                <MenuItem value="Sell">Sell</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {index > 0 && ( // Only show delete button for rows after the first one
                                                <Button onClick={() => handleDeleteEvent(index)}>
                                                    X
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box mt={2}>
                        <Button variant='contained' className="add-event-button" onClick={handleAddEvent}>
                            Add Event
                        </Button>
                        <Button variant='contained' className="add-event-button" onClick={handleEventsUpload} sx={{ marginLeft: 2 }}>
                            Submit Events
                        </Button>
                    </Box>
                    </>
                )}
            </Box>
        </Box>
    )
};

export default EventTable;
