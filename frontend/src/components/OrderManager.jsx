import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import { createOrder, fetchOrders } from '../services/api.js';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [product, setProduct] = useState('1');
    const [quantity, setQuantity] = useState(1);
    const [userID, setUserID] = useState(201);
    const [message, setMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isError, setIsError] = useState(false);

    // Fetch orders on component mount
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load orders' });
            console.error('Error loading orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrder = async (e) => {
        e.preventDefault();
        setIsOrdering(true);
        setMessage(null);
        setShowModal(false);

        try {
            // Call actual API
            const response = await createOrder(parseInt(product), parseInt(quantity), parseInt(userID));

            // Add new order to list
            const newOrder = {
                id: response.order.id,
                product_id: response.order.product_id,
                quantity: response.order.quantity,
                user_id: response.order.user_id,
                order_status: response.order.order_status || 'PENDING'
            };

            setOrders(prev => [newOrder, ...prev]);

            // Show success modal
            setModalData({
                title: '✓ Order Confirmed',
                type: 'success',
                details: {
                    'Order ID': `#${newOrder.id}`,
                    'Product ID': newOrder.product_id,
                    'Quantity': newOrder.quantity,
                    'User ID': newOrder.user_id,
                    'Status': newOrder.order_status || 'PENDING'
                },
                message: 'Your order has been placed successfully!'
            });
            setIsError(false);
            setShowModal(true);

            // Reset form
            setProduct('1');
            setQuantity(1);

        } catch (error) {
            // Show error modal
            setModalData({
                title: '✗ Order Failed',
                type: 'error',
                details: {
                    'Product ID': product,
                    'Quantity': quantity,
                    'User ID': userID
                },
                message: error.message || 'Failed to place order. Please try again.'
            });
            setIsError(true);
            setShowModal(true);
            console.error('Error placing order:', error);
        } finally {
            setIsOrdering(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    return (
        <>
            {/* Confirmation Modal */}
            {showModal && modalData && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-header ${isError ? 'error' : 'success'}`}>
                            <div className="modal-title-wrapper">
                                {isError ? (
                                    <AlertCircle size={32} className="modal-icon error" />
                                ) : (
                                    <CheckCircle size={32} className="modal-icon success" />
                                )}
                                <h2>{modalData.title}</h2>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-message">{modalData.message}</p>

                            {modalData.details && (
                                <div className="modal-details">
                                    {Object.entries(modalData.details).map(([key, value]) => (
                                        <div key={key} className="detail-row">
                                            <span className="detail-label">{key}:</span>
                                            <span className="detail-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className={`modal-button ${isError ? 'error-btn' : 'success-btn'}`}
                                onClick={closeModal}
                            >
                                {isError ? 'Try Again' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="card">
                    <h2><Package className="icon" /> New Order</h2>
                    <form onSubmit={handleOrder} className="order-form">
                        <div className="form-group">
                            <label>Product ID</label>
                            <select value={product} onChange={e => setProduct(e.target.value)}>
                                <option value="1">Gaming Console (ID: 1)</option>
                                <option value="2">Wireless Controller (ID: 2)</option>
                                <option value="3">Game Disc (ID: 3)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>User ID</label>
                            <input
                                type="number"
                                min="1"
                                value={userID}
                                onChange={e => setUserID(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="action-btn" disabled={isOrdering}>
                            {isOrdering ? 'Processing...' : 'Place Order'}
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h2>Order History</h2>
                    {isLoading ? (
                        <div className="empty-state">Loading orders...</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Product ID</th>
                                        <th>Qty</th>
                                        <th>User ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr><td colSpan="5" className="empty-state">No recent orders</td></tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.id} className={`status-${order.order_status?.toLowerCase() || 'pending'}`}>
                                                <td>#{order.id}</td>
                                                <td>{order.product_id}</td>
                                                <td>{order.quantity}</td>
                                                <td>{order.user_id}</td>
                                                <td>
                                                    <span className={`badge ${order.order_status?.toLowerCase() || 'pending'}`}>
                                                        {order.order_status || 'PENDING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderManager;
