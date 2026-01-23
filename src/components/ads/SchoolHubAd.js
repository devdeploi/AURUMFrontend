import React, { useState, useEffect } from 'react';

const SchoolHubAd = ({ visible, onClose, variant = 'full' }) => {
    const adImages = [
        '/images/assests/SchoolHub1.png',
        '/images/assests/SchoolHub2.png',
        '/images/assests/SchoolHub3.png',
        '/images/assests/SchoolHub4.png'
    ];
    const logoImage = '/images/assests/Safpro-logo.png';

    const [secondsLeft, setSecondsLeft] = useState(5);
    const [activeSlide, setActiveSlide] = useState(0);
    const [bannerProgress, setBannerProgress] = useState(100);

    // Auto-close timer ONLY for banner variant (premium users)
    useEffect(() => {
        let autoCloseTimer;

        if (visible && variant === 'banner') {
            autoCloseTimer = setTimeout(() => {
                onClose();
            }, 5000);
        }

        return () => {
            if (autoCloseTimer) clearTimeout(autoCloseTimer);
        };
    }, [visible, variant, onClose]);

    // Banner progress bar
    useEffect(() => {
        let progressInterval;

        if (variant === 'banner' && visible) {
            setBannerProgress(100);
            const step = 50;
            const duration = 5000;

            progressInterval = setInterval(() => {
                setBannerProgress(prev => Math.max(0, prev - (100 / (duration / step))));
            }, step);
        }

        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [variant, visible]);

    // Full screen countdown and carousel
    useEffect(() => {
        let countdownTimer;
        let carouselTimer;

        if (visible && variant !== 'banner') {
            setSecondsLeft(5);
            setActiveSlide(0);

            countdownTimer = setInterval(() => {
                setSecondsLeft(prev => Math.max(0, prev - 1));
            }, 1000);

            carouselTimer = setInterval(() => {
                setActiveSlide(prev => (prev + 1) % adImages.length);
            }, 3000);
        }

        return () => {
            if (countdownTimer) clearInterval(countdownTimer);
            if (carouselTimer) clearInterval(carouselTimer);
        };
    }, [visible, variant, adImages.length]);

    const handleAdPress = () => {
        window.open('https://www.safprotech.com/Productsview', '_blank');
    };

    if (!visible) return null;

    // Minimal Premium Banner Variant
    if (variant === 'banner') {
        return (
            <>
                <div
                    className="premium-banner-ad"
                    onClick={handleAdPress}
                >
                    <div className="banner-content">
                        <img src={logoImage} alt="SchoolHub" className="banner-logo" />
                        <div className="banner-text">
                            <div className="banner-title">SchoolHub</div>
                            <div className="banner-subtitle">Smart education management</div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="banner-close"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <div className="banner-progress-track">
                        <div
                            className="banner-progress-bar"
                            style={{ width: `${bannerProgress}%` }}
                        />
                    </div>
                </div>

                <style>{`
                    .premium-banner-ad {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        width: 320px;
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(20px);
                        border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(145, 82, 0, 0.15);
                        border: 1px solid rgba(145, 82, 0, 0.1);
                        overflow: hidden;
                        z-index: 1050;
                        cursor: pointer;
                        animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        transition: all 0.3s ease;
                    }

                    .premium-banner-ad:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 48px rgba(145, 82, 0, 0.2);
                    }

                    .banner-content {
                        display: flex;
                        align-items: center;
                        padding: 16px;
                        gap: 12px;
                    }

                    .banner-logo {
                        width: 40px;
                        height: 40px;
                        border-radius: 10px;
                        object-fit: contain;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }

                    .banner-text {
                        flex: 1;
                        min-width: 0;
                    }

                    .banner-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin-bottom: 2px;
                    }

                    .banner-subtitle {
                        font-size: 12px;
                        color: #666;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .banner-close {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        border: none;
                        background: rgba(145, 82, 0, 0.08);
                        color: #915200;
                        font-size: 20px;
                        line-height: 1;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .banner-close:hover {
                        background: rgba(145, 82, 0, 0.15);
                        transform: rotate(90deg);
                    }

                    .banner-progress-track {
                        height: 2px;
                        background: rgba(145, 82, 0, 0.1);
                    }

                    .banner-progress-bar {
                        height: 100%;
                        background: linear-gradient(90deg, #915200, #b8690a);
                        transition: width 0.05s linear;
                    }

                    @keyframes slideInRight {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}</style>
            </>
        );
    }

    // Full-Screen Premium Variant
    return (
        <>
            <div className="fullscreen-ad-overlay" onClick={handleAdPress}>
                {/* Background Images with Perfect Fit */}
                <div className="ad-background">
                    {adImages.map((img, index) => (
                        <div
                            key={index}
                            className={`ad-slide ${activeSlide === index ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        >
                            <div className="ad-gradient" />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="ad-content">
                    {/* Header */}
                    <div className="ad-header">
                        <div className="ad-sponsor-badge">
                            <img src={logoImage} alt="SchoolHub" className="sponsor-logo" />
                            <span>SPONSORED</span>
                        </div>

                        <div className="ad-countdown">
                            <svg className="countdown-ring" width="50" height="50">
                                <circle cx="25" cy="25" r="22" />
                                <circle
                                    cx="25"
                                    cy="25"
                                    r="22"
                                    style={{
                                        strokeDashoffset: 138 - (138 * (5 - secondsLeft) / 5)
                                    }}
                                />
                            </svg>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="close-button"
                            >
                                {secondsLeft > 0 ? secondsLeft : '×'}
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="ad-main">
                        <div className="ad-logo-container">
                            <img src={logoImage} alt="SchoolHub" className="ad-main-logo" />
                        </div>
                        <h1 className="ad-title">SchoolHub</h1>
                        <p className="ad-description">
                            The next-generation platform for smart institution management and seamless education delivery.
                        </p>
                        <div className="ad-cta">
                            <button
                                className="cta-button"
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                            >
                                Continue to AURUM
                            </button>
                        </div>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="ad-indicators">
                        {adImages.map((_, i) => (
                            <div
                                key={i}
                                className={`indicator ${activeSlide === i ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .fullscreen-ad-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    cursor: pointer;
                    animation: fadeIn 0.4s ease;
                }

                .ad-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

                .ad-slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    opacity: 0;
                    transition: opacity 1s ease-in-out, transform 1.2s ease-in-out;
                    transform: scale(1.05);
                }

                .ad-slide.active {
                    opacity: 1;
                    transform: scale(1);
                }

                .ad-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        to bottom,
                        rgba(0, 0, 0, 0.4) 0%,
                        rgba(0, 0, 0, 0.1) 40%,
                        rgba(0, 0, 0, 0.8) 100%
                    );
                }

                .ad-content {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 40px;
                    color: white;
                }

                .ad-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    animation: slideDown 0.6s ease;
                }

                .ad-sponsor-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 50px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1px;
                }

                .sponsor-logo {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    object-fit: cover;
                }

                .ad-countdown {
                    position: relative;
                    width: 50px;
                    height: 50px;
                }

                .countdown-ring {
                    transform: rotate(-90deg);
                }

                .countdown-ring circle {
                    fill: none;
                    stroke-width: 3;
                }

                .countdown-ring circle:first-child {
                    stroke: rgba(255, 255, 255, 0.2);
                }

                .countdown-ring circle:last-child {
                    stroke: #915200;
                    stroke-dasharray: 138;
                    transition: stroke-dashoffset 1s linear;
                    filter: drop-shadow(0 0 4px rgba(145, 82, 0, 0.6));
                }

                .close-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 50px;
                    height: 50px;
                    border: none;
                    background: transparent;
                    color: white;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .close-button:hover {
                    transform: translate(-50%, -50%) rotate(90deg);
                }

                .ad-main {
                    text-align: center;
                    animation: slideUp 0.8s ease;
                }

                .ad-logo-container {
                    margin-bottom: 24px;
                    display: inline-block;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .ad-main-logo {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
                }

                .ad-title {
                    font-size: 56px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    background: linear-gradient(135deg, #ffffff 0%, #915200 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .ad-description {
                    font-size: 20px;
                    max-width: 600px;
                    margin: 0 auto 32px;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.9);
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                }

                .ad-cta {
                    margin-top: 24px;
                }

                .cta-button {
                    padding: 16px 48px;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    background: linear-gradient(135deg, #915200 0%, #b8690a 100%);
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 8px 24px rgba(145, 82, 0, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(145, 82, 0, 0.6);
                }

                .ad-indicators {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    animation: slideUp 0.8s ease;
                }

                .indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.3);
                    transition: all 0.3s;
                }

                .indicator.active {
                    width: 32px;
                    background: #915200;
                    box-shadow: 0 0 12px rgba(145, 82, 0, 0.8);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .ad-content {
                        padding: 24px;
                    }

                    .ad-title {
                        font-size: 36px;
                    }

                    .ad-description {
                        font-size: 16px;
                    }

                    .cta-button {
                        padding: 14px 36px;
                        font-size: 14px;
                    }
                }
            `}</style>
        </>
    );
};

export default SchoolHubAd;
