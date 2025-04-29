import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Profile.css';
import axios from 'axios';
import Default from './default-user.jpg'; // Import the default image

const bufferToBase64 = (bufferArray) => {
  if (!bufferArray || !bufferArray.data || !Array.isArray(bufferArray.data)) return null;
  const binary = bufferArray.data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return window.btoa(binary);
};

function Profile() {
  const host = process.env.REACT_APP_HOST;
  const location = useLocation();
  const [data, setData] = useState(null);
  const navigator = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.post(host + '/profile', {
          id: location.state.UserID,
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    }
    fetchData();
  }, [location.state.UserID]);

  return (
    <div className="profile-container">
      {console.log(location.state)}
      {location.state.ThisUserID === location.state.UserID ? (
        <h2 className="profile-title">my profile</h2>
      ) : (
        <h2 className="profile-title">user profile</h2>
      )}

      {data ? (
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-container">
              <div
                className="profile-avatar"
                style={{
                  backgroundImage: data.logo_image
                    ? `url(data:image/jpeg;base64,${bufferToBase64(data.logo_image)})`
                    : `url(${Default})`, // Use the Default image if logo_image is not available
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="online-status"></div>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {data.name}
                {data.account_type === 'verified' && <span className="verified-badge">✓</span>}
              </h1>
              <p className="profile-title">{data.account_type || 'Member'}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-section">
              <h3 className="section-title">About</h3>
              <p className="profile-bio">{data.description || 'No description available'}</p>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{data.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{data.location || 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="profile-footer">
            <button className="action-button primary">Contact</button>
            {location.state.ThisUserID === location.state.UserID &&
            location.state.Type === 'user' ? (
              <div
                onClick={AddPost}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button secondary"
              >
                Add Post
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      )}
    </div>
  );
}

export default Profile;