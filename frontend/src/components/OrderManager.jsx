import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Plus } from 'lucide-react';
import { fetchOrders } from '../services/api.js';
import OrderForm from './OrderForm.jsx';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {showForm && (
                <div style={{ marginBottom: '20px' }}>
                    <OrderForm />
                </div>
            )}
            
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2><Package className="icon" /> Order History</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowForm(!showForm)} className="icon-btn" style={{ 
                            background: showForm ? '#ef4444' : '#22c55e', 
                            color: '#fff', 
                            padding: '8px 12px', 
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <Plus size={16} /> {showForm ? 'Hide Form' : 'New Order'}
                        </button>
                        <button onClick={loadOrders} className="icon-btn" disabled={isLoading}>
                            <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
                        </button>
                    </div>
                </div>
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
    );
};

export default OrderManager;
