import pool from '../config/db.js';

export const updateInventory = async (productId, quantity, idempotencyKey) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Idempotency check: if already processed, return success immediately
        if (idempotencyKey) {
            const idemResult = await client.query('SELECT * FROM processed_orders WHERE order_id = $1', [idempotencyKey]);
            if (idemResult.rows.length > 0) {
                await client.query('ROLLBACK');
                console.log(`Idempotency check: Order ${idempotencyKey} already processed.`);
                return { success: true, message: 'Inventory updated' }; // Treat as success
            }
        }

        // checking availability
        const checkQuery = 'SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE';
        const checkResult = await client.query(checkQuery, [productId]);
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { success: false, message: 'Product not found' };
        }

        const currentQuantity = checkResult.rows[0].quantity;

        if (currentQuantity < quantity) {
            await client.query('ROLLBACK');
            return { success: false, message: 'Insufficient stock' };
        }

        // updating inventory
        const updateQuery = 'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2';
        await client.query(updateQuery, [quantity, productId]);

        // Record processed order for idempotency
        if (idempotencyKey) {
            await client.query('INSERT INTO processed_orders (order_id) VALUES ($1)', [idempotencyKey]);
        }

        await client.query('COMMIT');
        return { success: true, message: 'Inventory updated' };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error updating inventory:", error);
        return { success: false, message: 'Internal error' };
    } finally {
        client.release();
    }
};

let requestCount = 0;

export const updateInventoryHandler = async (req, res) => {
    requestCount++;
    console.log(`Handling inventory update request #${requestCount}`);

    // simulating gremlin Latency, delay processing for every 5th request
    if (requestCount % 5 === 0) {
        console.log(`Simulating high latency (10s) for known gremlin pattern...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const { product_id, quantity } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];
    
    if (!product_id || !quantity) {
        return res.status(400).json({ error: "Missing product_id or quantity" });
    }

    const result = await updateInventory(product_id, quantity, idempotencyKey);
    
    // DB updated, but client gets error due to process crash simulation
    if (result.success && requestCount % 7 === 0) {
        console.log("Simulating crash after db commit (process exit)");
        process.exit(1); 
    }

    if (result.success) {
        return res.json(result);
    } else {
        const errorMap = {
            'Product not found': 404,
            'Insufficient stock': 409
        };
        const status = errorMap[result.message] || 500;
        return res.status(status).json({ error: result.message });
    }
};

export const getInventory = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
