import React, { useState, useEffect, useRef } from 'react';
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

    const cancelTokenRef = useRef(null);
    const host = 'https://hirfaapi.vercel.app/api';

    useEffect(() => {
        const getLocation = () => {
            if (!navigator.geolocation) {
                setError("الموقع غير مدعوم من المتصفح");
                setLoading(prev => ({ ...prev, location: false }));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(prev => ({ ...prev, location: false }));
                },
                () => {
                    setError("تعذر الحصول على الموقع");
                    setLoading(prev => ({ ...prev, location: false }));
                }
            );
        };
        getLocation();
    }, []);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await axios.get(`${host}/Workers/types`);
                setTypes(response.data.types || []);
                setLoading(prev => ({ ...prev, types: false }));
            } catch {
                setError("فشل تحميل التخصصات");
                setLoading(prev => ({ ...prev, types: false }));
            }
        };
        fetchTypes();
    }, [host]);

    useEffect(() => {
        if (selectedType && userLocation) {
            fetchWorkers(1);
        } else {
            setWorkers([]);
        }

        return () => {
            if (cancelTokenRef.current) {
                cancelTokenRef.current();
            }
        };
    }, [selectedType, userLocation]);

    const fetchWorkers = async (pageNum) => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current();
        }

        try {
            setLoading(prev => ({ ...prev, workers: true }));
            setError(null);

            const CancelToken = axios.CancelToken;
            const source = CancelToken.source();
            cancelTokenRef.current = () => source.cancel('Request canceled');

            const response = await axios.post(
                `${host}/Workers/filter`,
                {
                    userLat: userLocation.lat,
                    userLng: userLocation.lng,
                    workerType: selectedType,
                    page: pageNum
                },
                { cancelToken: source.token }
            );

            const newWorkers = response.data.workers || [];
            if (pageNum === 1) {
                setWorkers(newWorkers);
            } else {
                setWorkers(prev => [...prev, ...newWorkers]);
            }

            setHasMore(response.data.hasMore || false);
            setPage(pageNum);
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Request canceled', err.message);
            } else {
                setError("فشل تحميل العمال");
            }
        } finally {
            setLoading(prev => ({ ...prev, workers: false }));
        }
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
    };

    const handleLoadMore = () => {
        fetchWorkers(page + 1);
    };

    const isLoading = loading.location || loading.types;
    const WorkerCard = React.memo(({ worker }) => (
        <div key={worker.id} className="worker-card">
            <div className="worker-image">
                {worker.logo_image ? (
                    <img
                        src={`data:image/webp;base64,${worker.logo_image}`}
                        alt={worker.name}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="no-image">بدون صورة</div>
                )}
            </div>
            <div className="worker-info">
                <h3>{worker.name}</h3>
                <p className="worker-field">{worker.working_in}</p>
                <p className="worker-phone">{worker.phone_number}</p>
                <p className="worker-distance">
                    {Math.round(worker.distance)} كم
                </p>
            </div>
        </div>
    ));
    return (
        <div className="workers-container">
            <h1>ابحث عن عمال بالقرب منك</h1>
            {error && <div className="error-message">{error}</div>}
            {isLoading ? (
                <div className="loading">جار التحميل...</div>
            ) : (
                <>
                    <div className="type-selector">
                        <label htmlFor="worker-type">اختر مجال العمل:</label>
                        <select
                            id="worker-type"
                            value={selectedType}
                            onChange={handleTypeChange}
                            disabled={loading.workers}
                            className="custom-select"
                        >
                            <option value="">-- اختر مجال --</option>
                            {types.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    {!userLocation ? (
                        <div className="location-error">
                            يتطلب إذن الموقع لعرض العمال القريبين.
                        </div>
                    ) : selectedType ? (
                        <>
                            {loading.workers && page === 1 ? (
                                <div className="loading">جار تحميل العمال...</div>
                            ) : workers.length > 0 ? (
                                <div className="workers-list">
                                    {workers.map(worker => (
                                        <WorkerCard key={worker.id} worker={worker} />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-workers">
                                    لا يوجد عمال في هذا المجال.
                                </div>
                            )}
                            {hasMore && (
                                <button
                                    className="load-more"
                                    onClick={handleLoadMore}
                                    disabled={loading.workers}
                                >
                                    {loading.workers ? 'جاري التحميل...' : 'عرض المزيد'}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="select-type-prompt">
                            الرجاء اختيار مجال العمل لعرض المتاحين.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};


export default Workers;
