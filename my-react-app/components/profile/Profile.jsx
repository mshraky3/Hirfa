import React, { useEffect, useState } from 'react';
import { useLocation  , useNavigate} from 'react-router-dom';
import './Profile.css';
import axios from 'axios';



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
          id: location.state.UserID
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    }
    fetchData();
  }, [location.state.UserID]);


  function AddPost() {
    navigator('/addpost', { state: { ThisUserID:location.state.ThisUserID  , name:data.name , Type:location.state.Type } });
  } 

  return (
    <div className="profile-container">

      {console.log(location.state)}
      { (location.state.ThisUserID === location.state.UserID )? 
        (<h2 className="profile-title">my profile  </h2>) :
        (<h2 className="profile-title">user profile </h2>)
      }
      
      {data ? (
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-container">
              <div
                className="profile-avatar"
                style={{
                  backgroundImage: data.logo_image
                    ? `url(data:image/jpeg;base64,${bufferToBase64(data.logo_image)})`
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="online-status"></div>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {data.name }
                {data.account_type === 'verified' && <span className="verified-badge">✓</span>}
              </h1>
              <p className="profile-title">{data.account_type || 'Member'}</p>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-value">{data.rating || 0}</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{data.rating_length || 0}</span>
                  <span className="stat-label">Reviews</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{data.posts?.length || 0}</span>
                  <span className="stat-label">Posts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-section">
              <h3 className="section-title">About</h3>
              <p className="profile-bio">{data.description || 'No description available'}</p>
              
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{data.email || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{data.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{data.location || 'Unknown'}</span>
              </div>
              {data.website_url && (
                <div className="detail-item">
                  <span className="detail-label">Website:</span>
                  <a 
                    href={data.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="detail-value"
                  >
                    {data.website_url}
                  </a>
                </div>
              )}
            </div>

            {data.posts && data.posts.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">Recent Posts</h3>
                <div className="posts-container">
                  {data.posts.map((post) => (
                    <div key={post.post_id} className="post-item">
                      <div className="post-header">
                        <span className="post-account">{post.account_name || data.name}</span>
                        <span className="post-type-badge">{post.post_type}</span>
                      </div>
                      {post.post_title && (
                        <h4 className="post-title">{post.post_title}</h4>
                      )}
                      {post.description && (
                        <p className="post-description">{post.description}</p>
                      )}
                      {post.location && (
                        <p className="post-location">
                          <i className="location-icon">📍</i> {post.location}
                        </p>
                      )}
                      {post.images && post.images.length > 0 && (
                        <div className="post-images">
                          {post.images.map((img, imgIndex) => {
                            const base64Image = bufferToBase64(img.image);
                            return (
                              <div
                                key={`${post.post_id}-${imgIndex}`}
                                className="post-image parent"
                                style={{
                                  backgroundImage: base64Image
                                    ? `url(data:image/jpeg;base64,${base64Image})`
                                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="profile-footer">
            <button className="action-button primary">Contact</button>
            { (location.state.ThisUserID == location.state.UserID && location.state.Type ==="user"  ) ?  (
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