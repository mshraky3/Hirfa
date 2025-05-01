import React from 'react';
import './Header.css';
import Navbar from '../Navbar/Navbar';


const Header = (props) => {

    return (
        <header className="header">
            <Navbar UserID={props.UserID} isUser={props.isUser ?props.isUser  : false } ThisUserID={props.ThisUserID}  />
            <div className="header-content">
                <h1 className="header-title">Welcome to Our Website</h1>
                <p className="header-description">rggregergerererergregregregreeravvrthjrg </p>
                <div className='header-buttons'>
                    <button className="header-button"> find worker</button>
                </div>
            </div>
        </header>
    );
};

export default Header;