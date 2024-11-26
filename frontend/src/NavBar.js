import {
    Link
} from 'react-router-dom';
import './NavBar.css'
import {
    useEffect,
    useState
} from 'react';
import {
    useWindowWidth
} from '@react-hook/window-size';
import {
    useNavigate
} from 'react-router-dom';

export function NavBar() {
    // usestate for mobile nav
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // usestate for window width
    const winWidth = useWindowWidth();

    // toggle menu
    function openMenu() {
        setMenuOpen(true);
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    // useeffect for mobile menu (close menu when desktop)
    useEffect(() => {
        if (winWidth > 600) {
            closeMenu();
        }
    });

    // async function for logout
    const logout = async () => {
        // send fetch to logout
        const response = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': localStorage.getItem('token')
            }
        });
        //get response data
        const data = await response.json();
        if (response.ok) {
            // if response is ok, remove local storage and tell the app that logout
            localStorage.removeItem('token');
            window.dispatchEvent(new Event("storage"));
            navigate('/login')
        } else {
            alert('Error: Logout error', data);
        }

    }

  return (
    <div className='navBar'>
        <div className='navbar-left'>
            <h3> Dashboard </h3>
        </div>
      
        <div className='desktop-nav'>
            <div className='navbar-right'>
                <Link to='/'> Home </Link>
                <Link to='/custom'> Custom Events </Link>
                <Link onClick={logout}> Logout </Link>
            </div>
        </div>
    
        <div className='mobile-nav'>
            { menuOpen 
                ? <svg className='menu-icon' fill="#E0E0E0" stroke="#E0E0E0" onClick={ closeMenu } xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                : <svg className='menu-icon' fill="#E0E0E0" stroke="#E0E0E0" onClick={ openMenu } xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
            }
        </div>
        { menuOpen
              ? 
                <div className='mobile-menu'>
                    <Link to='/'> Home </Link>
                    <Link to='/custom'> Custom Events </Link>
                <   Link onClick={ logout }> Logout </Link>
                 </div>
            :
                <></>
            }
        </div>
  );
}