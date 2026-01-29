import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Plus } from 'lucide-react';
import { fetchInventory, restockInventory } from '../services/api';

const InventoryDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [restockProductId, setRestockProductId] = useState('');
    const [restockQty, setRestockQty] = useState(100);
    const [restocking, setRestocking] = useState(false);

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

    const handleRestock = async () => {
        if (!restockProductId || restockQty <= 0) return;
        setRestocking(true);
        try {
            await restockInventory(parseInt(restockProductId), parseInt(restockQty));
            await loadInventory();
            setRestockProductId('');
        } catch (err) {
            console.error('Restock failed:', err);
        } finally {
            setRestocking(false);
        }
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
                <button onClick={loadInventory} className="icon-btn" disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <input
                    type="number"
                    placeholder="Product ID"
                    value={restockProductId}
                    onChange={(e) => setRestockProductId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', width: '120px' }}
                />
                <input
                    type="number"
                    placeholder="Quantity"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', width: '100px' }}
                />
                <button 
                    onClick={handleRestock} 
                    disabled={restocking || !restockProductId}
                    style={{ 
                        padding: '8px 16px', 
                        background: '#22c55e', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Plus size={16} /> Restock
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
