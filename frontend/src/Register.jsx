import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'
import { Box, Button, Card, CardActions, CardContent, FilledInput, FormControl, InputLabel, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const notifyError = (message) => toast.error(`😔 Registration failed: ${message}`, {
        theme: 'dark'
    });

    const register = async () => {
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(password)) {
            notifyError('Password must be at least 8 characters long and include a uppercase letter, number, and special character.');
            return;
        }
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, username })
        });
        if (response.status === 400 || response.status ==='400') {
            console.log(response)
            notifyError('Please enter a valid username or a unique email');
        } else {
            const data = await response.json();
            if (response.ok) {
                window.localStorage.setItem('token', data.token);
                window.dispatchEvent(new Event("storage"));
                // navigate('/');
            } else {
                notifyError('Please enter a valid username, a unique email, and a password at least 8 characters long.');
            }
        }
    };

    return (
        <>
        <Card sx={{ pl: 2, pr: 2, width: { sm: 550, xs: 345 }, outline: 'solid', outlineColor: '#DDDDDD', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='body1' fontWeight='bold'>Register</Typography>
                    <FormControl sx={{ width: '100%' }} variant="filled">
                    <InputLabel>Username</InputLabel>
                    <FilledInput
                        name='username'
                        id="username"
                        type='text'
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder='Username'
                    />
                    </FormControl>
                    <br />
                    <FormControl sx={{ width: '100%' }} variant="filled">
                    <InputLabel>Email Address</InputLabel>
                    <FilledInput
                        name='email'
                        id="register-email"
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
                        name='register-password'
                        id="register-password"
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    </FormControl>
                    <br />
                    <FormControl sx={{ width: '100%' }} variant="filled">
                    <InputLabel>Confirm Password</InputLabel>
                    <FilledInput
                        name='confirm-password'
                        id="confirm-password"
                        type='password'
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                    </FormControl>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
                <Button name="register" onClick={register} variant='filled' sx={{ width: '97%', height: '45px', background: '#000000', color: '#FFFFFF', outline: 'solid', '&:hover': { background: '#FFFFFF', color: '#000000' } }}>
                    <Box fontWeight='bold'>Register</Box>
                </Button>
            </CardActions>
            <CardContent sx={{ textAlign: 'center' }}>
                <Link to='/login' className='custom-link'>Already have an account? Click here to login.</Link>
            </CardContent>
        </Card>
        </>
        
    );
}

export default Register;
    
