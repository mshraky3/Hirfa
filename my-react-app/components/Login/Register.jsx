import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./Login.css";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [message, setMessage] = useState(null);
    const [error, setError] = useState("");
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLocationFetched, setIsLocationFetched] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const jobOptions = [
        { ar: "مقاول", en: "Contractor" },
        { ar: "فني بلاط", en: "Tiles Installer" },
        { ar: "فني دهان", en: "Painter" },
        { ar: "فني أرضيات", en: "Flooring Technician" },
        { ar: "سباك", en: "Plumber" },
        { ar: "كهربائي", en: "Electrician" },
        { ar: "فني تكييف", en: "AC Technician" },
        { ar: "فني أنظمة أمن", en: "Security Systems Technician" },
        { ar: "عمال نقل", en: "Movers" },
        { ar: "نجار", en: "Carpenter" },
        { ar: "عامل نظافة", en: "Cleaner" },
        { ar: "بستاني", en: "Gardener" },
        { ar: "أخرى", en: "Other" }
    ];

    const [formData, setFormData] = useState({
        working_in: "",
        name: "",
        username: "",
        password: "",
        confirm_password: "",
        location: "",
        phone_number: "",
        description: "",
        logo_image: null,
    });

    const steps = [
        { title: "Working In", key: "working_in" },
        { title: "Account Name", key: "name" },
        { title: "Username", key: "username" },
        { title: "Password", key: "password" },
        { title: "Confirm Password", key: "confirm_password" },
        { title: "Phone Number", key: "phone_number" },
        { title: "Location", key: "location" },
        { title: "Description", key: "description" },
        { title: "Logo Image", key: "logo_image" },
    ];

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            const timer = setTimeout(() => {
                setMessage(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        
        if (name === "logo_image" && files && files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(files[0]);
            
            setFormData((prev) => ({
                ...prev,
                [name]: files[0],
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: files ? files[0] : value,
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
                    setFormData((prev) => ({
                        ...prev,
                        location: googleMapsLink
                    }));
                    setIsLoadingLocation(false);
                    setIsLocationFetched(true);
                    setError("");
                },
                (err) => {
                    setError("Failed to get your location. Please try again.");
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
            setIsLoadingLocation(false);
        }
    };

    const validateStep = () => {
        const currentKey = steps[currentStep].key;

        switch (currentKey) {
            case "working_in":
                if (!formData.working_in.trim()) {
                    setError("يرجى اختيار مجال العمل / Please select your working field.");
                    return false;
                }
                break;
            case "name":
                if (!formData.name.trim()) {
                    setError("يرجى إدخال اسم الحساب / Please enter your account name.");
                    return false;
                }
                break;
            case "username":
                if (!formData.username.trim()) {
                    setError("يرجى إدخال اسم المستخدم / Please enter a username.");
                    return false;
                }
                break;
            case "password":
                if (!formData.password) {
                    setError("يرجى إدخال كلمة المرور / Please enter a password.");
                    return false;
                }
                break;
            case "confirm_password":
                if (formData.password !== formData.confirm_password) {
                    setError("كلمتا المرور غير متطابقتين / Passwords do not match.");
                    return false;
                }
                break;
            case "location":
                if (!formData.location.trim()) {
                    setError("يرجى جلب موقعك / Please fetch your location.");
                    return false;
                }
                break;
            case "phone_number":
                if (!formData.phone_number.trim()) {
                    setError("يرجى إدخال رقم الهاتف / Please enter your phone number.");
                    return false;
                }
                break;
            case "description":
                if (!formData.description.trim()) {
                    setError("يرجى إدخال وصف الحساب / Please provide a description.");
                    return false;
                }
                break;
            case "logo_image":
                if (!formData.logo_image) {
                    setError("يرجى تحميل صورة الشعار / Please upload a logo image.");
                    return false;
                }
                break;
            default:
                return true;
        }

        setError("");
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            if (currentStep < steps.length - 1) {
                setCurrentStep((prev) => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all steps before submitting
        for (let i = 0; i < steps.length; i++) {
            setCurrentStep(i);
            if (!validateStep()) {
                return;
            }
        }

        // Only submit when all steps are validated
        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key]) {
                formDataToSend.append(key, formData[key]);
            }
        });

        const host = process.env.REACT_APP_HOST;

        try {
            const response = await axios.post(host + "/register", formDataToSend);
            if (response.status === 200) {
                navigate("/login", { state: { message: response.data.message } });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "An error occurred during registration."
            );
        }
    };

    const renderCurrentStep = () => {
        const currentKey = steps[currentStep].key;

        switch (currentKey) {
            case "working_in":
                return (
                    <div className="form-group">
                        <label htmlFor="working_in">اختر مجال العمل / Choose Your Field</label>
                        <select
                            className="form-control"
                            name="working_in"
                            value={formData.working_in}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- اختر خيارًا / Choose an option --</option>
                            {jobOptions.map((job, i) => (
                                <option key={i} value={job.en}>
                                    {job.ar} - {job.en}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case "name":
                return (
                    <div className="form-group">
                        <label htmlFor="name">اسم الحساب / Account Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="name"
                            placeholder="ادخل الاسم / Enter name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "username":
                return (
                    <div className="form-group">
                        <label htmlFor="username">اسم المستخدم / Username</label>
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="ادخل اسم المستخدم / Enter username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "password":
                return (
                    <div className="form-group">
                        <label htmlFor="password">كلمة المرور / Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            id="password"
                            placeholder="ادخل كلمة المرور / Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "confirm_password":
                return (
                    <div className="form-group">
                        <label htmlFor="confirm_password">تأكيد كلمة المرور / Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirm_password"
                            id="confirm_password"
                            placeholder="أكد كلمة المرور / Confirm password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "phone_number":
                return (
                    <div className="form-group">
                        <label htmlFor="phone_number">رقم الهاتف / Phone Number</label>
                        <input
                            type="text"
                            className="form-control"
                            name="phone_number"
                            placeholder="ادخل رقم الهاتف / Enter phone number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "location":
                return (
                    <div className="form-group">
                        <label htmlFor="location">موقع الشركة / Company Location</label>
                        <p className="progress-text">اضغط الزر لجلب الموقع / Click the button to fetch your location.</p>
                        <div className="location-btn">
                            <button
                                type="button"
                                className={`btn btn-secondary ${isLocationFetched ? "fetched-location" : ""}`}
                                onClick={getLocation}
                                disabled={isLoadingLocation}
                            >
                                {isLoadingLocation ? (
                                    "جار التحميل..."
                                ) : isLocationFetched ? (
                                    "✓ تم جلب الموقع"
                                ) : (
                                    "جلب الموقع / Get Location"
                                )}
                            </button>
                        </div>
                    </div>
                );
            case "description":
                return (
                    <div className="form-group">
                        <label htmlFor="description">وصف الحساب / Account Description</label>
                        <textarea
                            className="form-control"
                            name="description"
                            rows="3"
                            placeholder="ادخل وصف الحساب / Enter description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>
                );
            case "logo_image":
                return (
                    <div className="form-group">
                        <label htmlFor="logo_image">شعار الحساب / Account Logo</label>
                        <div className="image-upload-container">
                            {previewImage ? (
                                <div className="image-preview">
                                    <img 
                                        src={previewImage} 
                                        alt="Logo preview" 
                                        className="logo-preview"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary change-image-btn"
                                        onClick={() => document.getElementById('logo_image').click()}
                                    >
                                        تغيير الصورة / Change Image
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-area">
                                    <label htmlFor="logo_image" className="upload-label">
                                        <div className="upload-icon">+</div>
                                        <div className="upload-text">
                                            انقر لتحميل الصورة / Click to upload image
                                        </div>
                                    </label>
                                </div>
                            )}
                            <input
                                type="file"
                                id="logo_image"
                                className="form-control-file"
                                name="logo_image"
                                accept=".jpg,.jpeg,.png,.gif"
                                onChange={handleChange}
                                style={{ display: 'none' }}
                                required
                            />
                        </div>
                        <p className="file-requirements">
                            يرجى تحميل صورة بحجم أقل من 2MB / Please upload image less than 2MB
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="register-container">
            <div className="login-header">
                <h2>Create Account</h2>
                <Link to="/login" className="login-btn">
                    LOGIN
                </Link>
            </div>

            <div className="card">
                <div className="step-indicator">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`step ${currentStep === index ? "active" : ""} ${
                                currentStep > index ? "completed" : ""
                            }`}
                        >
                            {index + 1}
                        </div>
                    ))}
                </div>

                <h2>Step {currentStep + 1}: {steps[currentStep].title}</h2>
                
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
                    {renderCurrentStep()}

                    <div className="form-navigation">
                        {currentStep > 0 && (
                            <button type="button" onClick={prevStep} className="btn btn-secondary">
                                السابق / Previous
                            </button>
                        )}
                        {currentStep < steps.length - 1 ? (
                            <button type="button" onClick={nextStep} className="btn btn-primary">
                                التالي / Next
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-success">
                                تسجيل / Submit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;