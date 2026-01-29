import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';

const InventoryDashboard = () => {
    // Simulating initial inventory state matching seeds
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Gaming Console', stock: 100, status: 'In Stock' },
        { id: 2, name: 'Wireless Controller', stock: 50, status: 'In Stock' },
        { id: 3, name: 'Game Disc', stock: 200, status: 'In Stock' },
        { id: 4, name: 'Headset', stock: 75, status: 'Low Stock' },
        { id: 5, name: 'VR Set', stock: 0, status: 'Out of Stock' },
    ]);
    const [loading, setLoading] = useState(false);

    const refreshInventory = async () => {
        setLoading(true);
        // Simulate API fetch
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2><Layers className="icon" /> Live Inventory</h2>
                <button onClick={refreshInventory} className="icon-btn" disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>Name</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td className={item.stock < 10 ? 'text-danger' : ''}>{item.stock}</td>
                            <td>
                                <span className={`status-dot ${item.stock === 0 ? 'red' : item.stock < 20 ? 'yellow' : 'green'}`}></span>
                                {item.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryDashboard;
