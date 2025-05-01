import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';



const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const host = process.env.REACT_APP_HOST;
        try {
            const login = await axios.post(host + '/login', {
                email,
                password
            })
            console.log(login.data.stats);
            switch (login.data.stats) {
                case 200:
                    navigate('/', { state: { message: 'welcome login sessifal', isUser: true, UserID: login.data.id , ThisUserID: login.data.id } });
                    break;
                case 201:
                    navigate('/register', { state: { message: 'regster first' } });
                    break;
                default:
                    navigate('/register', { state: { message: 'User dosnt exists' } });
                    break;
            }
        } catch (error) {
            console.error('Error during login:', error);
        }

    };



    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" >Login</button>
                <Link type="button" to='/register' >register</Link>
            </form>
        </div>
    );
};

export default Login;