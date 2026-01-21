import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { APIURL } from '../utils/Function';

const MerchantSubscribers = ({ merchantId, user, showHeader = true }) => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscribers = async () => {
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
        };

        fetchSubscribers();
    }, [merchantId, user.token]);

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

                                return (
                                    <tr key={index} style={{ verticalAlign: 'middle' }}>
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-light border"
                                                    style={{ width: '40px', height: '40px' }}>
                                                    {item.user.profileImage ?
                                                        <img src={item.user.profileImage} alt="" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default MerchantSubscribers;
