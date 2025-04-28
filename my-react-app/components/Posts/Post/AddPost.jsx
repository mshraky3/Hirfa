import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddPost.css';

const AddPost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { ThisUserID, name, Type } = location.state;
    
    const [formData, setFormData] = useState({
        location: '',
        description: '',
        post_title: '',
        images: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert('Please select up to 5 images maximum');
            return;
        }
        setFormData(prev => ({
            ...prev,
            images: files,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('account_name', name);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('account_id', ThisUserID);
        formDataToSend.append('post_title', formData.post_title);
        
        formData.images.forEach(image => {
            formDataToSend.append('images', image);
        });

        try {
            const host = process.env.REACT_APP_HOST;
            await axios.post(host+'/addpost', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate('/profile', { 
                state: { 
                    UserID: ThisUserID, 
                    ThisUserID: ThisUserID, 
                    Type: Type  
                } 
            });
        } catch (error) {
            console.error('Error adding post:', error);
            alert('Failed to add post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-post-container">
            <div className="add-post-header">
                <h2>Create New Post</h2>
                <p>Share your travel experiences with the community</p>
            </div>
            
            <form onSubmit={handleSubmit} className="add-post-form">
                <div className="form-group">
                    <label htmlFor="post_title">Post Title*</label>
                    <input
                        id="post_title"
                        type="text"
                        name="post_title"
                        value={formData.post_title}
                        onChange={handleChange}
                        placeholder="Give your post a catchy title"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="location">Location*</label>
                    <input
                        id="location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Where was this taken?"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="description">Description*</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Tell us about your experience..."
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="images">Upload Images* (Max 5)</label>
                    <div className="file-upload-wrapper">
                        <input
                            id="images"
                            type="file"
                            name="images"
                            onChange={handleImageChange}
                            multiple
                            accept="image/*"
                            required
                        />
                        <div className="file-upload-label">
                            {formData.images.length > 0 
                                ? `${formData.images.length} file(s) selected`
                                : 'Choose files'}
                        </div>
                    </div>
                    {formData.images.length > 0 && (
                        <div className="image-preview">
                            {formData.images.map((image, index) => (
                                <div key={index} className="preview-item">
                                    <span>{image.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Posting...' : 'Share Post'}
                </button>
            </form>
        </div>
    );
};

export default AddPost;