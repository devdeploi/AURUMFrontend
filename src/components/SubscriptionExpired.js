import React, { useState } from 'react';
import { Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const SubscriptionExpired = ({ user, onRenew, existingPlanCount }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Calculate Expiry Details
    const expiryDate = user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate) : new Date();
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffDays <= 0;

    // Downgrade Management
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [myChits, setMyChits] = useState([]);
    const [loadingChits, setLoadingChits] = useState(false);

    const fetchChits = async () => {
        setLoadingChits(true);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${user._id}?limit=100`, config);
            setMyChits(data.plans || []);
        } catch (error) {
            console.error("Error fetching chits", error);
        } finally {
            setLoadingChits(false);
        }
    };

    const handleDeleteChit = async (id) => {
        if (window.confirm("Are you sure you want to delete this plan? This cannot be undone.")) {
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${APIURL}/chit-plans/${id}`, config);
                // Update local list
                setMyChits(prev => prev.filter(c => c._id !== id));
            } catch (error) {
                console.error("Error deleting chit plan", error);
                alert("Failed to delete plan.");
            }
        }
    };

    // Derived count from local state if modal is open to reflect real-time deletions
    const currentChitCount = showDowngradeModal ? myChits.length : existingPlanCount;

    // Limit Logic
    const basicLimit = 3;
    const standardLimit = 6;

    // Check restrictions
    const isBasicRestricted = existingPlanCount > basicLimit;
    const isStandardRestricted = existingPlanCount > standardLimit;

    // Helper to get limit for selected plan
    const getLimitWarning = (plan) => {
        if (plan === 'Basic' && isBasicRestricted) return { restricted: true, limit: basicLimit };
        if (plan === 'Standard' && isStandardRestricted) return { restricted: true, limit: standardLimit };
        return { restricted: false };
    };

    const handleRenew = async () => {
        if (!selectedPlan) return;

        // Check for Plan Violation
        const warning = getLimitWarning(selectedPlan);
        if (warning.restricted) {
            // Open management modal instead of payment if downgrading/restricted
            if (!showDowngradeModal) {
                fetchChits();
                setShowDowngradeModal(true);
            }
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            // 1. Create Order
            const { data } = await axios.post(`${APIURL}/merchants/create-renewal-order`, { plan: selectedPlan }, config);
            const { order, keyId } = data;

            // 2. Open Razorpay
            const options = {
                key: keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "AURUM",
                description: `Renew ${selectedPlan} Plan`,
                image: "/images/AURUM.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        setLoading(true);
                        // 3. Verify Payment
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: selectedPlan
                        };

                        const { data } = await axios.post(`${APIURL}/merchants/verify-renewal`, verifyPayload, config);

                        if (data.success) {
                            // Update Local Storage
                            const storedUser = JSON.parse(localStorage.getItem('user'));
                            if (storedUser) {
                                const updated = { ...storedUser, ...data.merchant };
                                localStorage.setItem('user', JSON.stringify(updated));
                            }
                            setShowSuccess(true);
                            setTimeout(() => onRenew(data.merchant), 3000);
                        }
                    } catch (err) {
                        setError('Payment verification failed');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: { color: "#915200" },
                modal: { ondismiss: () => setLoading(false) }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Renewal initiation failed. Please try again.');
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
                <div className="text-center animate__animated animate__fadeIn">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-white shadow mx-auto mb-4" style={{ width: '120px', height: '120px' }}>
                        <i className="fas fa-check-circle fa-4x text-success"></i>
                    </div>
                    <h2 className="fw-bold mb-3" style={{ color: '#915200' }}>Payment Successful!</h2>
                    <p className="text-muted lead mb-4">Your <strong>{selectedPlan}</strong> plan has been renewed successfully.</p>
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (showDowngradeModal) {
        const warning = getLimitWarning(selectedPlan);
        const limit = warning.limit || (selectedPlan === 'Basic' ? basicLimit : standardLimit);

        return (
            <div className="d-flex align-items-center justify-content-center bg-light min-vh-100 py-4">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h4 className="fw-bold text-danger mb-0"><i className="fas fa-exclamation-triangle me-2"></i>Action Required</h4>
                            <p className="text-muted mt-2">
                                You have selected the <strong>{selectedPlan} Plan</strong> (Max {limit} Chits), but you currently have <strong>{myChits.length}</strong> active chit plans.
                            </p>
                        </div>
                        <div className="card-body px-4">
                            <div className="alert alert-warning border-0 d-flex align-items-center">
                                <i className="fas fa-info-circle me-3 fa-2x"></i>
                                <div>
                                    Please delete <strong>{myChits.length - limit}</strong> plan(s) to continue with this plan.
                                    Or switch to a higher plan.
                                </div>
                            </div>
                            {loadingChits ? (
                                <div className="text-center py-5"><div className="spinner-border text-secondary"></div></div>
                            ) : (
                                <div className="list-group list-group-flush border rounded-3 overflow-hidden mb-3">
                                    {myChits.map(chit => (
                                        <div key={chit._id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                            <div>
                                                <h6 className="mb-0 fw-bold text-dark">{chit.planName}</h6>
                                                <small className="text-muted">₹{chit.totalAmount} • {chit.durationMonths} Months</small>
                                            </div>
                                            <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => handleDeleteChit(chit._id)}>Delete</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="card-footer bg-white border-0 pb-4 px-4 d-flex justify-content-between align-items-center">
                            <Button variant="link" className="text-secondary text-decoration-none" onClick={() => setShowDowngradeModal(false)}>
                                &larr; Back to Plans
                            </Button>
                            <Button
                                variant={currentChitCount <= limit ? "success" : "secondary"}
                                className="px-4 rounded-pill fw-bold"
                                disabled={currentChitCount > limit}
                                onClick={handleRenew}
                            >
                                {currentChitCount <= limit ? 'Proceed with Payment' : `Delete ${currentChitCount - limit} More`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex align-items-center justify-content-center bg-light h-100 py-4">
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div className="card-header text-white text-center py-4" style={{ background: 'linear-gradient(135deg, #915200 0%, #d4af37 100%)' }}>
                        <h2 className="mb-0 fw-bold">
                            <i className={`fas ${isExpired ? 'fa-history' : 'fa-clock'} me-2`}></i>
                            {isExpired ? 'Subscription Expired' : 'Renew Subscription'}
                        </h2>
                        <div className="mt-2 text-white-50">Choose a plan that fits your business needs</div>
                    </div>
                    <div className="card-body p-4 p-lg-5">
                        {error && <Alert variant="danger">{error}</Alert>}

                        <h5 className="text-center mb-4 text-secondary">
                            You currently have <strong>{existingPlanCount}</strong> active chit slots.
                        </h5>

                        <Row className="g-3 justify-content-center">
                            {/* Basic Plan */}
                            <Col md={4}>
                                <div
                                    className={`card h-100 cursor-pointer transition-all ${selectedPlan === 'Basic' ? 'border-primary ring-2' : ''}`}
                                    onClick={() => setSelectedPlan('Basic')}
                                    style={{
                                        border: selectedPlan === 'Basic' ? '2px solid #915200' : '1px solid #e0e0e0',
                                        backgroundColor: selectedPlan === 'Basic' ? '#fffaf0' : '#fff'
                                    }}
                                >
                                    <div className="card-body text-center p-3">
                                        <h5 className="fw-bold text-dark">Basic</h5>
                                        <h4 className="my-2 text-secondary fw-bold">₹1500<span className="fs-6 fw-normal">/mo + 18% GST</span></h4>
                                        <div className="text-muted small mb-3">₹15,000/yr + 18% GST</div>
                                        <hr className="my-3" />
                                        <ul className="list-unstyled text-start small text-muted mx-auto mb-3" style={{ maxWidth: '200px' }}>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>3 Chits Only</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Email Support</li>
                                            <li className="mb-2 text-decoration-line-through"><i className="fas fa-times text-muted me-2"></i>Shop Images</li>
                                        </ul>
                                        {isBasicRestricted && (
                                            <div className="text-warning small mt-2 fw-bold bg-warning bg-opacity-10 p-2 rounded">
                                                <i className="fas fa-exclamation-triangle me-1"></i> Limit Exceeded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Standard Plan */}
                            <Col md={4}>
                                <div
                                    className={`card h-100 cursor-pointer transition-all ${selectedPlan === 'Standard' ? 'border-primary ring-2' : ''}`}
                                    onClick={() => setSelectedPlan('Standard')}
                                    style={{
                                        border: selectedPlan === 'Standard' ? '2px solid #915200' : '1px solid #e0e0e0',
                                        backgroundColor: selectedPlan === 'Standard' ? '#fffaf0' : '#fff'
                                    }}
                                >
                                    <div className="card-body text-center p-3">
                                        <div className="mb-2"><span className="badge bg-secondary">Most Popular</span></div>
                                        <h5 className="fw-bold text-dark">Standard</h5>
                                        <h4 className="my-2 text-primary fw-bold" style={{ color: '#915200' }}>₹2500<span className="fs-6 fw-normal">/mo + 18% GST</span></h4>
                                        <div className="text-muted small mb-3">₹25,000/yr + 18% GST</div>
                                        <hr className="my-3" />
                                        <ul className="list-unstyled text-start small text-muted mx-auto mb-3" style={{ maxWidth: '200px' }}>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 6 Chits</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Advanced Dashboard</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Unlimited Shop Images</li>
                                        </ul>
                                        {isStandardRestricted && (
                                            <div className="text-warning small mt-2 fw-bold bg-warning bg-opacity-10 p-2 rounded">
                                                <i className="fas fa-exclamation-triangle me-1"></i> Limit Exceeded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Premium Plan */}
                            <Col md={4}>
                                <div
                                    className={`card h-100 cursor-pointer transition-all ${selectedPlan === 'Premium' ? 'border-primary ring-2' : ''}`}
                                    onClick={() => setSelectedPlan('Premium')}
                                    style={{
                                        border: selectedPlan === 'Premium' ? '2px solid #915200' : '1px solid #e0e0e0',
                                        backgroundColor: selectedPlan === 'Premium' ? '#fffaf0' : '#fff'
                                    }}
                                >
                                    <div className="card-body text-center p-3">
                                        <div className="mb-2"><span className="badge bg-warning text-dark">Best Value</span></div>
                                        <h5 className="fw-bold text-dark">Premium</h5>
                                        <h4 className="my-2 text-warning fw-bold">₹3500<span className="fs-6 fw-normal">/mo + 18% GST</span></h4>
                                        <div className="text-muted small mb-3">₹35,000/yr + 18% GST</div>
                                        <hr className="my-3" />
                                        <ul className="list-unstyled text-start small text-muted mx-auto mb-3" style={{ maxWidth: '200px' }}>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>iOS App Access</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>9 Chit Plan</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Custom Ads</li>
                                            <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Priority Support</li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="text-center mt-4">
                            <Button
                                size="lg"
                                className="px-5 rounded-pill fw-bold"
                                disabled={!selectedPlan || loading}
                                onClick={handleRenew}
                                style={{
                                    background: 'linear-gradient(90deg, #915200 0%, #d4af37 100%)',
                                    border: 'none'
                                }}
                            >
                                {loading ? 'Processing...' : 'Renew Subscription'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpired;
