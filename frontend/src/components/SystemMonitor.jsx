import React, { useState, useEffect } from 'react';
import { Activity, Server, CheckCircle, XCircle, FileJson, Hash } from 'lucide-react';

const SystemMonitor = () => {
    const [activeTab, setActiveTab] = useState('services');
    const [orderHealth, setOrderHealth] = useState(null);
    const [inventoryHealth, setInventoryHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchHealth = async () => {
        try {
            // Fetch Order Service Health
            try {
                const res = await fetch('http://localhost:3000/health');
                const data = await res.json();
                setOrderHealth({ 
                    httpStatus: res.status, 
                    isUp: res.ok, 
                    data 
                });
            } catch (err) {
                setOrderHealth({ 
                    httpStatus: 0, 
                    isUp: false, 
                    data: { error: 'Service Unreachable' } 
                });
            }

            // Fetch Inventory Service Health
            try {
                const res = await fetch('http://localhost:3001/health');
                const data = await res.json();
                setInventoryHealth({ 
                    httpStatus: res.status, 
                    isUp: res.ok, 
                    data 
                });
            } catch (err) {
                setInventoryHealth({ 
                    httpStatus: 0, 
                    isUp: false, 
                    data: { error: 'Service Unreachable' } 
                });
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error("Monitoring Error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    const ServiceCard = ({ title, health, port }) => {
        if (!health) return <div className="card">Loading...</div>;

        const isUp = health.isUp;
        // Extract dependency statuses if available
        const services = health.data?.services || {};

        return (
            <div className="card" style={{ borderLeft: `4px solid ${isUp ? '#22c55e' : '#ef4444'}` }}>
                <div className="card-header">
                    <h3><Server size={20} /> {title}</h3>
                    <div className={`badge ${isUp ? 'badge-success' : 'badge-error'}`}>
                        {isUp ? 'ONLINE' : 'OFFLINE'}
                    </div>
                </div>
                
                <div className="metrics-row" style={{ marginTop: '1rem' }}>
                    <div className="metric-block">
                        <div className="label">Endpoint</div>
                        <div className="value" style={{ fontSize: '0.9rem' }}>localhost:{port}</div>
                    </div>
                    <div className="metric-block">
                        <div className="label">HTTP Status</div>
                        <div className="value">{health.httpStatus || 'ERR'}</div>
                    </div>
                </div>

                {/* Dependencies List */}
                {Object.keys(services).length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#64748b' }}>DEPENDENCIES</div>
                        {Object.entries(services).map(([key, status]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                                <span style={{ color: status === 'UP' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2>System Monitor</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Live health check of microservices • Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                
                {/* Tab Switcher */}
                <div className="tabs" style={{ display: 'flex', gap: '10px', background: '#fff', padding: '5px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <button 
                        onClick={() => setActiveTab('services')}
                        style={{ 
                            padding: '8px 16px', 
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === 'services' ? '#0f172a' : 'transparent',
                            color: activeTab === 'services' ? '#fff' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Activity size={16} /> Services
                    </button>
                    <button 
                        onClick={() => setActiveTab('health_api')}
                        style={{ 
                            padding: '8px 16px', 
                            borderRadius: '6px',
                            border: 'none',
                            background: activeTab === 'health_api' ? '#0f172a' : 'transparent',
                            color: activeTab === 'health_api' ? '#fff' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FileJson size={16} /> Health API
                    </button>
                </div>
            </div>

            {activeTab === 'services' ? (
                <div className="grid">
                    <ServiceCard title="Order Service" health={orderHealth} port={3000} />
                    <ServiceCard title="Inventory Service" health={inventoryHealth} port={3001} />
                </div>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="card">
                        <div className="card-header">
                            <h3><Hash size={20} /> GET /health (Order Service)</h3>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>:3000</span>
                        </div>
                        <pre style={{ 
                            background: '#0f172a', 
                            color: '#10b981', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            fontSize: '0.85rem',
                            overflow: 'auto',
                            marginTop: '10px'
                        }}>
                            {orderHealth?.data ? JSON.stringify(orderHealth.data, null, 2) : 'Loading...'}
                        </pre>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3><Hash size={20} /> GET /health (Inventory Service)</h3>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>:3001</span>
                        </div>
                        <pre style={{ 
                            background: '#0f172a', 
                            color: '#10b981', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            fontSize: '0.85rem',
                            overflow: 'auto', 
                            marginTop: '10px'
                        }}>
                            {inventoryHealth?.data ? JSON.stringify(inventoryHealth.data, null, 2) : 'Loading...'}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemMonitor;
