import pool from '../config/db.js';

export const getHealth = async (req, res) => {
    const healthStatus = {
        status: 'UP',
        services: {
            database: 'UNKNOWN',
            tables: 'UNKNOWN'
        }
    };

    try {
        await pool.query('SELECT 1');
        healthStatus.services.database = 'UP';
    } catch (error) {
        console.error('Database Health Check Failed:', error);
        healthStatus.services.database = 'DOWN';
        healthStatus.status = 'DOWN';
        return res.status(503).json({
            ...healthStatus,
            message: 'Database connection failed'
        });
    }

    try {
        const result = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('inventory', 'processed_orders')
        `);
        const tables = result.rows.map(r => r.table_name);
        if (tables.includes('inventory') && tables.includes('processed_orders')) {
            healthStatus.services.tables = 'UP';
        } else {
            healthStatus.services.tables = 'DOWN';
            healthStatus.status = 'DOWN';
            return res.status(503).json({
                ...healthStatus,
                message: 'Required tables not found: inventory, processed_orders'
            });
        }
    } catch (error) {
        console.error('Table Check Failed:', error);
        healthStatus.services.tables = 'DOWN';
        healthStatus.status = 'DOWN';
        return res.status(503).json({
            ...healthStatus,
            message: 'Failed to verify database tables'
        });
    }

    res.status(200).json(healthStatus);
};
