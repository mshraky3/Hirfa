// JSX
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./List.css";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const List = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const host = process.env.REACT_APP_HOST;
                const response = await axios.get(host + "/Posts");

                if (response.status === 200 && Array.isArray(response.data?.data)) {
                    setPosts(response.data.data);
                } else {
                    setError("Unexpected API response format.");
                }
            } catch (err) {
                setError("Failed to fetch data");
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
            <h1 className="title">Engineering Firms</h1>
            <div className="content">
                <div className="marquee">
                    {/* Double the posts for seamless looping */}
                    {[...posts, ...posts].map((post, index) => (
                        <div
                            key={`${post.post_id}-${index}`}
                            className="parent"
                            style={{
                                backgroundImage: post.images?.[0]?.image
                                    ? `url(data:image/jpeg;base64,${post.images[0].image})`
                                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                            }}
                        >
                            <div className="card-content company-name">
                                <strong>{post.account_name}</strong>
                            </div>

                            <div className="card-content">
                                {post.location}
                            </div>

                            <div className="card-content">
                                {post.post_title}
                            </div>

                            <div
                                onClick={()=>{navigate('/profile', { state: { UserID: post.account_id } })}}
                                className="card-content more-details"
                            >
                                View Account
                                <i className="fa-sharp-duotone fa-solid fa-arrow-right-long fa-fade fa-2xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default List;