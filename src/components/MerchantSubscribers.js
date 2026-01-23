import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, ProgressBar, Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import { APIURL, BASEURL, onError } from '../utils/Function';

const MerchantSubscribers = ({ merchantId, user, showHeader = true }) => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);
    const [highlightedUser, setHighlightedUser] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        variant: 'primary', // primary for approve, danger for reject
        onConfirm: null
    });

    const closeConfirmModal = () => setConfirmModal({ ...confirmModal, show: false });

    const fetchPendingPayments = React.useCallback(async () => {
        try {
            if (!merchantId) return;
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`${APIURL}/payments/offline/pending`, config);
            setPendingPayments(data);
        } catch (error) {
            console.error("Error fetching pending payments", error);
        }
    }, [merchantId, user.token]);

    const fetchSubscribers = React.useCallback(async () => {
        try {
            if (!merchantId) return;
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`${APIURL}/chit-plans/my-subscribers`, config);
            // Deduplicate based on User ID + Plan ID to handle legacy DB duplicates
            const uniqueSubscribers = data.filter((v, i, a) => a.findIndex(t => (t.user._id === v.user._id && t.plan._id === v.plan._id)) === i);

            setSubscribers(uniqueSubscribers);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching subscribers", error);
            setLoading(false);
        }
    }, [merchantId, user.token]);

    useEffect(() => {
        fetchSubscribers();
        fetchPendingPayments();
    }, [fetchSubscribers, fetchPendingPayments]);

    const handleApprove = (paymentId) => {
        setConfirmModal({
            show: true,
            title: 'Approve Payment',
            message: 'Are you sure you want to approve this offline payment? This will update the user\'s plan progress.',
            variant: 'success',
            onConfirm: () => executeApprove(paymentId)
        });
    };

    const executeApprove = async (paymentId) => {
        setActionLoading(paymentId);
        closeConfirmModal();
        try {
            // Find the user ID before approving to highlight them
            const payment = pendingPayments.find(p => p._id === paymentId);
            const userIdToHighlight = payment?.user?._id;

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/approve`, {}, config);

            // Refresh Both Lists Immediately
            await fetchPendingPayments();
            await fetchSubscribers();

            if (userIdToHighlight) {
                setHighlightedUser(userIdToHighlight);
                setTimeout(() => setHighlightedUser(null), 3000);
            }

        } catch (error) {
            console.error("Approve failed", error);
            alert("Failed to approve payment");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (paymentId) => {
        setConfirmModal({
            show: true,
            title: 'Reject Payment',
            message: 'Are you sure you want to reject this payment? This action cannot be undone.',
            variant: 'danger',
            onConfirm: () => executeReject(paymentId)
        });
    };

    const executeReject = async (paymentId) => {
        setActionLoading(paymentId);
        closeConfirmModal();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/reject`, {}, config);

            fetchPendingPayments();
            fetchSubscribers();
        } catch (error) {
            console.error("Reject failed", error);
            alert("Failed to reject payment");
        } finally {
            setActionLoading(null);
        }
    };

    // Manual Payment State
    const [manualPaymentModal, setManualPaymentModal] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [manualForm, setManualForm] = useState({ amount: '', notes: '' });

    const [submittingManual, setSubmittingManual] = useState(false);

    // History Details State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const openHistoryModal = async (subscriber) => {
        setSelectedSubscriber(subscriber);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/payments/history/${subscriber.plan._id}/${subscriber.user._id}`, config);
            setPaymentHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
            alert("Failed to fetch payment history");
        } finally {
            setLoadingHistory(false);
        }
    };

    const openManualPaymentModal = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setManualForm({ amount: subscriber.plan.monthlyAmount.toString(), notes: '' });
        setManualPaymentModal(true);
    };

    const submitManualPayment = async () => {
        if (!selectedSubscriber) return;
        setSubmittingManual(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${APIURL}/payments/offline/record`, {
                chitPlanId: selectedSubscriber.plan._id,
                userId: selectedSubscriber.user._id,
                amount: manualForm.amount,
                notes: manualForm.notes,
                date: new Date().toISOString()
            }, config);

            setManualPaymentModal(false);
            alert("Payment recorded successfully");

            // Refresh Data instead of reload
            fetchSubscribers();
            if (selectedSubscriber.user._id) {
                setHighlightedUser(selectedSubscriber.user._id);
                setTimeout(() => setHighlightedUser(null), 3000);
            }

        } catch (error) {
            console.error("Manual payment failed", error);
            alert("Failed to record payment");
        } finally {
            setSubmittingManual(false);
        }
    };



    return (
        <div className="mb-5">
            {showHeader && (
                <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #f3e9bd 0%, #ebdc87 100%)', color: '#915200' }}>
                        <i className="fas fa-users-cog fa-lg"></i>
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0" style={{ color: '#915200' }}>User Subscriptions</h5>
                        <small className="text-muted">Manage subscriber payments & dues</small>
                    </div>
                </div>
            )}

            {/* Pending Payments Section */}
            {pendingPayments.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <Card.Header className="bg-white border-0 py-3">
                        <div className="d-flex align-items-center">
                            <i className="fas fa-clock text-warning me-2"></i>
                            <h6 className="fw-bold mb-0" style={{ color: '#915200' }}>Pending Offline Validations ({pendingPayments.length})</h6>
                        </div>
                    </Card.Header>
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">User Details</th>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Proof</th>
                                <th>Notes</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayments.map((payment) => (
                                <tr key={payment._id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-start py-2">
                                            {payment.user?.profileImage ? (
                                                <img
                                                    src={`${BASEURL}${payment.user.profileImage}`}
                                                    className="rounded-circle me-3 border"
                                                    width="40" height="40"
                                                    onError={onError}
                                                    alt=""
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="rounded-circle me-3 border d-flex align-items-center justify-content-center bg-light" style={{ width: '40px', height: '40px' }}>
                                                    <i className="fas fa-user text-secondary"></i>
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-bold text-dark">{payment.user?.name || 'Unknown'}</div>
                                                <div className="small text-muted"><i className="fas fa-phone me-1" style={{ fontSize: '0.7rem' }}></i>{payment.user?.phone}</div>
                                                {payment.user?.email && <div className="small text-muted"><i className="fas fa-envelope me-1" style={{ fontSize: '0.7rem' }}></i>{payment.user?.email}</div>}
                                                {payment.user?.address && <div className="small text-muted" style={{ maxWidth: '200px' }}><i className="fas fa-map-marker-alt me-1" style={{ fontSize: '0.7rem' }}></i>{payment.user?.address}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{payment.chitPlan?.planName}</td>
                                    <td>
                                        <span className="fw-bold text-success fs-5">₹{payment.amount}</span>
                                        <div className="small text-muted">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                                    </td>
                                    <td>
                                        {payment.proofImage ? (
                                            <a href={`${BASEURL}${payment.proofImage}`} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center text-decoration-none px-3 py-1 rounded-pill bg-light border" style={{ color: '#915200' }}>
                                                <i className="fas fa-image me-2"></i> View Proof
                                            </a>
                                        ) : <span className="text-muted small">No Proof</span>}
                                    </td>
                                    <td className="small text-muted" style={{ maxWidth: '150px' }} title={payment.notes}>
                                        {payment.notes || '-'}
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                className="rounded-pill px-3 fw-bold"
                                                disabled={actionLoading === payment._id}
                                                onClick={() => handleApprove(payment._id)}
                                                style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                                            >
                                                {actionLoading === payment._id ? '...' : <><i className="fas fa-check me-1"></i> Approve</>}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="rounded-pill px-3 fw-bold"
                                                disabled={actionLoading === payment._id}
                                                onClick={() => handleReject(payment._id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">

                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                        <p>No subscribers found yet.</p>
                    </div>
                ) : (
                    <Table responsive hover className="mb-0 custom-table bg-white">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>User Details</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Plan</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Amount</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem', minWidth: '150px' }}>Paid Progress</th>
                                <th className="py-3" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Balance</th>
                                <th className="py-3 pe-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Pending Dues</th>
                                <th className="py-3 pe-4" style={{ color: '#915200', textTransform: 'uppercase', fontSize: '0.85rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((item, index) => {
                                const percentage = Math.round((item.subscription.installmentsPaid / item.plan.durationMonths) * 100);
                                const remainingBalance = item.plan.totalAmount - item.subscription.totalAmountPaid;
                                const nextDueAmount = item.plan.monthlyAmount;

                                // Calculate missed months / logic if needed. 
                                // For now assuming pendingAmount > 0 implies at least 1 month due.
                                const monthsDueCount = item.subscription.pendingAmount > 0
                                    ? Math.ceil(item.subscription.pendingAmount / item.plan.monthlyAmount)
                                    : 0;

                                const isHighlighted = highlightedUser && (item.user._id === highlightedUser);

                                return (
                                    <tr key={index} style={{
                                        verticalAlign: 'middle',
                                        backgroundColor: isHighlighted ? '#fff8e6' : 'transparent', // Brand highlight color
                                        transition: 'background-color 0.5s ease'
                                    }}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-light border"
                                                    style={{ width: '40px', height: '40px' }}>
                                                    {item.user.profileImage ?
                                                        <img
                                                            src={`${BASEURL}${item.user.profileImage.startsWith('/') ? '' : '/'}${item.user.profileImage}`}
                                                            alt=""
                                                            className="rounded-circle"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={onError}
                                                        /> :
                                                        <span className="fw-bold" style={{ color: '#915200' }}>{item.user.name?.charAt(0)}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{item.user.name}</div>
                                                    <div className="small text-muted">{item.user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="fw-bold text-dark">
                                            {item.plan.planName}
                                            <div className="small text-muted fw-normal">{item.plan.durationMonths} Months</div>
                                        </td>
                                        <td className="fw-bold text-secondary">
                                            ₹{Number(item.plan.totalAmount).toFixed(2)}
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span style={{ fontSize: '0.75rem' }}>₹{Number(item.subscription.totalAmountPaid).toFixed(2)} Paid</span>
                                                <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>{percentage}%</span>
                                            </div>
                                            <ProgressBar
                                                now={percentage}
                                                variant="success"
                                                style={{ height: '6px', borderRadius: '10px' }}
                                            />
                                        </td>
                                        <td className="fw-bold text-warning" style={{ color: '#fd7e14' }}>
                                            ₹{Number(remainingBalance).toFixed(2)}
                                        </td>
                                        <td className="pe-4">
                                            {item.subscription.pendingAmount > 0 ? (
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="danger" className="me-2 px-2 py-1">
                                                        {monthsDueCount} Month{monthsDueCount > 1 ? 's' : ''} Due
                                                    </Badge>
                                                    <span className="fw-bold text-danger">₹{Number(nextDueAmount).toFixed(2)}/mon</span>
                                                </div>
                                            ) : (
                                                <Badge bg="success" className="px-2 py-1">
                                                    <i className="fas fa-check me-1"></i>Up-to-Date
                                                </Badge>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openHistoryModal(item)}
                                                    title="View History"
                                                    style={{
                                                        border: '1px solid #915200',
                                                        color: '#915200',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#915200';
                                                        e.currentTarget.style.color = '#fff';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#915200';
                                                    }}
                                                >
                                                    <i className="fas fa-history"></i>
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    disabled={remainingBalance <= 0}
                                                    onClick={() => openManualPaymentModal(item)}
                                                    title="Paid Offline"
                                                    style={{
                                                        border: '1px solid #915200',
                                                        color: remainingBalance <= 0 ? '#ccc' : '#915200',
                                                        backgroundColor: 'transparent',
                                                        opacity: remainingBalance <= 0 ? 0.5 : 1
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (remainingBalance > 0) {
                                                            e.currentTarget.style.backgroundColor = '#915200';
                                                            e.currentTarget.style.color = '#fff';
                                                        }
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (remainingBalance > 0) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.color = '#915200';
                                                        }
                                                    }}
                                                >
                                                    <i className="fas fa-hand-holding-usd"></i>
                                                </Button>
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card>
            {/* Confirmation Modal */}
            <Modal show={confirmModal.show} onHide={closeConfirmModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ color: '#915200' }}>
                        {confirmModal.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="mb-0 text-muted">{confirmModal.message}</p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" onClick={closeConfirmModal} className="px-4 rounded-pill">
                        Cancel
                    </Button>
                    <Button
                        style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                        onClick={confirmModal.onConfirm}
                        className="px-4 rounded-pill fw-bold"
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Processing Overlay Modal */}
            <Modal show={!!actionLoading || submittingManual} centered backdrop="static" keyboard={false} size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="spinner-border mb-3" role="status" style={{ color: '#915200' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="fw-bold" style={{ color: '#915200' }}>Please Wait</h5>
                    <p className="text-muted mb-0 small">Processing and sending notification emails...</p>
                </Modal.Body>
            </Modal>

            {/* Manual Payment Modal */}
            <Modal show={manualPaymentModal} onHide={() => setManualPaymentModal(false)} centered size="md">
                <Modal.Header closeButton style={{ borderBottom: '2px solid #f3e9bd', backgroundColor: '#fffbf0' }}>
                    <Modal.Title className="d-flex align-items-center" style={{ color: '#915200' }}>
                        <i className="fas fa-money-bill-wave me-2"></i>
                        Record Offline Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '2rem' }}>
                    {selectedSubscriber && (
                        <>
                            {/* User Info Card */}
                            <div className="mb-4 p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 border"
                                        style={{ width: '50px', height: '50px', backgroundColor: '#fff' }}>
                                        {selectedSubscriber.user.profileImage ? (
                                            <img
                                                src={`${BASEURL}${selectedSubscriber.user.profileImage.startsWith('/') ? '' : '/'}${selectedSubscriber.user.profileImage}`}
                                                alt=""
                                                className="rounded-circle"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={onError}
                                            />
                                        ) : (
                                            <span className="fw-bold fs-4" style={{ color: '#915200' }}>
                                                {selectedSubscriber.user.name?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-5">{selectedSubscriber.user.name}</div>
                                        <div className="small text-muted">
                                            <i className="fas fa-phone me-1"></i>
                                            {selectedSubscriber.user.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-gem me-2" style={{ color: '#915200' }}></i>
                                    <span className="fw-bold" style={{ color: '#915200' }}>
                                        {selectedSubscriber.plan.planName}
                                    </span>
                                    <span className="ms-2 small text-muted">
                                        ({selectedSubscriber.plan.durationMonths} months)
                                    </span>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark">
                                    <i className="fas fa-rupee-sign me-2" style={{ color: '#915200' }}></i>
                                    Payment Amount
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text" style={{ backgroundColor: '#fffbf0', borderColor: '#915200', color: '#915200' }}>
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={manualForm.amount}
                                        onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                                        style={{ borderColor: '#915200', fontSize: '1.1rem', fontWeight: '600' }}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <small className="text-muted">
                                    Suggested: ₹{selectedSubscriber.plan.monthlyAmount.toFixed(2)} (Monthly installment)
                                </small>
                            </div>

                            {/* Notes Input */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark">
                                    <i className="fas fa-sticky-note me-2" style={{ color: '#915200' }}></i>
                                    Payment Notes
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="E.g. Paid in cash at shop, Bank transfer, Cheque #12345..."
                                    value={manualForm.notes}
                                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                                    style={{ borderColor: '#915200' }}
                                ></textarea>
                                <small className="text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Add details about how the payment was received
                                </small>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '2px solid #f3e9bd', backgroundColor: '#fffbf0' }}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => setManualPaymentModal(false)}
                        className="px-4"
                    >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                    </Button>
                    <Button
                        style={{ backgroundColor: '#915200', borderColor: '#915200' }}
                        onClick={submitManualPayment}
                        disabled={submittingManual}
                        className="px-4 fw-bold"
                    >
                        {submittingManual ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Recording...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle me-2"></i>
                                Record Payment
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* History Details Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="xl">
                <Modal.Header closeButton style={{ borderBottom: '2px solid #f3e9bd' }}>
                    <Modal.Title style={{ color: '#915200' }}>
                        <i className="fas fa-history me-2"></i> Subscription History
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ backgroundColor: '#fffbf0', overflow: 'hidden' }}>
                    {selectedSubscriber && (
                        <div className="row g-0">
                            {/* Left Column: Details (Fixed/Static) */}
                            <div className="col-md-4 border-end bg-white">
                                <div className="p-4" style={{ height: '100%', overflowY: 'auto', maxHeight: '70vh' }}>
                                    <h6 className="fw-bold mb-4" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>SUBSCRIBER DETAILS</h6>

                                    <div className="text-center mb-4">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
                                            style={{ width: '90px', height: '90px', backgroundColor: '#fffbf0', border: '2px solid #915200' }}>
                                            {selectedSubscriber.user.profileImage ? (
                                                <img src={`${BASEURL}${selectedSubscriber.user.profileImage}`} className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} alt="" onError={onError} />
                                            ) : (
                                                <span className="display-6 fw-bold" style={{ color: '#915200' }}>{selectedSubscriber.user.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <h5 className="fw-bold text-dark mb-1">{selectedSubscriber.user.name}</h5>
                                        <div className="text-muted"><i className="fas fa-phone me-1" style={{ color: '#915200' }}></i>{selectedSubscriber.user.phone}</div>
                                    </div>

                                    <div className="card border-0 mb-3" style={{ backgroundColor: '#fffbf0' }}>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>EMAIL ID</small>
                                                <span className="fw-bold" style={{ wordBreak: 'break-all', color: '#915200' }}>{selectedSubscriber.user.email || '-'}</span>
                                            </div>
                                            <div className="mb-3">
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>FULL ADDRESS</small>
                                                <span className="fw-bold" style={{ color: '#915200' }}>
                                                    {selectedSubscriber.user.address || selectedSubscriber.user.city || 'Address Not Provided'}
                                                </span>
                                            </div>
                                            <div>
                                                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem' }}>JOINED DATE</small>
                                                <span className="fw-bold" style={{ color: '#915200' }}>{new Date(selectedSubscriber.subscription.joinedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3 mt-4" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>PLAN SUMMARY</h6>
                                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ borderLeft: '4px solid #915200' }}>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Plan Name</span>
                                                <span className="fw-bold" style={{ color: '#915200' }}>{selectedSubscriber.plan.planName}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Duration</span>
                                                <span className="fw-bold text-dark">{selectedSubscriber.plan.durationMonths} Months</span>
                                            </div>
                                            <hr className="my-2" style={{ borderColor: '#f3e9bd' }} />
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Total Paid</span>
                                                <span className="fw-bold" style={{ color: '#915200' }}>₹{selectedSubscriber.subscription.totalAmountPaid}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Pending</span>
                                                <span className="fw-bold text-muted">₹{selectedSubscriber.plan.totalAmount - selectedSubscriber.subscription.totalAmountPaid}</span>
                                            </div>
                                            <div className="mt-3 text-center">
                                                <Badge bg="light" className="px-3 py-2 rounded-pill border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                    {selectedSubscriber.subscription.status?.toUpperCase() || 'ACTIVE'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Payment History (Scrollable) */}
                            <div className="col-md-8">
                                <div className="p-4" style={{ height: '70vh', overflowY: 'auto' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0" style={{ color: '#915200', letterSpacing: '1px', fontSize: '0.8rem' }}>PAYMENT HISTORY (A-Z)</h6>
                                        <Badge bg="light" pill style={{ color: '#915200', borderColor: '#915200', borderWidth: '1px', borderStyle: 'solid' }}>
                                            Total: {paymentHistory.length}
                                        </Badge>
                                    </div>

                                    {loadingHistory ? (
                                        <div className="p-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="mb-3 p-3 border rounded bg-white">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <div className="bg-light rounded" style={{ width: '30%', height: '20px' }}></div>
                                                        <div className="bg-light rounded" style={{ width: '20%', height: '20px' }}></div>
                                                    </div>
                                                    <div className="bg-light rounded" style={{ width: '60%', height: '15px' }}></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : paymentHistory.length === 0 ? (
                                        <div className="text-center p-5 text-muted border rounded bg-white mt-4">
                                            <i className="fas fa-receipt fa-3x mb-3 opacity-25" style={{ color: '#915200' }}></i>
                                            <p>No payment history found.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive rounded shadow-sm border">
                                            <Table hover className="mb-0 bg-white small align-middle">
                                                <thead className="sticky-top" style={{ top: 0, zIndex: 1, backgroundColor: '#fffbf0' }}>
                                                    <tr>
                                                        <th className="py-3 ps-3" style={{ color: '#915200' }}>Date</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Amount</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Type</th>
                                                        <th className="py-3" style={{ color: '#915200' }}>Status</th>
                                                        <th className="py-3 pe-3" style={{ color: '#915200' }}>Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentHistory.map((pay) => (
                                                        <tr key={pay._id}>
                                                            <td className="ps-3 py-2 text-nowrap">
                                                                <div className="fw-bold text-dark">{new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}</div>
                                                                <div className="small text-muted">{new Date(pay.paymentDate || pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </td>
                                                            <td className="py-2">
                                                                <div className="fw-bold" style={{ color: '#915200' }}>₹{pay.amount}</div>
                                                            </td>
                                                            <td className="py-2">
                                                                {pay.type === 'offline' ?
                                                                    <Badge bg="light" className="border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                                        <i className="fas fa-hand-holding-usd me-1"></i>Offline
                                                                    </Badge> :
                                                                    <Badge bg="light" className="border" style={{ color: '#915200', borderColor: '#915200' }}>
                                                                        <i className="fas fa-globe me-1"></i>Online
                                                                    </Badge>
                                                                }
                                                            </td>
                                                            <td className="py-2">
                                                                <Badge bg="transparent" className="border" style={{
                                                                    color: pay.status === 'Completed' ? '#915200' : '#888',
                                                                    borderColor: pay.status === 'Completed' ? '#915200' : '#ccc',
                                                                    backgroundColor: pay.status === 'Completed' ? '#fffbf0' : '#f8f9fa'
                                                                }}>
                                                                    {pay.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 text-muted pe-3" style={{ maxWidth: '200px' }}>
                                                                {pay.notes ? <div className="text-truncate" title={pay.notes}>{pay.notes}</div> : <span className="text-muted">-</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light border-top-0 py-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MerchantSubscribers;
