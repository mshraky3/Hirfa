import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logo from "./H.png"
const Navbar = (props) => {
    const navigate = useNavigate();
    function To_profile(id) {
        navigate('/profile', { state: { UserID: id, ThisUserID: props.ThisUserID } })
    }

    return (
        <nav className="navbar">
            <ul className='nav-list'>
                <li className='logo-cont'>
                    <div className='logo'>
                        <img src={logo} className='logo' alt="" />
                        <Link className="dash-text">حِرَفة </Link>
                    </div>
                </li>
                <li className='links-cont'>
                    <div className='links-cot'>
                        <Link className="nav-link" to='/workers'>
                            قائمة الحرفيين
                        </Link>
                        {props.isUser ? (
                            <div className="nav-link" onClick={() => { To_profile(props.UserID) }}>profile</div>
                        ) : (
                            <Link className="nav-link" to='/register'>
                                بحث عن عمل
                            </Link>
                        )}
                    </div>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
