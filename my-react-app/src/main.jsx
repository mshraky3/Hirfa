import React from 'react';
import { createRoot } from 'react-dom/client'; // Correct import path
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Login from '../components/Login/Login.jsx';
import Register from '../components/Login/register.jsx';
import Profile from '../components/profile/profile.jsx';
import Workers from '../components/Workers/Workers.jsx';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";





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
        path: "/workers",
        element: <Workers />
    },

]);


createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Analytics />
        <SpeedInsights />
        <RouterProvider router={router} />
    </React.StrictMode>
);