import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logo from "./H.png"

const Navbar = (props) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    function To_profile(id) {
        navigate('/profile', { state: { UserID: id, ThisUserID: props.ThisUserID } })
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className='logo-cont'>
                    <div className='logo'>
                        <img src={logo} className='logo-img' alt="" />
                        <Link className="dash-text">حِرَفة </Link>
                    </div>
                </div>
                <div className={`links-cont ${isMobileMenuOpen ? 'active' : ''}`}>
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
                </div>
                <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
                    <div className="line"></div>
                    <div className="line"></div>
                    <div className="line"></div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;