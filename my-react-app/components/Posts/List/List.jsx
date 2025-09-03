import React, { useState, useEffect } from "react";
import axios from "axios";
import "./List.css";
import { useNavigate } from 'react-router-dom';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-profile-img"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-btn"></div>
    </div>
  );
};

const List = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const host = 'https://hirfaapi.vercel.app/api';
                const response = await axios.get(host + "/Workers");
                console.log();
                console.log(host +'/Workers');
                
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

  if (error) return <div className="gallery-container">{error}</div>;

  return (
    <div className="gallery-container">
      <h1 className="gallery-title">الحرفيين المميزين</h1>
      <div className="card-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
        ) : workers.length > 0 ? (
          workers.map((worker) => (
            <div className="post-worker-card" key={worker.account_id}>
              <div
                className="profile-img"
                style={{
                  backgroundImage: worker.logo_image
                    ? `url(data:image/jpeg;base64,${worker.logo_image})`
                    : `linear-gradient(135deg, #dfe9f3 0%, #ffffff 100%)`,
                }}
              ></div>
              <h2>{worker.account_name}</h2>
              <p className="description">{worker.description || "لا يوجد وصف"}</p>
              <button
                className="profile-btn"
                onClick={() =>
                  navigate("/profile", { state: { UserID: worker.account_id } })
                }
              >
                عرض الحساب
              </button>
            </div>
          ))
        ) : (
          <p>No workers found.</p>
        )}
      </div>
    </div>
  );
};

export default List;

