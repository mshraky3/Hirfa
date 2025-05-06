import React, { useState, useEffect } from "react";
import axios from "axios";
import "./list.css";
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

  if (loading) return <div className="gallery-container">Loading...</div>;
  if (error) return <div className="gallery-container">{error}</div>;

  return (
    <div className="gallery-container">
      <h1 className="gallery-title">الحرفيين المميزين</h1>
      <div className="card-grid">
        {workers.map((worker, index) => (
          <div className="worker-card" key={index}>
            <div
              className="profile-img"
              style={{
                backgroundImage: worker.logo_image
                  ? `url(data:image/jpeg;base64,${worker.logo_image})`
                  : `linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%)`
              }}
            ></div>
            <h2>{worker.account_name}</h2>
            <p className="description">{worker.description || "لا يوجد وصف"}</p>
            <button
              className="profile-btn"
              onClick={() =>
                navigate('/profile', { state: { UserID: worker.account_id } })
              }
            >
              عرض الحساب
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
