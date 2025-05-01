import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [message, setMessage] = useState(null);
    const [error, setError] = useState("");
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLocationFetched, setIsLocationFetched] = useState(false);

    const workingInOptions = [
        {
            category: { ar: "البناء والتشييد", en: "Construction & Building" },
            jobs: [
                { ar: "مقاول", en: "Contractor" },
                { ar: "فني بلاط", en: "Tiles Installer" },
                { ar: "فني دهان", en: "Painter" },
                { ar: "فني أرضيات", en: "Flooring Technician" }
            ]
        },
        {
            category: { ar: "السباكة", en: "Plumbing" },
            jobs: [
                { ar: "سباك", en: "Plumber" }
            ]
        },
        {
            category: { ar: "الكهرباء", en: "Electricity" },
            jobs: [
                { ar: "كهربائي", en: "Electrician" },
                { ar: "فني تكييف", en: "AC Technician" },
                { ar: "فني أنظمة أمن", en: "Security Systems Technician" }
            ]
        },
        {
            category: { ar: "النقل والأثاث", en: "Moving & Furniture" },
            jobs: [
                { ar: "عمال نقل", en: "Movers" },
                { ar: "نجار", en: "Carpenter" }
            ]
        },
        {
            category: { ar: "النظافة", en: "Cleaning" },
            jobs: [
                { ar: "عامل نظافة", en: "Cleaner" }
            ]
        },
        {
            category: { ar: "الحدائق", en: "Gardening" },
            jobs: [
                { ar: "بستاني", en: "Gardener" }
            ]
        },
        {
            category: { ar: "أخرى", en: "Other" },
            jobs: [
                { ar: "أخرى", en: "Other" }
            ]
        }
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
        { title: "Logo Image (Optional)", key: "logo_image" },
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
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
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
                    alert("Location fetched successfully!");
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
        if (!validateStep()) return;

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
                err.response?.data?.mseeg ||
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
                            {workingInOptions.map((group, index) => (
                                <optgroup key={index} label={`${group.category.ar} / ${group.category.en}`}>
                                    {group.jobs.map((job, i) => (
                                        <option key={i} value={job.en}>
                                            {job.ar} - {job.en}
                                        </option>
                                    ))}
                                </optgroup>
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
                        <p className="text-muted">اضغط الزر لجلب الموقع / Click the button to fetch your location.</p>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <button
                                type="button"
                                className={`btn btn-secondary ${isLocationFetched ? "fetched-location" : ""}`}
                                onClick={getLocation}
                                disabled={isLoadingLocation}
                                style={{
                                    marginLeft: "10px",
                                    backgroundColor: isLocationFetched ? "#28a745" : "",
                                }}
                            >
                                {isLoadingLocation ? "جار التحميل..." : isLocationFetched ? "تم جلب الموقع!" : "جلب الموقع / Get Location"}
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
                        <label htmlFor="logo_image">شعار الحساب (اختياري) / Account Logo (Optional)</label>
                        <input
                            type="file"
                            className="form-control-file"
                            name="logo_image"
                            accept=".jpg,.jpeg,.png,.gif"
                            onChange={handleChange}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="register-container">
            <h2>Register - Step {currentStep + 1} of {steps.length}</h2>
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
    );
};

export default Register;