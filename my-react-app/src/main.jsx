import React from 'react';
import { createRoot } from 'react-dom/client'; // Correct import path
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Login from '../components/Login/Login.jsx';
import Register from '../components/Login/register.jsx';
import Profile from '../components/profile/profile.jsx';
import AddPost from '../components/Posts/Post/AddPost.jsx';





const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: < Register />
    },
    {
        path: "/profile",
        element: <Profile />
    },
    {
        path: "/addpost",
        element: <AddPost />
    }
]);


createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);