import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, AlertCircle, CheckCircle, ShieldCheck, RefreshCw, Users } from 'lucide-react';

const WINDOW_SIZE_MS = 30000; // 30 seconds rolling window
const ALERT_THRESHOLD = 1.0;  // 1 second threshold

// Helper to calculate P95 latency
const calculateP95 = (reqs) => {
    if (reqs.length === 0) return 0;
    const sorted = [...reqs].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil(0.95 * sorted.length) - 1;
    return sorted[index].duration;
};

const SystemMonitor = () => {
    // State for request history (timestamps, durations, status, type)
    const [requests, setRequests] = useState([]);

    // State for the "Downstream DB" health simulation
    const [isDbUp, setIsDbUp] = useState(true);
    const [lastHealthCheck, setLastHealthCheck] = useState(new Date());

    // Effect: The "Clock" - cleans up old data every second to ensure the window rolls
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setRequests(prevRequests =>
                prevRequests.filter(req => (now - req.timestamp) < WINDOW_SIZE_MS)
            );
            setLastHealthCheck(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Helper: Simulate a request coming in
    const simulateRequest = (durationSec, type = 'normal') => {
        let status = 'success';
        let resilienceOutcome = 'none'; // 'recovered', 'blocked_duplicate', 'uncertain'

        // Logic for Schrödinger's Simulation
        if (!isDbUp) {
            status = 'error';
        } else if (type === 'gremlin') {
            status = 'timeout'; // Simulating timeout > 2s
        } else if (type === 'crash_commit') {
            // Only if simulated "Crash after Commit"
            status = 'success'; // User sees success eventually
            resilienceOutcome = 'recovered'; // But backend had to recover it
        } else if (type === 'duplicate') {
            status = 'success';
            resilienceOutcome = 'blocked_duplicate';
        }

        const newReq = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            duration: durationSec,
            status: status,
            resilienceOutcome: resilienceOutcome
        };
        setRequests(prev => [...prev, newReq]);
    };

    // --- METRICS CALCULATION ---

    // 1. Latency & Performance (Rolling 30s)
    const avgResponseTime = requests.length > 0
        ? requests.reduce((acc, curr) => acc + curr.duration, 0) / requests.length
        : 0;
    const p95Latency = calculateP95(requests);
    const rps = (requests.length / 30).toFixed(1); // Avg RPS over 30s window
    const isCritical = avgResponseTime > ALERT_THRESHOLD;

    // 2. Reliability & Counters
    const metrics = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        if (req.resilienceOutcome === 'recovered') acc.recovered++;
        if (req.resilienceOutcome === 'blocked_duplicate') acc.blocked++;
        return acc;
    }, { success: 0, timeout: 0, error: 0, recovered: 0, blocked: 0 });

    // 3. UX Metric
    const totalReqs = requests.length || 1;
    const userSuccessRate = ((metrics.success / totalReqs) * 100).toFixed(1);

    return (
        <div className="dashboard-container">

            {/* LAYER 2: VISUAL ALERT (CRITICAL REQUIREMENT) */}
            <div className={`alert-box ${isCritical ? 'status-red' : 'status-green'}`}>
                {isCritical ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <AlertCircle size={32} /> CRITICAL: LATENCY {avgResponseTime.toFixed(2)}s
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <CheckCircle size={32} /> SYSTEM OPERATION NORMAL
                    </div>
                )}
            </div>

            <div className="grid">
                {/* LAYER 2: PERFORMANCE METRICS */}
                <div className="card">
                    <div className="card-header">
                        <h3><Activity size={20} /> Performance (30s Window)</h3>
                    </div>
                    <div className="metrics-row">
                        <MetricBlock label="Avg Latency" value={`${avgResponseTime.toFixed(2)}s`} color={isCritical ? '#ef4444' : '#22c55e'} />
                        <MetricBlock label="P95 Latency" value={`${p95Latency.toFixed(2)}s`} />
                        <MetricBlock label="RPS" value={rps} />
                    </div>
                </div>

                {/* LAYER 3: RELIABILITY & SCHRÖDINGER METRICS */}
                <div className="card">
                    <div className="card-header">
                        <h3><ShieldCheck size={20} /> Resilience (Schrödinger)</h3>
                    </div>
                    <div className="resilience-grid">
                        <div className="res-item">
                            <span>Uncertain/Recovered</span>
                            <span className="badge badge-warning">{metrics.recovered}</span>
                        </div>
                        <div className="res-item">
                            <span>Duplicates Blocked</span>
                            <span className="badge badge-success">{metrics.blocked}</span>
                        </div>
                        <div className="res-item">
                            <span>Timeouts Handled</span>
                            <span className="badge badge-error">{metrics.timeout}</span>
                        </div>
                    </div>
                </div>

                {/* LAYER 4: USER EXPERIENCE */}
                <div className="card">
                    <div className="card-header">
                        <h3><Users size={20} /> User Experience</h3>
                    </div>
                    <div className="ux-score">
                        <div className="score-value" style={{ color: userSuccessRate > 95 ? '#16a34a' : '#ca8a04' }}>
                            {userSuccessRate}%
                        </div>
                        <div className="sub-text">Success Rate</div>
                    </div>
                    <div className="mini-feed">
                        <div>✅ {metrics.success} Successful</div>
                        <div>❌ {metrics.error} Server Errors</div>
                    </div>
                </div>

                {/* LAYER 1: SERVICE HEALTH */}
                <div className="card">
                    <div className="card-header-small">
                        <h3>Deep Health Check</h3>
                        <span style={{ fontSize: '0.7rem' }}>Last: {lastHealthCheck.toLocaleTimeString()}</span>
                    </div>

                    <HealthItem name="Order Service" isUp={true} />
                    <HealthItem name="Inventory Service" isUp={isDbUp} />
                    <HealthItem name="Inv. DB (Downstream)" isUp={isDbUp} />
                </div>
            </div>

            {/* SIMULATION CONTROLS */}
            <div className="controls">
                <h3>Chaos Engineering Controls</h3>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>Inject failures to verify durability</p>

                <div className="button-group">
                    {/* Normal Traffic */}
                    <button className="btn btn-norm" onClick={() => simulateRequest(0.2)}>
                        Normal Traffic
                    </button>

                    {/* Latency Spike */}
                    <button className="btn btn-slow" onClick={() => simulateRequest(5.0, 'gremlin')}>
                        Inject Gremlin (Latency)
                    </button>

                    {/* Crash After Commit Scenario */}
                    <button className="btn" style={{ backgroundColor: '#8b5cf6' }} onClick={() => simulateRequest(0.8, 'crash_commit')}>
                        Simulate "Crash After Commit"
                    </button>

                    {/* Duplicate Message Scenario */}
                    <button className="btn" style={{ backgroundColor: '#0ea5e9' }} onClick={() => simulateRequest(0.1, 'duplicate')}>
                        Simulate Duplicate Msg
                    </button>

                    {/* Infrastructure Failure */}
                    <button className="btn btn-fail" onClick={() => setIsDbUp(!isDbUp)}>
                        {isDbUp ? 'Kill Database' : 'Restore Database'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricBlock = ({ label, value, color }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || 'inherit' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
    </div>
);

const HealthItem = ({ name, isUp }) => (
    <div className="health-item">
        <span>{name}</span>
        <span className={`badge ${isUp ? 'badge-up' : 'badge-down'}`}>
            {isUp ? "UP" : "DOWN"}
        </span>
    </div>
);

export default SystemMonitor;
