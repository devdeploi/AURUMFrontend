/* eslint-disable no-unused-vars */
import { Form, Button, Card, Row, Col, InputGroup, ProgressBar, Spinner, Navbar, Nav, Container } from 'react-bootstrap';
import './Login.css';
import axios from 'axios';
import { APIURL } from '../utils/Function';
import { useRazorpay } from "react-razorpay";
import { useState, useEffect } from 'react';
import OtpInput from 'react-otp-input';
import { useNavigate } from 'react-router-dom';

// Brand Colors
const brandColor = '#915200';
const goldColor = '#D4AF37';

// Common layout wrapper defined outside to prevent re-renders losing focus
const PageLayout = ({ children, onSwitchToLogin }) => {
    const navigate = useNavigate();

    return (
        <div className="d-flex flex-column all-bold" style={{ backgroundColor: '#f9f9f9' }}>
            <style>{`
                .all-bold, 
                .all-bold div, 
                .all-bold span, 
                .all-bold p, 
                .all-bold h1, .all-bold h2, .all-bold h3, .all-bold h4, .all-bold h5, .all-bold h6,
                .all-bold input, 
                .all-bold textarea, 
                .all-bold button,
                .all-bold a,
                .all-bold label,
                .all-bold small,
                .all-bold li {
                    font-weight: bold !important;
                }
            `}</style>
            {/* Navbar */}
            <Navbar expand="lg" className="bg-white  shadow-sm py-2" sticky="top">
                <Container>
                    <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
                        <img src="/images/AURUM.png" alt="Logo" height="35" className="me-2" />
                        <span className="fw-bold fs-4" style={{ color: brandColor, letterSpacing: '-0.5px' }}>AURUM</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link onClick={() => navigate('/')} className="px-4 ms-lg-3 text-white fw-bold"
                                style={{ backgroundColor: brandColor, borderColor: brandColor, borderRadius: '5px' }}>Home</Nav.Link>
                            {/* <Nav.Link onClick={onSwitchToLogin} className="fw-bold mx-2" style={{ color: brandColor }}>Login</Nav.Link> */}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main Content Center */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5"
                style={{ backgroundColor: brandColor }}>
                {children}
            </div>

            {/* Footer */}
            <footer className="py-1 text-white" style={{ backgroundColor: '#1a1a1a' }}>
                <Container>
                    <Row className="align-items-center">
                        <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
                            <h5 className="fw-bold mb-1 d-flex align-items-center justify-content-center justify-content-md-start">
                                <img src="/images/AURUM.png" alt="" height="20" className="me-2" style={{ filter: 'brightness(0) invert(1)' }} />
                                AURUM
                            </h5>
                            {/* <p className="small opacity-50 mb-0">Secure. Compliant. Efficient.</p> */}
                        </Col>
                        <Col md={6} className="text-center text-md-end">
                            <p className="small opacity-50 mb-0">&copy; {new Date().getFullYear()} Aurum. All rights reserved.</p>
                            {/* <p className="small mb-0">Powered by <span className="fw-bold text-white">Safpro Technology Solutions</span></p> */}
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
};

const MerchantRegister = ({ onRegister, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();
    const [step, setStep] = useState(0); // 0: Email Check, 1: Plan, 2: Details, 3: OTP, 4: Payment/Register
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        plan: '',
        gstin: '',
        addressProof: '',
        billingCycle: 'monthly'
    });

    const [uploading, setUploading] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordError, setPasswordError] = useState('');

    // OTP States
    const [otp, setOtp] = useState(''); // Unified OTP
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Scroll to top whenever step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const plans = [
        {
            name: 'Standard',
            price: formData.billingCycle === 'yearly' ? '₹15,000/yr' : '₹1500/mo',
            amount: formData.billingCycle === 'yearly' ? 15000 : 1500,
            features: ['Manage up to 3 chits', 'Basic Analytics', 'Email Support'],
            color: 'secondary',
            savings: formData.billingCycle === 'yearly' ? 'Save ₹3,000/yr' : ''
        },
        {
            name: 'Premium',
            price: formData.billingCycle === 'yearly' ? '₹50,000/yr' : '₹5000/mo',
            amount: formData.billingCycle === 'yearly' ? 50000 : 5000,
            features: ['Manage up to 6 chits', 'Advanced Analytics', 'Priority 24/7 Support'],
            color: 'secondary',
            savings: formData.billingCycle === 'yearly' ? 'Save ₹10,000/yr' : ''
        }
    ];

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 20;
        if (/[A-Z]/.test(pass)) strength += 20;
        if (/[a-z]/.test(pass)) strength += 20;
        if (/[0-9]/.test(pass)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 20;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            // Only allow numeric input
            if (value && !/^\d*$/.test(value)) return;
        }

        if (name === 'password') {
            const strength = calculateStrength(value);
            setPasswordStrength(strength);
        }
        setFormData({ ...formData, [name]: value });
    };

    // Step 0: Check Email
    const handleCheckEmail = async (e) => {
        e.preventDefault();
        if (!formData.email) return;
        setLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/check-email`, { email: formData.email });
            if (data.exists && data.isMerchant) {
                setRegistrationSuccess(true);
            } else if (data.exists && data.isUser) {
                alert("This email is already registered as a User. Please login.");
                onSwitchToLogin();
            } else {
                setStep(1);
            }
        } catch (error) {
            console.error(error);
            alert("Unable to verify email");
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Select Plan
    const handleSelectPlan = (planName) => {
        setFormData({ ...formData, plan: planName });
        setStep(2);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await axios.post(`${APIURL}/upload`, formDataUpload, config);
            setFormData(prev => ({ ...prev, addressProof: data }));
        } catch (error) {
            console.error(error);
            alert('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({ ...prev, addressProof: '' }));
    };

    // Step 2: Submit Details & Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (formData.phone.length !== 10) {
            alert("Phone number must be exactly 10 digits");
            return;
        }

        if (!formData.gstin) {
            alert("GSTIN Number is required");
            return;
        }

        if (!formData.addressProof) {
            alert("Address Proof is required");
            return;
        }

        if (formData.password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (passwordStrength < 80) {
            setPasswordError("Password is too weak. Ensure it has uppercase, lowercase, numbers, and special chars.");
            return;
        }

        setPasswordError('');
        setLoading(true);

        try {
            // Check if email exists and send OTP
            await axios.post(`${APIURL}/merchants/send-reg-otp`, {
                email: formData.email,
                phone: formData.phone // Send phone for OTP
            });
            setStep(3);
            setOtpSent(true);
            setResendTimer(60);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Failed to send verification code";

            if (error.response?.status === 400 && errorMessage === "Merchant already registered") {
                setRegistrationSuccess(true);
            } else {
                alert(errorMessage);
                if (error.response?.status === 400 && errorMessage.includes("already registered")) {
                    onSwitchToLogin();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(`${APIURL}/merchants/verify-reg-otp`, {
                email: formData.email,
                otp
            });
            if (data.success) {
                // Verified. Move to Payment
                setStep(4);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Payment & Final Registration
    const handlePaymentAndRegister = async () => {
        const selectedPlan = plans.find(p => p.name === formData.plan);
        if (!selectedPlan) return;

        setLoading(true);

        try {
            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: selectedPlan.amount
            });

            // 2. Initialize Razorpay
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S6RoMCiZCpsLo7",
                amount: order.amount,
                currency: order.currency,
                name: "Aurum Jewellery",
                description: `Subscription for ${formData.plan} Plan`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status === 'success') {
                            await registerMerchant(response.razorpay_payment_id);
                        } else {
                            alert("Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed");
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: { color: "#915200" }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Order creation failed');
        } finally {
            setLoading(false);
        }
    };

    const registerMerchant = async (paymentId) => {
        try {
            const payload = {
                ...formData,
                paymentId
            };

            const { data } = await axios.post(`${APIURL}/merchants`, payload);
            setRegistrationSuccess(true);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    if (registrationSuccess) {
        return (
            <PageLayout onSwitchToLogin={onSwitchToLogin}>
                <style>{`
                    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes confetti-fall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) rotate(720deg); opacity: 0; } }
                    .trust-badge { background: #f0fff4; border: 1px solid #c6f6d5; color: #2f855a; padding: 6px 16px; border-radius: 30px; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; }
                `}</style>
                <Card className="shadow-lg border-0 p-0 text-center overflow-hidden mx-auto" style={{ maxWidth: '500px', width: '100%', borderRadius: '20px', animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    {/* Header with success visuals */}
                    <div className="p-4 text-white position-relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${brandColor}, #b47d17)` }}>
                        {/* Confetti Animation */}
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="position-absolute" style={{
                                width: '6px', height: '6px', background: 'rgba(255,255,255,0.85)',
                                left: `${Math.random() * 100}%`, top: '-20px',
                                borderRadius: '2px',
                                animation: `confetti-fall ${2.5 + Math.random()}s linear infinite`,
                                animationDelay: `${Math.random()}s`
                            }}></div>
                        ))}

                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-lg position-relative"
                            style={{ width: '80px', height: '80px', animation: 'slideUp 0.6s ease-out 0.1s backwards' }}>
                            <i className="fas fa-check fa-3x" style={{ color: brandColor }}></i>
                            <div className="position-absolute w-100 h-100 rounded-circle" style={{ border: `3px solid ${brandColor}20`, animation: 'pulse 2s infinite' }}></div>
                        </div>

                        <h3 className="fw-bold mb-1" style={{ animation: 'slideUp 0.6s ease-out 0.2s backwards' }}>Registration Successful!</h3>
                        <p className="opacity-90 mb-0 small" style={{ animation: 'slideUp 0.6s ease-out 0.3s backwards' }}>Welcome to Premium Partner Network</p>
                    </div>

                    <div className="p-4 bg-white">
                        {/* Trust Badge */}
                        <div className="d-flex justify-content-center mb-4" style={{ animation: 'slideUp 0.6s ease-out 0.4s backwards' }}>
                            <span className="trust-badge shadow-sm py-1 px-3" style={{ fontSize: '0.8rem' }}>
                                <i className="fas fa-shield-alt"></i> Payment Verified & 100% Secure
                            </span>
                        </div>

                        <div className="text-start mx-auto" style={{ maxWidth: '380px', animation: 'slideUp 0.6s ease-out 0.5s backwards' }}>
                            <h6 className="fw-bold mb-3 text-muted text-uppercase small ls-1 border-bottom pb-2" style={{ fontSize: '0.75rem' }}>What Happens Next?</h6>

                            <div className="position-relative ps-4 border-start border-2 border-light ms-2 pb-3">
                                <div className="position-absolute start-0 top-0 translate-middle-x bg-success rounded-circle text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '24px', height: '24px', left: '-1px' }}>
                                    <i className="fas fa-check" style={{ fontSize: '0.7rem' }}></i>
                                </div>
                                <div className="ps-2">
                                    <h6 className="fw-bold mb-0 text-success small">Application Received</h6>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Details and payment recorded.</small>
                                </div>
                            </div>

                            <div className="position-relative ps-4 border-start border-2 border-warning ms-2 pb-3">
                                <div className="position-absolute start-0 top-0 translate-middle-x bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '24px', height: '24px', left: '-1px' }}>
                                    <i className="fas fa-hourglass-half" style={{ fontSize: '0.7rem' }}></i>
                                </div>
                                <div className="ps-2">
                                    <h6 className="fw-bold mb-0 text-dark small">Admin Review</h6>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Verification takes 24-48 hours.</small>
                                </div>
                            </div>

                            <div className="position-relative ps-4 border-start border-2 border-light ms-2">
                                <div className="position-absolute start-0 top-0 translate-middle-x bg-white border border-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', left: '-1px' }}>
                                    <span className="fw-bold text-muted" style={{ fontSize: '0.7rem' }}>3</span>
                                </div>
                                <div className="ps-2">
                                    <h6 className="fw-bold mb-0 text-muted small">Access Credentials</h6>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Login details will be sent to <strong>{formData.email}</strong>.</small>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-2" style={{ animation: 'slideUp 0.6s ease-out 0.6s backwards' }}>
                            <Button variant="outline-dark" size="sm" className="px-5 rounded-pill fw-bold w-100 py-2" onClick={() => navigate('/')}>
                                <i className="fas fa-arrow-left me-2"></i> Return to Home
                            </Button>
                        </div>
                    </div>
                </Card>
                {/* DEV ONLY: Preview Toggle */}
                {/* <div className="position-fixed bottom-0 start-0 p-3" style={{ zIndex: 1050 }}>
                    <Button size="sm" variant="secondary" onClick={() => setRegistrationSuccess(false)} style={{ opacity: 0.5 }}>Back to Form (Dev)</Button>
                </div> */}
            </PageLayout>
        );
    }

    return (
        <PageLayout onSwitchToLogin={onSwitchToLogin}>
            <Card className="shadow border-0" style={{ maxWidth: '800px', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
                <div className="p-4 p-md-5">
                    {step > 0 && (
                        <div className="text-center mb-4">
                            <h3 className="fw-bold mb-1" style={{ color: '#915200' }}>Merchant Registration</h3>
                            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                                {[1, 2, 3, 4].map((s) => (
                                    <div key={s} className={`rounded-circle d-flex align-items-center justify-content-center fw-bold small ${step === s ? 'bg-warning text-dark' : (step > s ? 'bg-success text-white' : 'bg-light text-muted')}`}
                                        style={{ width: 30, height: 30, transition: 'all 0.3s' }}>
                                        {step > s ? <i className="fas fa-check"></i> : s}
                                    </div>
                                ))}
                            </div>
                            <p className="text-muted small mt-2">
                                {step === 1 && "Choose Your Plan"}
                                {step === 2 && "Business Details"}
                                {step === 3 && "Verify Identity"}
                                {step === 4 && "Payment & Setup"}
                            </p>
                        </div>
                    )}


                    {/* Billing Cycle Toggle */}
                    {step === 1 && (
                        <div className="d-flex justify-content-center align-items-center gap-3 mb-4">
                            <span className={`fw-bold ${formData.billingCycle === 'monthly' ? 'text-dark' : 'text-muted'}`}>Monthly</span>
                            <div className="form-check form-switch custom-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="regBillingSwitch"
                                    checked={formData.billingCycle === 'yearly'}
                                    onChange={() => setFormData(prev => ({ ...prev, billingCycle: prev.billingCycle === 'monthly' ? 'yearly' : 'monthly' }))}
                                    style={{ width: '3em', height: '1.5em', cursor: 'pointer', backgroundColor: formData.billingCycle === 'yearly' ? brandColor : '#ddd', borderColor: 'transparent' }}
                                />
                            </div>
                            <span className={`fw-bold ${formData.billingCycle === 'yearly' ? 'text-dark' : 'text-muted'}`}>
                                Yearly <span className="badge bg-success ms-1 small">Save 17%</span>
                            </span>
                        </div>
                    )}

                    {/* Step 0: Email Check */}
                    {step === 0 && (
                        <div className="text-center py-2 position-relative">
                            <style>{`
                                @keyframes fadeInUp {
                                    from { opacity: 0; transform: translateY(30px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                                @keyframes float {
                                    0%, 100% { transform: translateY(0px); }
                                    50% { transform: translateY(-10px); }
                                }
                                @keyframes shimmer {
                                    0% { background-position: -1000px 0; }
                                    100% { background-position: 1000px 0; }
                                }
                                .email-input-focus:focus {
                                    border-color: ${brandColor} !important;
                                    box-shadow: 0 0 0 0.2rem rgba(145, 82, 0, 0.15) !important;
                                }
                                .continue-btn {
                                    background: linear-gradient(135deg, ${brandColor} 0%, ${goldColor} 100%);
                                    border: none;
                                    position: relative;
                                    overflow: hidden;
                                    transition: all 0.3s ease;
                                }
                                .continue-btn:hover:not(:disabled) {
                                    transform: translateY(-2px);
                                    box-shadow: 0 8px 20px rgba(145, 82, 0, 0.3);
                                }
                                .continue-btn::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: -100%;
                                    width: 100%;
                                    height: 100%;
                                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                                    transition: left 0.5s;
                                }
                                .continue-btn:hover::before {
                                    left: 100%;
                                }
                            `}</style>

                            {/* Animated Icon */}
                            <div className="mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mx-auto mb-3 position-relative"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        background: `linear-gradient(135deg, ${brandColor}15, ${goldColor}15)`,
                                        animation: 'fadeInUp 0.6s ease-out'
                                    }}>
                                    <i className="fas fa-envelope-open-text fa-3x" style={{ color: brandColor }}></i>
                                    <div className="position-absolute w-100 h-100 rounded-circle"
                                        style={{
                                            border: `2px solid ${goldColor}30`,
                                            animation: 'pulse 2s infinite'
                                        }}></div>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div style={{ animation: 'fadeInUp 0.6s ease-out 0.1s backwards' }}>
                                <h3 className="fw-bold mb-2" style={{
                                    color: brandColor,
                                    fontSize: '1.75rem',
                                    letterSpacing: '-0.5px'
                                }}>
                                    Welcome to AURUM
                                </h3>
                                <p className="text-muted mb-1" style={{ fontSize: '0.95rem' }}>
                                    Let's get you started on your journey
                                </p>
                                <p className="small text-muted mb-5" style={{ opacity: 0.7 }}>
                                    Enter your business email to begin
                                </p>
                            </div>

                            {/* Form */}
                            <Form onSubmit={handleCheckEmail} style={{ maxWidth: '450px', margin: '0 auto', animation: 'fadeInUp 0.6s ease-out 0.2s backwards' }}>
                                <Form.Group className="mb-4 position-relative">
                                    <div className="position-relative">
                                        <i className="fas fa-envelope position-absolute text-muted"
                                            style={{
                                                left: '20px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                fontSize: '1.1rem',
                                                opacity: 0.5
                                            }}></i>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            placeholder="your.email@business.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            size="lg"
                                            className="email-input-focus"
                                            style={{
                                                paddingLeft: '50px',
                                                paddingRight: '20px',
                                                borderRadius: '12px',
                                                border: `2px solid ${brandColor}20`,
                                                fontSize: '1rem',
                                                transition: 'all 0.3s ease'
                                            }}
                                        />
                                    </div>
                                    <Form.Text className="text-muted small d-block mt-2 text-start ps-2">
                                        <i className="fas fa-shield-alt me-1" style={{ color: goldColor }}></i>
                                        Your information is secure and encrypted
                                    </Form.Text>
                                </Form.Group>

                                <Button
                                    type="submit"
                                    disabled={loading || !formData.email}
                                    className="continue-btn w-100 py-3 fw-bold text-white"
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '1.05rem',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" animation="border" className="me-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Continue to Registration
                                            <i className="fas fa-arrow-right ms-2"></i>
                                        </>
                                    )}
                                </Button>

                                {/* Trust Indicators */}
                                <div className="d-flex justify-content-center gap-4 mt-4 pt-3 border-top">
                                    <div className="text-center">
                                        <i className="fas fa-lock mb-1" style={{ color: goldColor, fontSize: '1.2rem' }}></i>
                                        <p className="small text-muted mb-0">Secure</p>
                                    </div>
                                    <div className="text-center">
                                        <i className="fas fa-clock mb-1" style={{ color: goldColor, fontSize: '1.2rem' }}></i>
                                        <p className="small text-muted mb-0">Quick Setup</p>
                                    </div>
                                    <div className="text-center">
                                        <i className="fas fa-check-circle mb-1" style={{ color: goldColor, fontSize: '1.2rem' }}></i>
                                        <p className="small text-muted mb-0">Verified</p>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    )}

                    {/* Step 1: Plan Selection */}
                    {step === 1 && (
                        <div>
                            <style>{`
                                @keyframes slideInScale {
                                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                                    to { opacity: 1; transform: scale(1) translateY(0); }
                                }
                                .plan-card {
                                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                    cursor: pointer;
                                    position: relative;
                                    overflow: hidden;
                                }
                                .plan-card::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    height: 4px;
                                    background: linear-gradient(90deg, ${brandColor}, ${goldColor});
                                    transform: scaleX(0);
                                    transition: transform 0.3s ease;
                                }
                                .plan-card:hover::before {
                                    transform: scaleX(1);
                                }
                                .plan-card:hover {
                                    transform: translateY(-8px);
                                    box-shadow: 0 12px 40px rgba(145, 82, 0, 0.2) !important;
                                }
                                .plan-card.selected {
                                    border-color: ${brandColor} !important;
                                    background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%) !important;
                                    box-shadow: 0 8px 30px rgba(145, 82, 0, 0.15) !important;
                                }
                                .plan-card.selected::before {
                                    transform: scaleX(1);
                                }
                                .feature-item {
                                    transition: all 0.2s ease;
                                    padding: 8px 0;
                                }
                                .plan-card:hover .feature-item {
                                    transform: translateX(5px);
                                }
                                .select-plan-btn {
                                    transition: all 0.3s ease;
                                    position: relative;
                                    overflow: hidden;
                                }
                                .select-plan-btn::after {
                                    content: '';
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    width: 0;
                                    height: 0;
                                    border-radius: 50%;
                                    background: rgba(255, 255, 255, 0.5);
                                    transform: translate(-50%, -50%);
                                    transition: width 0.6s, height 0.6s;
                                }
                                .select-plan-btn:active::after {
                                    width: 300px;
                                    height: 300px;
                                }
                            `}</style>

                            <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                                <h4 className="fw-bold mb-2" style={{ color: brandColor }}>
                                    Choose Your Perfect Plan
                                </h4>
                                <p className="text-muted small">Select a plan that fits your business needs</p>
                            </div>

                            <Row className="g-4">
                                {plans.map((plan, index) => (
                                    <Col md={6} key={plan.name}>
                                        <div
                                            className={`plan-card p-4 rounded-4 border h-100 d-flex flex-column ${formData.plan === plan.name ? 'selected' : ''}`}
                                            style={{
                                                border: formData.plan === plan.name ? `2px solid ${brandColor}` : '2px solid #e9ecef',
                                                backgroundColor: 'white',
                                                animation: `slideInScale 0.5s ease-out ${index * 0.1}s backwards`
                                            }}
                                            onClick={() => handleSelectPlan(plan.name)}
                                        >
                                            {/* Selected Badge */}
                                            {formData.plan === plan.name && (
                                                <div className="position-absolute top-0 end-0 m-3">
                                                    <div className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${brandColor}, ${goldColor})`,
                                                            animation: 'pulse 2s infinite'
                                                        }}>
                                                        <i className="fas fa-check-circle text-white" style={{ fontSize: '0.9rem' }}></i>
                                                        <span className="text-white small fw-bold">Selected</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Savings Badge */}
                                            {plan.savings && (
                                                <div className="position-absolute top-0 start-0 m-3">
                                                    <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm"
                                                        style={{ fontSize: '0.75rem', animation: 'fadeInUp 0.6s ease-out 0.3s backwards' }}>
                                                        <i className="fas fa-tag me-1"></i>{plan.savings}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex-grow-1">
                                                {/* Plan Header */}
                                                <div className="text-center mb-4 mt-3">
                                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                                        style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            background: `linear-gradient(135deg, ${brandColor}15, ${goldColor}15)`,
                                                            border: `2px solid ${formData.plan === plan.name ? brandColor : '#e9ecef'}`
                                                        }}>
                                                        <i className={`fas ${plan.name === 'Premium' ? 'fa-crown' : 'fa-gem'}`}
                                                            style={{
                                                                color: formData.plan === plan.name ? brandColor : '#6c757d',
                                                                fontSize: '1.5rem'
                                                            }}></i>
                                                    </div>
                                                    <h5 className="fw-bold mb-2 text-uppercase"
                                                        style={{
                                                            letterSpacing: '1px',
                                                            color: formData.plan === plan.name ? brandColor : '#2c3e50'
                                                        }}>
                                                        {plan.name}
                                                    </h5>
                                                    <div className="d-flex align-items-baseline justify-content-center gap-1">
                                                        <h2 className="fw-bold mb-0" style={{ color: brandColor, fontSize: '2rem' }}>
                                                            {plan.price.split('/')[0]}
                                                        </h2>
                                                        <span className="text-muted">/{plan.price.split('/')[1]}</span>
                                                    </div>
                                                </div>

                                                {/* Features List */}
                                                <ul className="list-unstyled mb-0">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="feature-item d-flex align-items-start">
                                                            <i className="fas fa-check-circle me-2 mt-1"
                                                                style={{ color: goldColor, fontSize: '0.9rem' }}></i>
                                                            <span className="small" style={{ color: '#4a5568' }}>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Select Button */}
                                            <Button
                                                className="select-plan-btn mt-4 w-100 py-2 fw-bold rounded-pill"
                                                style={formData.plan === plan.name ? {
                                                    background: `linear-gradient(135deg, ${brandColor}, ${goldColor})`,
                                                    border: 'none',
                                                    color: 'white'
                                                } : {
                                                    background: 'white',
                                                    border: `2px solid ${brandColor}30`,
                                                    color: brandColor
                                                }}
                                            >
                                                {formData.plan === plan.name ? (
                                                    <>
                                                        <i className="fas fa-check me-2"></i>
                                                        Continue with {plan.name}
                                                    </>
                                                ) : (
                                                    <>
                                                        Select {plan.name}
                                                        <i className="fas fa-arrow-right ms-2"></i>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                            {/* Additional Info */}
                            <div className="text-center mt-4 pt-3 border-top">
                                <p className="small text-muted mb-0">
                                    <i className="fas fa-info-circle me-1" style={{ color: goldColor }}></i>
                                    You can upgrade or downgrade your plan anytime
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Form Details */}
                    {step === 2 && (
                        <Form onSubmit={handleRequestOtp}>
                            <style>{`
                                .form-section {
                                    background: linear-gradient(135deg, ${brandColor}03, ${goldColor}03);
                                    border-left: 3px solid ${brandColor};
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    margin-bottom: 1.5rem;
                                    animation: fadeInUp 0.5s ease-out backwards;
                                }
                                .form-label-icon {
                                    color: ${goldColor};
                                    margin-right: 8px;
                                    font-size: 0.9rem;
                                }
                                .custom-input {
                                    border: 2px solid #e9ecef;
                                    border-radius: 10px;
                                    transition: all 0.3s ease;
                                    padding: 0.65rem 1rem;
                                }
                                .custom-input:focus {
                                    border-color: ${brandColor};
                                    box-shadow: 0 0 0 0.2rem rgba(145, 82, 0, 0.1);
                                    transform: translateY(-2px);
                                }
                                .custom-input:hover:not(:focus) {
                                    border-color: ${brandColor}50;
                                }
                                .upload-area {
                                    border: 2px dashed ${brandColor}40;
                                    border-radius: 12px;
                                    padding: 1.5rem;
                                    transition: all 0.3s ease;
                                    background: linear-gradient(135deg, ${brandColor}05, transparent);
                                }
                                .upload-area:hover {
                                    border-color: ${brandColor};
                                    background: linear-gradient(135deg, ${brandColor}08, transparent);
                                }
                                .password-strength-bar {
                                    height: 4px;
                                    border-radius: 2px;
                                    transition: all 0.3s ease;
                                }
                                .file-preview {
                                    background: linear-gradient(135deg, #f8f9fa, #ffffff);
                                    border: 2px solid ${goldColor}30;
                                    border-radius: 10px;
                                    padding: 1rem;
                                    animation: slideInScale 0.3s ease-out;
                                }
                            `}</style>

                            {/* Business Information Section */}
                            <div className="form-section" style={{ animationDelay: '0.1s' }}>
                                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: brandColor }}>
                                    <i className="fas fa-building form-label-icon"></i>
                                    Business Information
                                </h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-store me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Business Name
                                            </Form.Label>
                                            <Form.Control
                                                name="name"
                                                placeholder="Enter your business name"
                                                required
                                                onChange={handleChange}
                                                value={formData.name}
                                                className="custom-input"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-envelope me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Email Address
                                            </Form.Label>
                                            <Form.Control
                                                name="email"
                                                type="email"
                                                placeholder="business@example.com"
                                                required
                                                onChange={handleChange}
                                                value={formData.email}
                                                className="custom-input"
                                                readOnly
                                                style={{ background: '#f8f9fa' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-phone me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                name="phone"
                                                placeholder="10-digit mobile number"
                                                required
                                                onChange={handleChange}
                                                value={formData.phone}
                                                maxLength="10"
                                                className="custom-input"
                                            />
                                            <Form.Text className="text-muted small">
                                                <i className="fas fa-info-circle me-1"></i>
                                                We'll send OTP to this number
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-file-invoice me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                GSTIN Number
                                            </Form.Label>
                                            <Form.Control
                                                name="gstin"
                                                placeholder="Enter 15-digit GSTIN"
                                                required
                                                onChange={handleChange}
                                                value={formData.gstin}
                                                className="custom-input"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-map-marker-alt me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Business Address
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                name="address"
                                                placeholder="Enter complete business address with pincode"
                                                required
                                                onChange={handleChange}
                                                value={formData.address}
                                                className="custom-input"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            {/* Document Upload Section */}
                            <div className="form-section" style={{ animationDelay: '0.2s' }}>
                                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: brandColor }}>
                                    <i className="fas fa-file-upload form-label-icon"></i>
                                    Document Verification
                                </h6>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-2">
                                        <i className="fas fa-certificate me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                        GSTIN Certificate / Address Proof
                                    </Form.Label>
                                    {formData.addressProof ? (
                                        <div className="file-preview">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle"
                                                        style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            background: `linear-gradient(135deg, ${brandColor}15, ${goldColor}15)`
                                                        }}>
                                                        <i className="fas fa-file-image fa-lg" style={{ color: brandColor }}></i>
                                                    </div>
                                                    <div>
                                                        <p className="mb-0 fw-bold small text-truncate" style={{ maxWidth: '300px' }}>
                                                            {formData.addressProof}
                                                        </p>
                                                        <small className="text-success d-flex align-items-center">
                                                            <i className="fas fa-check-circle me-1"></i>
                                                            Successfully uploaded
                                                        </small>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={handleRemoveFile}
                                                    className="rounded-pill"
                                                >
                                                    <i className="fas fa-times me-1"></i>
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="upload-area">
                                            <div className="text-center">
                                                <i className="fas fa-cloud-upload-alt fa-3x mb-3" style={{ color: brandColor, opacity: 0.5 }}></i>
                                                <Form.Control
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                    accept="image/*"
                                                    required={!formData.addressProof}
                                                    className="mb-2"
                                                />
                                                {uploading && (
                                                    <div className="d-flex align-items-center justify-content-center text-muted small mt-2">
                                                        <Spinner animation="border" size="sm" className="me-2" style={{ color: brandColor }} />
                                                        Uploading your document...
                                                    </div>
                                                )}
                                                <Form.Text className="text-muted d-block">
                                                    <i className="fas fa-info-circle me-1"></i>
                                                    Upload clear image of GSTIN certificate or address proof (Max 5MB)
                                                </Form.Text>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </div>

                            {/* Security Section */}
                            <div className="form-section" style={{ animationDelay: '0.3s' }}>
                                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: brandColor }}>
                                    <i className="fas fa-shield-alt form-label-icon"></i>
                                    Account Security
                                </h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-lock me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Create Password
                                            </Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter strong password"
                                                    required
                                                    onChange={handleChange}
                                                    value={formData.password}
                                                    className="custom-input"
                                                    style={{ borderRight: 'none' }}
                                                />
                                                <InputGroup.Text
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        background: 'white',
                                                        border: '2px solid #e9ecef',
                                                        borderLeft: 'none',
                                                        borderRadius: '0 10px 10px 0'
                                                    }}
                                                >
                                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: brandColor }}></i>
                                                </InputGroup.Text>
                                            </InputGroup>
                                            <div className="mt-2">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <small className="text-muted">Password Strength</small>
                                                    <small className="fw-bold" style={{
                                                        color: passwordStrength < 50 ? '#dc3545' : passwordStrength < 80 ? '#ffc107' : '#28a745'
                                                    }}>
                                                        {passwordStrength < 50 ? 'Weak' : passwordStrength < 80 ? 'Medium' : 'Strong'}
                                                    </small>
                                                </div>
                                                <ProgressBar
                                                    now={passwordStrength}
                                                    variant={passwordStrength < 50 ? 'danger' : passwordStrength < 80 ? 'warning' : 'success'}
                                                    className="password-strength-bar"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-2">
                                                <i className="fas fa-check-circle me-1" style={{ color: goldColor, fontSize: '0.8rem' }}></i>
                                                Confirm Password
                                            </Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-enter password"
                                                    required
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    value={confirmPassword}
                                                    className="custom-input"
                                                    style={{ borderRight: 'none' }}
                                                />
                                                <InputGroup.Text
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        background: 'white',
                                                        border: '2px solid #e9ecef',
                                                        borderLeft: 'none',
                                                        borderRadius: '0 10px 10px 0'
                                                    }}
                                                >
                                                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: brandColor }}></i>
                                                </InputGroup.Text>
                                            </InputGroup>
                                            {passwordError && (
                                                <small className="text-danger d-block mt-2">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {passwordError}
                                                </small>
                                            )}
                                            {confirmPassword && formData.password === confirmPassword && (
                                                <small className="text-success d-block mt-2">
                                                    <i className="fas fa-check-circle me-1"></i>
                                                    Passwords match
                                                </small>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="mt-3 p-3 rounded" style={{ background: `${brandColor}08` }}>
                                    <small className="text-muted d-block mb-1 fw-bold">
                                        <i className="fas fa-info-circle me-1" style={{ color: goldColor }}></i>
                                        Password Requirements:
                                    </small>
                                    <div className="d-flex flex-wrap gap-2">
                                        <small className={`badge ${formData.password.length >= 8 ? 'bg-success' : 'bg-secondary'}`}>
                                            8+ characters
                                        </small>
                                        <small className={`badge ${/[A-Z]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                                            Uppercase
                                        </small>
                                        <small className={`badge ${/[a-z]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                                            Lowercase
                                        </small>
                                        <small className={`badge ${/[0-9]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                                            Number
                                        </small>
                                        <small className={`badge ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                                            Special char
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex gap-3 mt-4" style={{ animation: 'fadeInUp 0.5s ease-out 0.4s backwards' }}>
                                <Button
                                    variant="outline-secondary"
                                    className="px-4 py-2 rounded-pill"
                                    onClick={() => setStep(1)}
                                    style={{ borderWidth: '2px' }}
                                >
                                    <i className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-grow-1 py-2 fw-bold rounded-pill"
                                    disabled={
                                        loading ||
                                        !formData.name ||
                                        !formData.email ||
                                        !formData.phone ||
                                        !formData.address ||
                                        !formData.gstin ||
                                        !formData.addressProof ||
                                        !formData.password ||
                                        !confirmPassword
                                    }
                                    style={{
                                        background: `linear-gradient(135deg, ${brandColor}, ${goldColor})`,
                                        border: 'none',
                                        color: 'white'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" animation="border" className="me-2" />
                                            Sending verification code...
                                        </>
                                    ) : (
                                        <>
                                            Continue to Verification
                                            <i className="fas fa-arrow-right ms-2"></i>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 3 && (
                        <div className="text-center py-4">
                            <div className="mb-4">
                                <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                                    <i className="fas fa-shield-alt fa-3x" style={{ color: '#915200' }}></i>
                                </div>
                                <h5 className="fw-bold mb-2">Verify Contact Details</h5>
                                <p className="text-muted small px-3">
                                    We've sent a verification code to both your email and phone number.
                                    <br />
                                    Enter the code from either source below.
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp}>
                                <div className="d-flex justify-content-center mb-5">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        numInputs={6}
                                        renderSeparator={<span className="mx-1"></span>}
                                        renderInput={(props) => (
                                            <input
                                                {...props}
                                                style={{
                                                    width: "45px",
                                                    height: "50px",
                                                    border: "1px solid #ced4da",
                                                    borderRadius: "8px",
                                                    fontSize: "1.5rem",
                                                    textAlign: "center",
                                                    color: "#915200",
                                                    fontWeight: "bold",
                                                    outlineColor: '#915200'
                                                }}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="d-flex gap-3">
                                    <Button variant="outline-secondary" className="px-4 rounded-pill" onClick={() => setStep(2)}>Back</Button>
                                    <Button
                                        type="submit"
                                        className="flex-grow-1 text-white rounded-pill fw-bold"
                                        disabled={loading || otp.length < 6}
                                        style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                                    >
                                        {loading ? <Spinner size="sm" animation="border" /> : "Verify & Continue"}
                                    </Button>
                                </div>
                                <div className="text-center mt-3">
                                    <span className="text-muted small">Didn't receive code? </span>
                                    <span
                                        className="fw-bold"
                                        style={{
                                            cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                                            color: resendTimer > 0 ? '#6c757d' : '#915200',
                                            textDecoration: resendTimer > 0 ? 'none' : 'underline'
                                        }}
                                        onClick={resendTimer > 0 ? null : handleRequestOtp}
                                    >
                                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                    </span>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 4 && (
                        <div>
                            <div className="text-center mb-4">
                                <h5 className="mb-1" style={{ color: '#915200' }}>Review & Complete Payment</h5>
                                <p className="text-muted small">Activate your merchant account</p>
                            </div>

                            <div className="p-4 bg-light rounded-4 mb-4 border border-warning border-opacity-25">
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Selected Plan</span>
                                    <span className="fw-bold text-dark">{formData.plan}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Business Name</span>
                                    <span className="fw-bold text-dark">{formData.name}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="text-muted">Email</span>
                                    <span className="fw-bold text-dark">{formData.email}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-2">
                                    <span className="fw-bold" style={{ color: '#915200' }}>Total Amount Payable</span>
                                    <span className="h3 mb-0 fw-bold" style={{ color: '#915200' }}>
                                        {plans.find(p => p.name === formData.plan)?.price}
                                    </span>
                                </div>
                            </div>

                            <div className="d-flex gap-2 mb-4 align-items-start">
                                <Form.Check
                                    type="checkbox"
                                    id="termsCheckbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1"
                                />
                                <small className="text-muted lh-sm mt-2">
                                    I agree to the <a href="/terms" target="_blank" className="fw-bold text-decoration-none" style={{ color: '#915200' }}>Terms of Service</a> and <a href="/privacy" target="_blank" className="fw-bold text-decoration-none" style={{ color: '#915200' }}>Privacy Policy</a>.
                                </small>
                            </div>

                            <div className="alert alert-danger border-danger border-2 d-flex align-items-center mb-4" role="alert">
                                <i className="fas fa-exclamation-circle fa-2x me-3 text-danger"></i>
                                <div>
                                    <h6 className="fw-bold mb-1 text-danger">Mandatory Requirement</h6>
                                    <p className="mb-0 small text-dark">Configuring a valid <strong>Razorpay</strong> account is <strong>MANDATORY</strong> before you can fully register and activate your Merchant account.</p>
                                </div>
                            </div>

                            <Button
                                onClick={handlePaymentAndRegister}
                                disabled={loading || !termsAccepted}
                                size="lg"
                                className="w-100 py-3 text-white fw-bold shadow-sm"
                                style={{ backgroundColor: '#915200', borderColor: '#915200', borderRadius: '50px' }}
                            >
                                {loading ? <Spinner size="sm" animation="border" /> : <span><i className="fas fa-lock me-2"></i>Pay Securely & Register</span>}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
            {/* DEV ONLY: Preview Toggle */}
            {/* <div className="position-fixed bottom-0 start-0 p-3" style={{ zIndex: 1050 }}>
                <Button size="sm" variant="secondary" onClick={() => setRegistrationSuccess(true)} style={{ opacity: 0.5 }}>Preview Success (Dev)</Button>
            </div> */}
        </PageLayout >
    );
};

export default MerchantRegister;
