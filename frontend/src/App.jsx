import { NavBar } from './NavBar';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from "./Login";
import Register from "./Register"
import { Dashboard } from './Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CustomEvents } from './CustomEvents';
import { ThemeProvider, createTheme } from "@mui/material/styles";

function App() {
  // useState for login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // event listener for local storage
  function addLoginListener() {
    console.log('hi')
    window.addEventListener('storage', () => {
      if (window.localStorage.getItem('token') !== null && window.localStorage.getItem('token') !== 'null') {
        console.log('logging in');
        setIsLoggedIn(true);
      } else {
        console.log('logging out');
        setIsLoggedIn(false);
      }
    });
  }

  // function for verifying token
  async function verifyingToken() {
    // send request to verify
    const response = await fetch('http://localhost:3000/verify', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'token': window.localStorage.getItem('token')
      },
    });

    // if result is true, set logged in,
    // else, set logged out and remove token
    const data = await response.json();
    if (data.result) {
      console.log('in')
      setIsLoggedIn(true);
    } else {
      window.localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  }

  verifyingToken();
  addLoginListener();

  //dark theme
  const appTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  console.log(isLoggedIn);

  return (
    <ThemeProvider theme={appTheme}>
      <div>
        <BrowserRouter>
          {isLoggedIn ? <NavBar></NavBar> : <></>}
          <Routes>
            <Route path='/' element={ isLoggedIn ? <Dashboard isLoggedIn={isLoggedIn}/> : <Navigate to='/login'/>}></Route>
            <Route path='/custom' element={ isLoggedIn ? <CustomEvents/> : <CustomEvents /> }></Route>
            <Route path='/login' element={ isLoggedIn ? <Navigate to='/'/> : <Login /> }></Route>
            <Route path='/register' element={ isLoggedIn ? <Navigate to='/'/> : <Register /> }></Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer
          position="top-center"
          autoClose={2000}
          theme="dark"
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
