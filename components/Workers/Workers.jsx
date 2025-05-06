import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Workers.css';

const Workers = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState({
        location: true,
        types: true,
        workers: false
    });
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState('');
    const [types, setTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isHighAccuracyFetching, setIsHighAccuracyFetching] = useState(false);

    const host = process.env.REACT_APP_HOST;

    // Get user location with dual strategy (fast + accurate)
    const getLocation = () => {
        setLoading(prev => ({ ...prev, location: true }));
        setError(null);

        if (!navigator.geolocation) {
            setError("الموقع غير مدعوم من متصفحك.");
            setLoading(prev => ({ ...prev, location: false }));
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
                    setUserLocation({ lat, lng: lon });
                    setError("تم استخدام موقعك بناءً على عنوان الـ IP");
                    setLoading(prev => ({ ...prev, location: false }));
                } else {
                    setError("لم نتمكن من تحديد موقعك.");
                    setLoading(prev => ({ ...prev, location: false }));
                }
            } catch (err) {
                console.error("Failed IP geolocation:", err);
                setError("فشل في الحصول على موقعك. يُرجى تمكين الموقع لاستخدام هذه الميزة.");
                setLoading(prev => ({ ...prev, location: false }));
            }
        };

        navigator.geolocation.getCurrentPosition(
            (fastPosition) => {
                const { latitude, longitude, accuracy } = fastPosition.coords;

                if (accuracy <= 5000) {
                    setUserLocation({ lat: latitude, lng: longitude });
                    setLoading(prev => ({ ...prev, location: false }));
                }

                if (accuracy > 50) {
                    setIsHighAccuracyFetching(true);
                    navigator.geolocation.getCurrentPosition(
                        (accuratePosition) => {
                            const { latitude, longitude, accuracy } = accuratePosition.coords;
                            if (accuracy <= 30) {
                                setUserLocation({ lat: latitude, lng: longitude });
                                setIsHighAccuracyFetching(false);
                            }
                        },
                        () => {
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

    // Fetch worker types
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await axios.get(`${host}/Workers/types`);
                setTypes(response.data.types || []);
            } catch (err) {
                setError("فشل في تحميل أنواع العمال");
                console.error(err);
            } finally {
                setLoading(prev => ({ ...prev, types: false }));
            }
        };
        fetchTypes();
    }, [host]);

    // Only fetch workers when type and location are available
    useEffect(() => {
        if (selectedType && userLocation) {
            fetchWorkers(1); // Reset page on new selection
        } else if (!selectedType) {
            setWorkers([]);
        }
    }, [selectedType, userLocation]);

    const fetchWorkers = async (pageNum) => {
        if (!userLocation) return;

        try {
            setLoading(prev => ({ ...prev, workers: true }));
            setError(null);

            const response = await axios.post(`${host}/Workers/filter`, {
                userLat: userLocation.lat,
                userLng: userLocation.lng,
                workerType: selectedType,
                page: pageNum
            });

            const newWorkers = response.data.workers || [];

            if (pageNum === 1) {
                setWorkers(newWorkers);
            } else {
                setWorkers(prev => [...prev, ...newWorkers]);
            }

            setHasMore(response.data.hasMore || false);
            setPage(pageNum);
        } catch (err) {
            setError("فشل في تحميل العمال. يُرجى إعادة المحاولة.");
            console.error("Error fetching workers:", err);
        } finally {
            setLoading(prev => ({ ...prev, workers: false }));
        }
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setPage(1);
        setWorkers([]);
    };

    const handleLoadMore = () => {
        fetchWorkers(page + 1);
    };

    const retryGetLocation = () => {
        setError(null);
        setLoading(prev => ({ ...prev, location: true }));
        getLocation();
    };

    const isLoading = loading.location || loading.types;

    return (
        <div className="workers-container">
            <h1>ابحث عن عمال بالقرب منك</h1>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Loading State */}
            {isLoading ? (
                <div className="loading">جارٍ التحميل...</div>
            ) : (
                <>
                    {/* Type Selector */}
                    <div className="type-selector">
                        <label htmlFor="worker-type">اختر مجال العمل:</label>
                        <select
                            id="worker-type"
                            value={selectedType}
                            onChange={handleTypeChange}
                            disabled={!types.length}
                        >
                            <option value="">-- اختر نوعًا --</option>
                            {types.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Show "Improving accuracy" note */}
                    {userLocation && isHighAccuracyFetching && (
                        <small style={{ display: "block", color: "#888", marginTop: "4px" }}>
                            جارٍ تحسين دقة الموقع...
                        </small>
                    )}

                    {/* Main Content */}
                    {selectedType ? (
                        loading.workers && page === 1 ? (
                            <div className="loading">جارٍ تحميل العمال...</div>
                        ) : workers.length > 0 ? (
                            <div className="workers-list">
                                {workers.map(worker => (
                                    <div key={worker.id} className="worker-card">
                                        <div className="worker-image">
                                            {worker.logo_image ? (
                                                <img 
                                                    src={`data:image/png;base64,${worker.logo_image}`} 
                                                    alt={worker.name} 
                                                />
                                            ) : (
                                                <div className="no-image">لا يوجد صورة</div>
                                            )}
                                        </div>
                                        <div className="worker-info">
                                            <h3>{worker.name}</h3>
                                            <p className="worker-field">{worker.working_in}</p>
                                            <p className="worker-phone">{worker.phone_number}</p>
                                            <p className="worker-distance">
                                                {worker.distance} كم من موقعك
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More Button */}
                                {hasMore && (
                                    <button 
                                        className="load-more"
                                        onClick={handleLoadMore}
                                        disabled={loading.workers}
                                    >
                                        {loading.workers ? 'جارٍ التحميل...' : 'عرض المزيد'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="no-workers">
                                لا يوجد عمال في هذا المجال.
                            </div>
                        )
                    ) : (
                        <div className="select-type-prompt">
                            يُرجى اختيار مجال العمل لرؤية القائمة.
                        </div>
                    )}
                </>
            )}

            {/* Retry Button */}
            {!userLocation && !loading.location && (
                <div className="retry-location">
                    <button className="btn btn-primary" onClick={retryGetLocation}>
                        إعادة جلب الموقع
                    </button>
                </div>
            )}
        </div>
    );
};

export default Workers;