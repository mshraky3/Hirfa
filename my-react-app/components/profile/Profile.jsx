import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Profile.css';
import axios from 'axios';
import Default from './default-user.jpg';

const bufferToBase64 = (bufferArray) => {
  if (!bufferArray || !bufferArray.data || !Array.isArray(bufferArray.data)) return null;
  const binary = bufferArray.data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return window.btoa(binary);
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
  
  // Handle simple "lat,lon" format
  const coords = locationString.split(',');
  if (coords.length === 2) {
    return {
      lat: parseFloat(coords[0]),
      lon: parseFloat(coords[1])
    };
  }
  
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

function Profile() {
  const host = process.env.REACT_APP_HOST;
  const location = useLocation();
  const [data, setData] = useState(null);
  const [currentUserCoords, setCurrentUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const navigate = useNavigate();

  // Get current user's location from browser
  useEffect(() => {
    // Only try to get location if we're viewing someone else's profile
    if (!location.state?.ThisUserID || location.state.ThisUserID !== location.state?.UserID) {
      if (navigator.geolocation) {
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentUserCoords({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            setLocationStatus('success');
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationStatus('error');
            setCurrentUserCoords(null); // Explicitly set to null
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setLocationStatus('error');
        setCurrentUserCoords(null); // Explicitly set to null
      }
    }
  }, [location.state?.ThisUserID, location.state?.UserID]);

  // Fetch profile data for the user being viewed
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.post(host + '/profile', {
          id: location.state?.UserID,
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    }
    if (location.state?.UserID) {
      fetchData();
    }
  }, [location.state?.UserID]);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (data?.location && currentUserCoords) {
      const targetCoords = parseCoordinates(data.location);
      if (targetCoords) {
        const dist = calculateDistance(
          currentUserCoords.lat,
          currentUserCoords.lon,
          targetCoords.lat,
          targetCoords.lon
        );
        setDistance(dist);
      }
    } else {
      setDistance(null); // Reset distance if conditions aren't met
    }
  }, [data, currentUserCoords]);

  const isOwnProfile = location.state?.ThisUserID === location.state?.UserID;

  // Parse the location for display
  const displayLocation = data?.location ? 
    data.location.replace(/https?:\/\/www\.google\.com\/maps\?q=/, '') : 
    'Unknown';

  // Determine what to display for location
  const getLocationDisplay = () => {
    if (isOwnProfile) {
      return displayLocation;
    }
    
    if (locationStatus === 'loading') {
      return 'Calculating distance...';
    }
    
    if (distance !== null) {
      return `${Math.round(distance * 10) / 10} km from you`;
    }
    
    if (locationStatus === 'error') {
      return 'Distance unavailable';
    }
    
    return displayLocation;
  };

  return (
    <div className="profile-container">
      {isOwnProfile ? (
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
                    : `url(${Default})`,
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
                <span className="detail-value">
                  {getLocationDisplay()}
                </span>
              </div>
            </div>
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