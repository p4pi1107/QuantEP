import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'
import { Box, Button, Card, CardActions, CardContent, FilledInput, FormControl, InputLabel, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    // login error toast (notification)
    const notifyError = () => toast.error('Login failed: Please check if username and password are correct or if you have registered ', {
    });
    const login = async () => {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (response.status === 400 || response.status ==='400') {
            notifyError();
            //alert('login failed: please check if username and password are correct.');
        } else {
            const data = await response.json();
            if (response.ok) {
                // set local storage and tell the app
                window.localStorage.setItem('token', data.token);
                window.dispatchEvent(new Event("storage"))
                navigate('/');
            } else {
                notifyError();
                //alert('login failed: please check if username and password are correct.');
            }
        }
    };

    return (
        <>
            <Card sx={{ pl: 2, pr: 2, width: { sm: 550, xs: 345 }, outline: 'solid', outlineColor: '#DDDDDD', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant='body1' fontWeight='bold'>Log in</Typography>
                        <FormControl sx={{ width: '100%' }} variant="filled">
                        <InputLabel>Email Address</InputLabel>
                        <FilledInput
                            name='email'
                            id="login-email"
                            type='email'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder='sample@gmail.com'
                        />
                        </FormControl>
                        <br />
                        <FormControl sx={{ width: '100%' }} variant="filled">
                        <InputLabel>Password</InputLabel>
                        <FilledInput
                            name='login-password'
                            id="login-password"
                            type='password'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        </FormControl>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                    <Button name="login" onClick={login} variant='filled' sx={{ width: '97%', height: '45px', background: '#000000', color: '#FFFFFF', outline: 'solid', '&:hover': { background: '#FFFFFF', color: '#000000' } }}>
                        <Box fontWeight='bold'>Login</Box>
                    </Button>
                </CardActions>
                <CardContent sx={{ textAlign: 'center' }}>
                    <Link to='/register' className='custom-link'>Don't have an account? Click here to register.</Link>
                </CardContent>
            
            </Card>
        </>
    );
}

export default Login;
    
