import React, { useState } from 'react';
import OrderManager from './components/OrderManager';
import InventoryDashboard from './components/InventoryDashboard';
import SystemMonitor from './components/SystemMonitor';
import './App.css';
import { LayoutDashboard, ShoppingCart, Activity, Rocket, Settings, LogOut, ShieldCheck } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState('orders');

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">
                        <Rocket size={24} strokeWidth={2.5} />
                    </div>
                    <div className="brand-text">
                        <h1>Valerix</h1>
                        <span>Ops Console</span>
                    </div>
                </div>

                <div className="nav-section">
                    <small>OPERATIONS</small>
                    <nav className="nav-menu">
                        <button
                            className={activeTab === 'monitor' ? 'active' : ''}
                            onClick={() => setActiveTab('monitor')}
                        >
                            <Activity size={20} /> System Health
                        </button>
                        <button
                            className={activeTab === 'orders' ? 'active' : ''}
                            onClick={() => setActiveTab('orders')}
                        >
                            <ShoppingCart size={20} /> Order Stream
                        </button>
                        <button
                            className={activeTab === 'inventory' ? 'active' : ''}
                            onClick={() => setActiveTab('inventory')}
                        >
                            <LayoutDashboard size={20} /> Inventory Stock
                        </button>
                    </nav>
                </div>

                <div className="nav-section">
                    <small>SETTINGS</small>
                    <nav className="nav-menu">
                        <button className="nav-disabled">
                            <Settings size={20} /> Configuration
                        </button>
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="avatar">A</div>
                        <div className="user-details">
                            <span className="name">Admin User</span>
                            <span className="role">Reliability Eng.</span>
                        </div>
                    </div>
                    <button className="logout-btn">
                        <LogOut size={16} />
                    </button>
                </div>

                <div className="system-tag">
                    <ShieldCheck size={14} color="#22c55e" /> Validated Environment
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <h2>
                        {activeTab === 'orders' && 'Order Management Stream'}
                        {activeTab === 'inventory' && 'Inventory Control Center'}
                        {activeTab === 'monitor' && 'Resilience & Health Monitor'}
                    </h2>
                    <div className="status-badge">
                        LIVE SIMULATION
                    </div>
                </header>

                <div className="content-area">
                    {activeTab === 'orders' && <OrderManager />}
                    {activeTab === 'inventory' && <InventoryDashboard />}
                    {activeTab === 'monitor' && <SystemMonitor />}
                </div>
            </main>
        </div>
    );
}

export default App;
