import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} Herfa . All rights reserved. developer muhmodalsahraky3@gmail.com</p>
            </div>
        </footer>
    );
};

export default Footer;