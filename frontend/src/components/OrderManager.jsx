import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { fetchOrders } from '../services/api.js';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
            console.error('Error loading orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <h2><Package className="icon" /> Order History</h2>
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
    );
};

export default OrderManager;
