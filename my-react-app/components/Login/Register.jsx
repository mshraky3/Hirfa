import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import "./Login.css";

const Register = () => {
    const location = useLocation(); // Get the location object
    const navigate = useNavigate(); // Initialize navigate for redirection
    const [message, setMessage] = useState(null); // State to hold temporary messages
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        confirm_password: "",
        location: "",
        phone_number: "",
        description: "",
        account_type: "worker",
        logo_image: null,
    });
    const [error, setError] = useState("");
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLocationFetched, setIsLocationFetched] = useState(false); // Track if location was fetched

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            const timer = setTimeout(() => {
                setMessage(null); // Clear the message after 2 seconds
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        // Handle file input separately
        if (type === "file") {
            setFormData((prevData) => ({
                ...prevData,
                [name]: files[0], // Store the file object
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const getLocation = () => {
        setIsLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    setFormData((prevData) => ({
                        ...prevData,
                        location: googleMapsLink,
                    }));
                    setIsLoadingLocation(false);
                    setIsLocationFetched(true); // Mark location as fetched
                    alert("Location fetched successfully!"); // Alert the user
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setError("Failed to get your location. Please try again.");
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
            setIsLoadingLocation(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        const missingFields = [];
        const requiredFields = [
            "name",
            "username",
            "password",
            "confirm_password",
            "location",
            "phone_number",
            "description",
            "account_type",
        ];

        requiredFields.forEach((field) => {
            if (!formData[field] && field !== "logo_image") {
                missingFields.push(field.replace(/_/g, " ").toUpperCase());
            }
        });

        // Check for password mismatch
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        // If there are missing fields, display an error
        if (missingFields.length > 0) {
            setError(`The following fields are required: ${missingFields.join(", ")}`);
            return;
        }

        // Prepare form data for submission
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("username", formData.username);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("location", formData.location);
        formDataToSend.append("phone_number", formData.phone_number);
        formDataToSend.append("description", formData.description);
        formDataToSend.append("account_type", formData.account_type);

        // Append logo_image only if it exists
        if (formData.logo_image) {
            formDataToSend.append("logo_image", formData.logo_image);
        }

        const host = process.env.REACT_APP_HOST;

        try {
            const response = await axios.post(host + "/register", formDataToSend);
            if (response.status === 200) {
                navigate("/login", { state: { message: response.data.message } });
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.mseeg) {
                setError(err.response.data.mseeg);
            } else {
                setError("An error occurred during registration.");
            }
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
            {message && (
                <div className="message">
                    <p>{message}</p>
                </div>
            )}
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Account Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="name"
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        id="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirm_password">Confirm Password</label>
                    <input
                        type="password"
                        className="form-control"
                        name="confirm_password"
                        id="confirm_password"
                        placeholder="Confirm password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="logo_image">Account Logo (Optional)</label>
                    <input
                        type="file"
                        className="form-control-file"
                        name="logo_image"
                        accept=".jpg,.jpeg,.png,.gif"
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="location">Company Location</label>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <button
                            type="button"
                            className={`btn btn-secondary ${isLocationFetched ? "fetched-location" : ""}`}
                            onClick={getLocation}
                            disabled={isLoadingLocation}
                            style={{
                                marginLeft: "10px",
                                backgroundColor: isLocationFetched ? "#28a745" : "", // Green background if location fetched
                            }}
                        >
                            {isLoadingLocation ? "Loading..." : isLocationFetched ? "Location Fetched!" : "Get Location"}
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="phone_number">Hotline Number to Communicate with Customers</label>
                    <input
                        type="text"
                        className="form-control"
                        name="phone_number"
                        placeholder="Enter phone number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Company / Account Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        placeholder="Enter description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="account_type">Account Type</label>
                    <select
                        className="form-control"
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleChange}
                        required
                    >
                        <option value="worker">Worker</option>
                        <option value="user">User</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;