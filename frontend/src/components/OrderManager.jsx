import React, { useState, useEffect } from 'react';
import { Package, Activity, AlertCircle, CheckCircle } from 'lucide-react';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [product, setProduct] = useState('1'); // Default product ID
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState(null);

    const handleOrder = async (e) => {
        e.preventDefault();
        setIsOrdering(true);
        setMessage(null);

        const newOrder = {
            id: Date.now(),
            productId: product,
            quantity: parseInt(quantity),
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        // Optimistic UI update
        setOrders(prev => [newOrder, ...prev]);

        try {
            // Simulate API Call to Order Service
            // const response = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(newOrder) ... });

            // Simulating network delay/response for demo purposes
            await new Promise(resolve => setTimeout(resolve, 800));

            // Simulate random success/failure based on spec (Schrödinger's Warehouse)
            const isSuccess = Math.random() > 0.2;

            setOrders(prev => prev.map(o =>
                o.id === newOrder.id
                    ? { ...o, status: isSuccess ? 'completed' : 'failed', error: isSuccess ? null : 'Inventory service timeout' }
                    : o
            ));

            if (isSuccess) {
                setMessage({ type: 'success', text: 'Order processed successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Order failed: Inventory service unresponsive.' });
            }

        } catch (error) {
            setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'failed' } : o));
            setMessage({ type: 'error', text: 'System Error: Could not reach Order Service.' });
        } finally {
            setIsOrdering(false);
        }
    };

    return (
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
                    <button type="submit" className="action-btn" disabled={isOrdering}>
                        {isOrdering ? 'Processing...' : 'Place Order'}
                    </button>
                </form>
                {message && (
                    <div className={`status-message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {message.text}
                    </div>
                )}
            </div>

            <div className="card">
                <h2>Order History</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Status</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan="5" className="empty-state">No recent orders</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className={`status-${order.status}`}>
                                        <td>#{order.id.toString().slice(-4)}</td>
                                        <td>{order.productId}</td>
                                        <td>{order.quantity}</td>
                                        <td>
                                            <span className={`badge ${order.status}`}>{order.status}</span>
                                        </td>
                                        <td>{new Date(order.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
