import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import "./Login.css";

// Make sure you've installed leaflet and added the CSS:
// npm install leaflet react-leaflet
// import 'leaflet/dist/leaflet.css'; // Add this in App.js or index.js

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [message, setMessage] = useState(null);
    const [error, setError] = useState("");
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLocationFetched, setIsLocationFetched] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [coordinates, setCoordinates] = useState(null); // Holds lat/lng

    const jobOptions = [
        { ar: "مقاول" },
        { ar: "فني بلاط" },
        { ar: "فني دهان" },
        { ar: "فني أرضيات" },
        { ar: "سباك" },
        { ar: "كهربائي" },
        { ar: "فني تكييف" },
        { ar: "فني أنظمة أمن" },
        { ar: "عمال نقل" },
        { ar: "نجار" },
        { ar: "عامل نظافة" },
        { ar: "بستاني" },
        { ar: "أخرى" }
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
        { title: "معلومات الحساب", key: "account" },
        { title: "العمل والتواصل", key: "job_contact" },
        { title: "الموقع", key: "location" },
        { title: "تفاصيل إضافية", key: "details" },
    ];

    // Smoothly scroll to top on step change (helps on mobile)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            const timer = setTimeout(() => {
                setMessage(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    // Auto-fetch location when entering the location step
    useEffect(() => {
        const key = steps[currentStep].key;
        if (key === "location" && !isLocationFetched && !isLoadingLocation && !formData.location) {
            getLocation();
        }
    }, [currentStep]);

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
                    setCoordinates({ lat: latitude, lng: longitude });
                    setIsLoadingLocation(false);
                    setIsLocationFetched(true);
                    setError("");
                },
                (err) => {
                    setError("فشل في الحصول على موقعك. يرجى المحاولة مرة أخرى.");
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setError("الموقع غير مدعوم من متصفحك.");
            setIsLoadingLocation(false);
        }
    };

    const validateStep = () => {
        const currentKey = steps[currentStep].key;
        switch (currentKey) {
            case "account": {
                if (!formData.name.trim()) {
                    setError("يرجى إدخال اسم الحساب");
                    return false;
                }
                if (!formData.username.trim()) {
                    setError("يرجى إدخال اسم المستخدم");
                    return false;
                }
                if (!formData.password) {
                    setError("يرجى إدخال كلمة المرور");
                    return false;
                }
                if (formData.password !== formData.confirm_password) {
                    setError("كلمتا المرور غير متطابقتين");
                    return false;
                }
                break;
            }
            case "job_contact": {
                if (!formData.working_in.trim()) {
                    setError("يرجى اختيار مجال العمل");
                    return false;
                }
                if (!formData.phone_number.trim()) {
                    setError("يرجى إدخال رقم الهاتف");
                    return false;
                }
                break;
            }
            case "location": {
                if (!formData.location.trim()) {
                    setError("يرجى جلب موقعك");
                    return false;
                }
                break;
            }
            case "details": {
                if (!formData.description.trim()) {
                    setError("يرجى إدخال وصف الحساب");
                    return false;
                }
                if (!formData.logo_image) {
                    setError("يرجى تحميل صورة الشعار");
                    return false;
                }
                break;
            }
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
        for (let i = 0; i < steps.length; i++) {
            setCurrentStep(i);
            if (!validateStep()) {
                return;
            }
        }

        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key]) {
                formDataToSend.append(key, formData[key]);
            }
        });

        // Vite uses import.meta.env for env variables
        const host = import.meta.env.VITE_HOST;

        try {
            const response = await axios.post((host || "") + "/register", formDataToSend);
            if (response.status === 200) {
                navigate("/login", { state: { message: response.data.message } });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "حدث خطأ أثناء التسجيل"
            );
        }
    };

    const renderCurrentStep = () => {
        const currentKey = steps[currentStep].key;
        switch (currentKey) {
            case "account":
                return (
                    <div className="form-grid form-grid--2">
                        <div className="form-group">
                            <label htmlFor="name">اسم الحساب</label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                placeholder="ادخل الاسم"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">اسم المستخدم</label>
                            <input
                                type="text"
                                className="form-control"
                                name="username"
                                placeholder="ادخل اسم المستخدم"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">كلمة المرور</label>
                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                id="password"
                                placeholder="ادخل كلمة المرور"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm_password">تأكيد كلمة المرور</label>
                            <input
                                type="password"
                                className="form-control"
                                name="confirm_password"
                                id="confirm_password"
                                placeholder="أكد كلمة المرور"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                );
            case "job_contact":
                return (
                    <div className="form-grid form-grid--2">
                        <div className="form-group">
                            <label htmlFor="working_in">اختر مجال العمل</label>
                            <select
                                className="form-control"
                                name="working_in"
                                value={formData.working_in}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- اختر خيارًا --</option>
                                {jobOptions.map((job, i) => (
                                    <option key={i} value={job.ar}>
                                        {job.ar}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone_number">رقم الهاتف</label>
                            <input
                                type="text"
                                className="form-control"
                                name="phone_number"
                                placeholder="ادخل رقم الهاتف"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                );
            case "location":
                return (
                    <div className="form-group">
                        <label htmlFor="location">موقع الشركة</label>
                        <p className="progress-text">اضغط الزر لجلب الموقع.</p>
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
                                    "جلب الموقع"
                                )}
                            </button>
                        </div>

                        {/* Show interactive draggable map only after location is fetched */}
                        {isLocationFetched && coordinates && (
                            <>
                                <div className="map-container">
                                    <MapContainer
                                        center={coordinates}
                                        zoom={13}
                                        scrollWheelZoom={false}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                        />
                                        <Marker
                                            position={coordinates}
                                            draggable={true}
                                            eventHandlers={{
                                                dragend(e) {
                                                    const { lat, lng } = e.target.getLatLng();
                                                    const newPos = { lat, lng };
                                                    setCoordinates(newPos);
                                                    const link = `https://www.google.com/maps?q=${lat},${lng}`;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        location: link
                                                    }));
                                                }
                                            }}
                                        >
                                            <Popup>يمكنك سحب العلامة لتغيير الموقع</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                                <p className="coords-text">
                                    المواقع الحالية: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                                </p>
                                <a
                                    href={formData.location}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="maps-link"
                                >
                                    افتح الموقع الكامل في خرائط جوجل
                                </a>
                            </>
                        )}

                        {error && <p className="error-message">{error}</p>}
                    </div>
                );
            case "details":
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="description">وصف الحساب</label>
                            <textarea
                                className="form-control"
                                name="description"
                                rows="3"
                                placeholder="ادخل وصف الحساب"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="logo_image">شعار الحساب</label>
                            <div className="image-upload-container">
                                {previewImage ? (
                                    <div className="image-preview">
                                        <img
                                            src={previewImage}
                                            alt="معاينة الشعار"
                                            className="logo-preview"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary change-image-btn"
                                            onClick={() => document.getElementById('logo_image').click()}
                                        >
                                            تغيير الصورة
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-area">
                                        <label htmlFor="logo_image" className="upload-label">
                                            <div className="upload-icon">+</div>
                                            <div className="upload-text">
                                                انقر لتحميل الصورة
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
                                يرجى تحميل صورة بحجم أقل من 2MB
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const progressPercent = Math.round((currentStep / (steps.length - 1)) * 100);

    return (
        <div className="register-container" dir="rtl">
            <div className="login-header">
                <h2>إنشاء حساب</h2>
                <Link to="/login" className="login-btn">
                    تسجيل دخول
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
                <div className="progress-bar" aria-label="progress">
                    <div className="progress-bar__inner" style={{ width: `${progressPercent}%` }} />
                </div>
                <h2>الخطوة {currentStep + 1}: {steps[currentStep].title}</h2>
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
                                السابق
                            </button>
                        )}
                        {currentStep < steps.length - 1 ? (
                            <button type="button" onClick={nextStep} className="btn btn-primary">
                                التالي
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-success">
                                تسجيل
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;