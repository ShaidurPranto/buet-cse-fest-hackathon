import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { fetchInventory } from '../services/api';

const InventoryDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchInventory();
            setInventory(data);
        } catch (err) {
            setError('Failed to load inventory');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const refreshInventory = async () => {
        await loadInventory();
    };

    const getStatus = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity < 20) return 'Low Stock';
        return 'In Stock';
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2><Layers className="icon" /> Live Inventory</h2>
                <button onClick={refreshInventory} className="icon-btn" disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            {loading && inventory.length === 0 ? (
                <div className="loading">Loading inventory...</div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Quantity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.length > 0 ? inventory.map(item => (
                            <tr key={item.product_id}>
                                <td>{item.product_id}</td>
                                <td className={item.quantity < 20 ? 'text-danger' : ''}>{item.quantity}</td>
                                <td>
                                    <span className={`status-dot ${item.quantity === 0 ? 'red' : item.quantity < 20 ? 'yellow' : 'green'}`}></span>
                                    {getStatus(item.quantity)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="text-center">No inventory items available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default InventoryDashboard;
