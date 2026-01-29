import pool from '../config/db.js';

export const getHealth = async (req, res) => {
    const healthStatus = {
        status: 'UP',
        services: {
            database: 'UNKNOWN',
            inventory_service: 'UNKNOWN'
        }
    };

    try {
        // 1. Check Database Connection
        try {
            await pool.query('SELECT 1');
            healthStatus.services.database = 'UP';
        } catch (dbError) {
            console.error('Database Health Check Failed:', dbError);
            healthStatus.services.database = 'DOWN';
            healthStatus.status = 'DOWN';
        }

        // 2. Check Inventory Service Dependency
        try {
            // Using a short timeout for health check
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); 

            const response = await fetch('http://inventory-service:3001/health', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                healthStatus.services.inventory_service = 'UP';
            } else {
                healthStatus.services.inventory_service = 'DOWN';
                healthStatus.status = 'DOWN';
            }
        } catch (invError) {
            console.error('Inventory Service Health Check Failed:', invError);
            healthStatus.services.inventory_service = 'DOWN';
            healthStatus.status = 'DOWN'; // Mark overall status as DOWN if dependency is missing? 
                                          // Usually debatable, but safer for "ready" probes.
        }

        if (healthStatus.status === 'UP') {
            res.status(200).json(healthStatus);
        } else {
            res.status(503).json(healthStatus);
        }

    } catch (error) {
        console.error('Unexpected Health Check Error:', error);
        res.status(500).json({ status: 'DOWN', error: 'Internal Server Error' });
    }
};
