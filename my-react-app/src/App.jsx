import React, { useState, useEffect } from 'react';
import './App.css';
import Header from '../components/Header/Header';
import { useLocation } from 'react-router-dom'; 
import List from '../components/Posts/List/List';
import Footer from '../components/Footer/Footer';
import About from '../components/About/About';

function App() {
    const location = useLocation();
    const data = location.state;
    const [stats, setStats] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        const getLocation = () => {
            if (!navigator.geolocation) {
                setLocationError("الموقع غير مدعوم من المتصفح");
                setLocationLoading(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationLoading(false);
                },
                () => {
                    setLocationError("تعذر الحصول على الموقع");
                    setLocationLoading(false);
                }
            );
        };
        getLocation();
    }, []);

    useEffect(() => {
        if (location.state?.message) {
            setStats(location.state);
            const timer = setTimeout(() => {
                setStats(null);
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setStats(null); 
        }
    }, [location.state]); 

    if (locationLoading) {
        return <div>جارٍ تحديد موقعك...</div>;
    }

    return (
        <div className="app-container">
            {stats?.message && (
                <div className="message">
                    <p>{stats.message}</p>
                </div>
            )}
            <Header isUser={data?.isUser} UserID={data?.UserID} ThisUserID={data?.ThisUserID} Type={data?.Type} />
            <List  
                ThisUserID={data?.ThisUserID} 
                userLocation={userLocation} 
                locationError={locationError}
            />
            <About />
            <Footer />
        </div>
    );
}

export default App;