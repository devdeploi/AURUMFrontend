import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from 'react-bootstrap';
import BottomNav from './BottomNav';
import './Dashboard.css';
import MerchantProfile from './MerchantProfile';
import ManageChits from './ManageChits';

const MerchantDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [goldRates, setGoldRates] = useState({ buy: 0, sell: 0, loading: true });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Fetch Gold Price
    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                const response = await fetch(
                    "https://data-asg.goldprice.org/dbXRates/INR"
                );

                if (!response.ok) {
                    throw new Error("Gold API failed");
                }

                const data = await response.json();

                // XAU price per ounce in INR
                const pricePerOunce = data?.items?.[0]?.xauPrice;
                if (!pricePerOunce) {
                    throw new Error("Invalid gold data");
                }

                // Convert ounce → gram (24K)
                const pricePerGram24K = pricePerOunce / 31.1035;

                // Chennai market adjustments (optional but realistic)
                const chennaiAdjusted = pricePerGram24K * 1.01; // +1% regional premium

                // Buy / Sell spread
                const buyPrice = chennaiAdjusted * 1.03;  // GST + margin
                const sellPrice = chennaiAdjusted * 0.97; // dealer margin

                setGoldRates({
                    buy: buyPrice.toFixed(2),
                    sell: sellPrice.toFixed(2),
                    loading: false
                });

            } catch (error) {
                console.error("Gold price fetch failed:", error);
                setGoldRates(prev => ({ ...prev, loading: false }));
            }
        };

        fetchGoldPrice();

        // Refresh every 60 seconds
        const interval = setInterval(fetchGoldPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    // Merchant tabs definition
    const merchantTabs = [
        { id: 'overview', icon: 'fa-tachometer-alt', label: 'Overview' },
        { id: 'plans', icon: 'fa-list-alt', label: 'My Plans' },
        { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="text-center mt-5">
                        <h2 className="text-secondary">Welcome, {user.name}</h2>
                        <p className="lead text-muted">Manage your business and chit plans efficiently.</p>
                        <div className="row g-4 mt-4 justify-content-center">
                            <div className="col-md-5">
                                <div className="card border-0 shadow-sm p-4 text-center">
                                    <h1 className="display-4 text-primary fw-bold">4</h1>
                                    <p className="text-muted">Active Plans</p>
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="card border-0 shadow-sm p-4 text-center">
                                    <h1 className="display-4 text-success fw-bold">128</h1>
                                    <p className="text-muted">Total Enrolled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'plans':
                return <ManageChits merchantId={user.id} />;
            case 'profile':
                return <MerchantProfile merchantData={user} />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="d-flex align-items-center">
                    <h2
                        className="dashboard-title me-3"
                        style={{
                            fontFamily: "'Scheherazade New', serif",
                            fontWeight: 700,
                            color: "#915200",
                            letterSpacing: "1.2px",
                            textShadow: "0 1px 0 #ffd36a, 0 2px 8px #ffffffff",
                        }}
                    >
                        <i className="fas fa-gem me-2"></i>
                        AURUM
                    </h2>
                    <div
                        className="d-none d-lg-flex align-items-center rounded-pill px-3 py-0 shadow-lg"
                        style={{
                            background:
                                "linear-gradient(225deg, #FFF4CC 0%, #E6C866 40%, #C9A441 75%, #A67C00 100%)",
                            border: "1px solid rgba(90,62,18,0.35)",
                            minWidth: "280px",
                        }}
                    >
                        {/* Premium Coin */}
                        <div
                            className="d-flex align-items-center justify-content-center me-3"
                            style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                background:
                                    "radial-gradient(circle at 30% 30%, #FFF4CC, #C9A441 60%, #A67C00)",
                                boxShadow:
                                    "inset 0 2px 4px rgba(255,255,255,0.6), 0 6px 14px rgba(201,164,65,0.6)",
                                border: "1px solid rgba(90,62,18,0.4)",
                            }}
                        >
                            <i
                                className="fas fa-coins"
                                style={{
                                    fontSize: "1.1rem",
                                    color: "#5A3E12",
                                    textShadow: "0 1px 1px rgba(255,255,255,0.5)",
                                }}
                            />
                        </div>

                        {/* Buy Price */}
                        <div className="d-flex flex-column lh-1 me-4">
                            <span
                                className="fw-semibold text-uppercase"
                                style={{
                                    fontSize: "0.65rem",
                                    letterSpacing: "1.4px",
                                    color: "#6F4E16",
                                }}
                            >
                                24K Gold Buy
                            </span>

                            {goldRates.loading ? (
                                <span className="spinner-border spinner-border-sm text-dark mt-1"></span>
                            ) : (
                                <div className="d-flex align-items-end mt-1">
                                    <span
                                        className="fw-bold"
                                        style={{
                                            fontSize: "1.35rem",
                                            color: "#5A3E12",
                                            letterSpacing: "-0.3px",
                                        }}
                                    >
                                        ₹{goldRates.buy}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            marginLeft: "4px",
                                            color: "#6F4E16",
                                        }}
                                    >
                                        /gm
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Sell Price */}
                        {!goldRates.loading && (
                            <div
                                className="ps-3"
                                style={{
                                    borderLeft: "1px solid rgba(90,62,18,0.35)",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "0.6rem",
                                        letterSpacing: "1.3px",
                                        color: "#6F4E16",
                                    }}
                                >
                                    SELL
                                </span>
                                <span
                                    className="fw-semibold d-block"
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "#5A3E12",
                                    }}
                                >
                                    ₹{goldRates.sell}
                                </span>
                            </div>
                        )}
                    </div>

                </div>

                <Button
                    className="rounded-pill px-4 d-flex align-items-center fw-bold"
                    onClick={() => setShowLogoutModal(true)}
                    style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }}
                >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                </Button>

            </div>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title style={{ color: "#915200" }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Confirm Logout
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <h5>Are you sure you want to logout?</h5>
                    <p className="text-muted">You will be returned to the login screen.</p>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center gap-3 pb-4">
                    <Button variant="light" className="px-4 rounded-pill" onClick={() => setShowLogoutModal(false)}>
                        Cancel
                    </Button>
                    <Button style={{
                        background: "linear-gradient(90deg, #ebdc87 0%, #e2d183 100%)",
                        border: "1px solid #915200",
                        color: "#915200",
                    }} className="px-4 rounded-pill fw-bold" onClick={onLogout}>
                        Yes, Logout
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Mobile ticker if needed, or kept hidden */}
            <div className="d-lg-none bg-light p-2 text-center border-bottom">
                <span className="text-secondary small fw-bold me-2">GOLD (24k):</span>
                <Badge className="me-2 text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>Buy: ₹{goldRates.buy || '...'}</Badge>
                <Badge className="text-white" style={{ background: 'linear-gradient(to right, #4b0082, #00008b)' }}>Sell: ₹{goldRates.sell || '...'}</Badge>
            </div>

            <div className="dashboard-content">
                {renderContent()}
            </div>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={merchantTabs} />
        </div>
    );
};

export default MerchantDashboard;
