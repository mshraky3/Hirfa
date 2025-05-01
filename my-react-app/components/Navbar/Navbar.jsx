import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
// Removed unused import
import { useNavigate } from 'react-router-dom';

const Navbar = (props) => {


    const navigate = useNavigate();
    function To_profile(id) {

        navigate('/profile', { state: { UserID: id, ThisUserID: props.ThisUserID } })
    }


    return (
        <>
            <nav>
                <ul className='nav-list'>
                    {/* Logo and DASH */}
                    <li className='logo-cont'>
                        <div className='logo'>
                            <Link className="dash-text">Hiraf   </Link>
                            <Link className="dash-text" >الحِرَفة </Link>
                        </div>
                    </li>
                    <li className='links-cont'>
                        <div className='links-cot'>
                            <Link className="nav-link" to='/workers' >
                                قائمة الحرفيين 
                            </Link>



                            {props.isUser ? (
                                <div div className="nav-link" onClick={() => { To_profile(props.UserID) }}>profile</div>
                            ) : (
                                <>
                                    <Link className="nav-link" to='/login' >
                                        بحث عن عمل 
                                    </Link>
                                </>
                            )}
                        </div>
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default Navbar;