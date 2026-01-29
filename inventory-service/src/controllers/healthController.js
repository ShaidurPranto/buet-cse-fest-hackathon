import pool from '../config/db.js';

export const getHealth = async (req, res) => {
    try {
        // Check Database Connection
        await pool.query('SELECT 1');
        
        res.status(200).json({ 
            status: 'UP', 
            services: { 
                database: 'UP' 
            } 
        });
    } catch (error) {
        console.error('Health Check Failed:', error);
        res.status(503).json({ 
            status: 'DOWN', 
            services: { 
                database: 'DOWN' 
            },
            message: 'Database connection failed'
        });
    }
};
