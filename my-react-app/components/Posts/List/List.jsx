import React, { useState, useEffect } from "react";
import axios from "axios";
import "./List.css";
import { useNavigate } from 'react-router-dom';

const List = () => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const host = process.env.REACT_APP_HOST;
                const response = await axios.get(host + "/Workers");

                if (response.status === 200 && Array.isArray(response.data?.data)) {
                    setWorkers(response.data.data);
                } else {
                    setError("Unexpected API response format.");
                }
            } catch (err) {
                setError("Failed to fetch worker data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="container">Loading...</div>;
    if (error) return <div className="container">{error}</div>;

    return (
        <div className="container">
            <h1 className="title">Worker Accounts</h1>
            <div className="content">
                <div className="marquee">
                    {/* Double the workers for seamless looping */}
                    {[...workers, ...workers].map((worker, index) => (
                        <div
                            key={`${worker.account_id}-${index}`}
                            className="parent"
                            style={{
                                backgroundImage: worker.logo_image
                                    ? `url(data:image/jpeg;base64,${worker.logo_image})`
                                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                            }}
                        >
                            <div className="card-content company-name">
                                <strong>{worker.account_name}</strong>
                            </div>

                            <div className="card-content">
                                {worker.location}
                            </div>

                            <div className="card-content">
                                {worker.description || "No description available"}
                            </div>

                            <div
                                onClick={() => {
                                    navigate('/profile', { state: { UserID: worker.account_id } });
                                }}
                                className="card-content more-details"
                            >
                                View Account
                                <i className="fa-sharp-duotone fa-solid fa-arrow-right-long fa-fade fa-2xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default List;