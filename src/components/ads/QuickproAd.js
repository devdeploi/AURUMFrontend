import React, { useState, useEffect } from 'react';

const QuickproAd = ({ visible, onClose, variant = 'full' }) => {
    const adImages = [
        '/images/assests/Quickpro1.png',
        '/images/assests/Quickpro2.png',
        '/images/assests/Quickpro3.png',
        '/images/assests/Quickpro4.png'
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

    // Minimal Premium Banner Variant (Dark Theme)
    if (variant === 'banner') {
        return (
            <>
                <div
                    className="premium-banner-ad-dark"
                    onClick={handleAdPress}
                >
                    <div className="banner-content">
                        <img src={logoImage} alt="QuickPro" className="banner-logo" />
                        <div className="banner-text">
                            <div className="banner-title">QuickPro</div>
                            <div className="banner-subtitle">Business growth analytics</div>
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
                    .premium-banner-ad-dark {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        width: 320px;
                        background: rgba(20, 20, 20, 0.98);
                        backdrop-filter: blur(20px);
                        border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(255, 193, 7, 0.2);
                        border: 1px solid rgba(255, 193, 7, 0.15);
                        overflow: hidden;
                        z-index: 1050;
                        cursor: pointer;
                        animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        transition: all 0.3s ease;
                    }

                    .premium-banner-ad-dark:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 48px rgba(255, 193, 7, 0.3);
                    }

                    .premium-banner-ad-dark .banner-content {
                        display: flex;
                        align-items: center;
                        padding: 16px;
                        gap: 12px;
                    }

                    .premium-banner-ad-dark .banner-logo {
                        width: 40px;
                        height: 40px;
                        border-radius: 10px;
                        object-fit: contain;
                        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
                    }

                    .premium-banner-ad-dark .banner-text {
                        flex: 1;
                        min-width: 0;
                    }

                    .premium-banner-ad-dark .banner-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #ffc107;
                        margin-bottom: 2px;
                    }

                    .premium-banner-ad-dark .banner-subtitle {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.6);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .premium-banner-ad-dark .banner-close {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        border: none;
                        background: rgba(255, 193, 7, 0.1);
                        color: #ffc107;
                        font-size: 20px;
                        line-height: 1;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .premium-banner-ad-dark .banner-close:hover {
                        background: rgba(255, 193, 7, 0.2);
                        transform: rotate(90deg);
                    }

                    .premium-banner-ad-dark .banner-progress-track {
                        height: 2px;
                        background: rgba(255, 193, 7, 0.1);
                    }

                    .premium-banner-ad-dark .banner-progress-bar {
                        height: 100%;
                        background: linear-gradient(90deg, #ffc107, #ffca2c);
                        transition: width 0.05s linear;
                        box-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
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
            <div className="fullscreen-ad-overlay-quickpro" onClick={handleAdPress}>
                {/* Background Images with Perfect Fit */}
                <div className="ad-background">
                    {adImages.map((img, index) => (
                        <div
                            key={index}
                            className={`ad-slide ${activeSlide === index ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        >
                            <div className="ad-gradient-dark" />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="ad-content">
                    {/* Header */}
                    <div className="ad-header">
                        <div className="ad-sponsor-badge-gold">
                            <img src={logoImage} alt="QuickPro" className="sponsor-logo" />
                            <span>PRO PARTNER</span>
                        </div>

                        <div className="ad-countdown">
                            <svg className="countdown-ring-gold" width="50" height="50">
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
                                className="close-button-gold"
                            >
                                {secondsLeft > 0 ? secondsLeft : '×'}
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="ad-main">
                        <div className="ad-logo-container-dark">
                            <img src={logoImage} alt="QuickPro" className="ad-main-logo" />
                        </div>
                        <h1 className="ad-title-gold">QuickPro Analytics</h1>
                        <p className="ad-description">
                            Scale your business with real-time insights, AI-driven forecasts, and powerful analytics tools.
                        </p>
                        <div className="ad-cta">
                            <button
                                className="cta-button-gold"
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
                                className={`indicator-gold ${activeSlide === i ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .fullscreen-ad-overlay-quickpro {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    cursor: pointer;
                    animation: fadeIn 0.4s ease;
                }

                .fullscreen-ad-overlay-quickpro .ad-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

                .fullscreen-ad-overlay-quickpro .ad-slide {
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

                .fullscreen-ad-overlay-quickpro .ad-slide.active {
                    opacity: 1;
                    transform: scale(1);
                }

                .ad-gradient-dark {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        to bottom,
                        rgba(0, 0, 0, 0.5) 0%,
                        rgba(0, 0, 0, 0.2) 40%,
                        rgba(0, 0, 0, 0.85) 100%
                    );
                }

                .fullscreen-ad-overlay-quickpro .ad-content {
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

                .fullscreen-ad-overlay-quickpro .ad-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    animation: slideDown 0.6s ease;
                }

                .ad-sponsor-badge-gold {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(10px);
                    border-radius: 50px;
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    color: #ffc107;
                }

                .ad-sponsor-badge-gold .sponsor-logo {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    object-fit: cover;
                }

                .fullscreen-ad-overlay-quickpro .ad-countdown {
                    position: relative;
                    width: 50px;
                    height: 50px;
                }

                .countdown-ring-gold {
                    transform: rotate(-90deg);
                }

                .countdown-ring-gold circle {
                    fill: none;
                    stroke-width: 3;
                }

                .countdown-ring-gold circle:first-child {
                    stroke: rgba(255, 193, 7, 0.2);
                }

                .countdown-ring-gold circle:last-child {
                    stroke: #ffc107;
                    stroke-dasharray: 138;
                    transition: stroke-dashoffset 1s linear;
                    filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.8));
                }

                .close-button-gold {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 50px;
                    height: 50px;
                    border: none;
                    background: transparent;
                    color: #ffc107;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .close-button-gold:hover {
                    transform: translate(-50%, -50%) rotate(90deg);
                }

                .fullscreen-ad-overlay-quickpro .ad-main {
                    text-align: center;
                    animation: slideUp 0.8s ease;
                }

                .ad-logo-container-dark {
                    margin-bottom: 24px;
                    display: inline-block;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                }

                .fullscreen-ad-overlay-quickpro .ad-main-logo {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
                }

                .ad-title-gold {
                    font-size: 56px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
                    background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .fullscreen-ad-overlay-quickpro .ad-description {
                    font-size: 20px;
                    max-width: 600px;
                    margin: 0 auto 32px;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.9);
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                }

                .fullscreen-ad-overlay-quickpro .ad-cta {
                    margin-top: 24px;
                }

                .cta-button-gold {
                    padding: 16px 48px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                    background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 8px 24px rgba(255, 193, 7, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .cta-button-gold:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(255, 193, 7, 0.7);
                    filter: brightness(1.1);
                }

                .fullscreen-ad-overlay-quickpro .ad-indicators {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    animation: slideUp 0.8s ease;
                }

                .indicator-gold {
                    width: 8px;
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(255, 193, 7, 0.3);
                    transition: all 0.3s;
                }

                .indicator-gold.active {
                    width: 32px;
                    background: #ffc107;
                    box-shadow: 0 0 12px rgba(255, 193, 7, 0.8);
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
                    .fullscreen-ad-overlay-quickpro .ad-content {
                        padding: 24px;
                    }

                    .ad-title-gold {
                        font-size: 36px;
                    }

                    .fullscreen-ad-overlay-quickpro .ad-description {
                        font-size: 16px;
                    }

                    .cta-button-gold {
                        padding: 14px 36px;
                        font-size: 14px;
                    }
                }
            `}</style>
        </>
    );
};

export default QuickproAd;
