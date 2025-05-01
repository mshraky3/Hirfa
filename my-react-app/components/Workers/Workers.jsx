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

    const host = 'http://localhost:3000/api';

    // Get user location
    useEffect(() => {
        const getLocation = () => {
            if (!navigator.geolocation) {
                setError("Geolocation is not supported by your browser");
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
                (err) => {
                    setError("Unable to retrieve your location");
                    setLoading(prev => ({ ...prev, location: false }));
                    console.error(err);
                }
            );
        };

        getLocation();
    }, []);

    // Fetch worker types
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await axios.get(`${host}/Workers/types`);
                setTypes(response.data.types || []);
                setLoading(prev => ({ ...prev, types: false }));
            } catch (err) {
                setError("Failed to load worker types");
                setLoading(prev => ({ ...prev, types: false }));
                console.error(err);
            }
        };

        fetchTypes();
    }, [host]);

    // Fetch workers when type is selected and location is available
    useEffect(() => {
        if (selectedType && userLocation) {
            fetchWorkers(1);
        } else {
            setWorkers([]);
        }
    }, [selectedType, userLocation]);

    const fetchWorkers = async (pageNum) => {
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
            setError("Failed to load workers");
            console.error(err);
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

    return (
        <div className="workers-container">
            <h1>Find Workers Near You</h1>
            
            {error && <div className="error-message">{error}</div>}

            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="type-selector">
                        <label htmlFor="worker-type">Select Work Field:</label>
                        <select
                            id="worker-type"
                            value={selectedType}
                            onChange={handleTypeChange}
                            disabled={loading.workers}
                        >
                            <option value="">-- Select a field --</option>
                            {types.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {!userLocation ? (
                        <div className="location-error">
                            Location access is required to find nearby workers.
                        </div>
                    ) : selectedType ? (
                        <>
                            {loading.workers && page === 1 ? (
                                <div className="loading">Loading workers...</div>
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
                                                    <div className="no-image">No Image</div>
                                                )}
                                            </div>
                                            <div className="worker-info">
                                                <h3>{worker.name}</h3>
                                                <p className="worker-field">{worker.working_in}</p>
                                                <p className="worker-phone">{worker.phone_number}</p>
                                                <p className="worker-distance">
                                                    {worker.distance} km away
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-workers">
                                    No workers found in this field.
                                </div>
                            )}

                            {hasMore && (
                                <button 
                                    className="load-more"
                                    onClick={handleLoadMore}
                                    disabled={loading.workers}
                                >
                                    {loading.workers ? 'Loading...' : 'Load More'}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="select-type-prompt">
                            Please select a work field to see available workers.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Workers;