import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>
                    &copy; {new Date().getFullYear()} Herfa. All rights reserved. 
                    <br />
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                        developer: muhmodalsahraky3@gmail.com
                    </span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;