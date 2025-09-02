import React from 'react';
import './Header.css';
import Navbar from '../Navbar/Navbar.jsx';
import { useNavigate } from 'react-router-dom';

const Header = (props) => {
    const navigate = useNavigate();

    const goTO = () => {
        navigate('/workers');
    };

    return (
        <header className="header">
            <Navbar UserID={props.UserID} isUser={props.isUser ? props.isUser : false} ThisUserID={props.ThisUserID} />
            <div className="header-content">
                <h1 className="header-title">
                    محتاج عامل ؟
                </h1>
                <p className="header-description">
                    تواصل فورًا مع عامل بالقرب منك<br /> بدون تعقيدات و بسهولة.
                </p>
                <div className="header-buttons">
                    <button className="header-button" onClick={goTO}>
                        قائمة الحرفيين
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;