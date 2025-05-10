import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './profile.css';
import axios from 'axios';
import Default from './default-user.jpg';

const bufferToBase64 = (bufferArray) => {
    if (!bufferArray || !bufferArray.data || !Array.isArray(bufferArray.data)) return null;
    const binaryStr = bufferArray.data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return window.btoa(binaryStr);
};

const parseCoordinates = (locationString) => {
    if (!locationString) return null;
    const urlMatch = locationString.match(/q=([\d.-]+),([\d.-]+)/);
    if (urlMatch) {
        return {
            lat: parseFloat(urlMatch[1]),
            lon: parseFloat(urlMatch[2])
        };
    }
    const coords = locationString.split(',').map(c => parseFloat(c.trim()));
    if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        return { lat: coords[0], lon: coords[1] };
    }
    return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

function Profile() {
    const host = process.env.REACT_APP_HOST;
    const location = useLocation();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [currentUserCoords, setCurrentUserCoords] = useState(null);
    const [distance, setDistance] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationError, setLocationError] = useState('');
    const [isHighAccuracyFetching, setIsHighAccuracyFetching] = useState(false);

    const isOwnProfile = location.state?.ThisUserID === location.state?.UserID;

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await axios.post(host + '/profile', {
                    id: location.state?.UserID,
                });
                setData(response.data);
            } catch (error) {
                navigate('/404');
            }
        }
        if (location.state?.UserID) {
            fetchData();
        }
    }, [host, location.state?.UserID]);

    const getLocation = () => {
        setLocationStatus('loading');
        setLocationError('');
        setIsHighAccuracyFetching(false);

        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError("الموقع غير مدعوم من متصفحك.");
            return;
        }

        const fastOptions = {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 60000
        };

        const accurateOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const fallbackToIP = async () => {
            try {
                const res = await axios.get("https://ipapi.co/json/");
                const { lat, lon } = res.data;
                if (lat && lon) {
                    setCurrentUserCoords({ lat, lng: lon });
                    setLocationStatus('success');
                    setLocationError("تم استخدام موقعك بناءً على عنوان الـ IP");
                    return;
                }
            } catch (err) {
                setLocationError("لم نتمكن من تحديد موقعك الدقيق أو عبر الـ IP");
                setLocationStatus('error');
            }
        };

        navigator.geolocation.getCurrentPosition(
            (fastPosition) => {
                const { latitude, longitude, accuracy } = fastPosition.coords;
                setCurrentUserCoords({ lat: latitude, lng: longitude });
                setLocationStatus('success');
                if (accuracy > 5000) {
                    setLocationError("جارٍ تحسين دقة الموقع في الخلفية...");
                    setIsHighAccuracyFetching(true);
                    navigator.geolocation.getCurrentPosition(
                        (accuratePosition) => {
                            const { latitude, longitude, accuracy } = accuratePosition.coords;
                            if (accuracy <= 30) {
                                setCurrentUserCoords({ lat: latitude, lng: longitude });
                                setLocationError("تم تحسين دقة الموقع");
                                setIsHighAccuracyFetching(false);
                            }
                        },
                        () => {
                            fallbackToIP();
                            setIsHighAccuracyFetching(false);
                        },
                        accurateOptions
                    );
                }
            },
            () => {
                fallbackToIP();
            },
            fastOptions
        );
    };

    useEffect(() => {
        if (!isOwnProfile) {
            getLocation();
        }
    }, [isOwnProfile]);

    useEffect(() => {
        if (data?.location && currentUserCoords) {
            const targetCoords = parseCoordinates(data.location);
            if (targetCoords) {
                const dist = calculateDistance(
                    currentUserCoords.lat,
                    currentUserCoords.lng,
                    targetCoords.lat,
                    targetCoords.lon
                );
                setDistance(dist);
            } else {
                setDistance(null);
            }
        } else {
            setDistance(null);
        }
    }, [data?.location, currentUserCoords]);

    const getLocationDisplay = () => {
        if (isOwnProfile) {
            return <a href={data.location} target="_blank" rel="noopener noreferrer">عرض في خرائط جوجل</a>;
        }
        if (locationStatus === 'loading') {
            return (
                <>
                    <div className="loading-animation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "5px" }}>
                        جارٍ تحديد الموقع...
                    </p>
                </>
            );
        }
        if (distance !== null) {
            return (
                <>
                    <div>{`${Math.round((Math.round(distance * 10) / 10))} كم من موقعك`}</div>
                    {isHighAccuracyFetching && (
                        <small style={{ display: "block", color: "#888", fontSize: "0.8rem", marginTop: "4px" }}>
                            جارٍ تحسين دقة الموقع...
                        </small>
                    )}
                </>
            );
        }
        if (locationStatus === 'error') {
            return (
                <>
                    <p className="error-message" style={{ color: "#b00020" }}>
                        {locationError || "المسافة غير متوفرة"}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={getLocation}
                        style={{ marginTop: '8px', fontSize: '0.85rem' }}
                    >
                        إعادة المحاولة
                    </button>
                </>
            );
        }
        const coords = parseCoordinates(data?.location);
        return coords
            ? `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`
            : 'الموقع غير معروف';
    };

    return (
        <div className="profile-container">
            <h2 className="profile-title">{isOwnProfile ? 'ملفي الشخصي' : 'ملف المستخدم'}</h2>
            {data ? (
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-container">
                            <div
                                className="profile-avatar"
                                style={{
                                    backgroundImage: data.logo_image
                                        ? `url(data:image/webp;base64,${bufferToBase64(data.logo_image)})`
                                        : `url(${Default})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div className={`online-status ${locationStatus === 'success' ? 'active' : ''}`}></div>
                        </div>
                        <div className="profile-info">
                            <h1 className="profile-name">
                                {data.name}
                                {data.account_type === 'verified' && <span className="verified-badge">✓</span>}
                            </h1>
                            <p className="profile-title">{data.account_type || 'عضو'}</p>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div className="detail-section">
                            <h3 className="section-title">حول</h3>
                            <p className="profile-bio">{data.description || 'لا يوجد وصف متاح.'}</p>
                            <div className="detail-item">
                                <span className="detail-label">الهاتف:</span>
                                <span className="detail-value">{data.phone_number || 'غير مشارَك'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">الموقع:</span>
                                <span className="detail-value">{getLocationDisplay()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>جارٍ تحميل الملف...</p>
                </div>
            )}
        </div>
    );
}

export default Profile;
