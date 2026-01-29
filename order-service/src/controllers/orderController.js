import pool from '../config/db.js';
import { sendInventoryRequest } from '../config/rabbitmq.js';

let orderRequestCount = 0;

// Response time tracking for rolling 30s window
const responseTimes = [];
const WINDOW_MS = 30000;

export const addResponseTime = (duration) => {
    const now = Date.now();
    responseTimes.push({ time: now, duration });
    // Clean old entries
    while (responseTimes.length > 0 && responseTimes[0].time < now - WINDOW_MS) {
        responseTimes.shift();
    }
};

export const getMetrics = (req, res) => {
    const now = Date.now();
    const recent = responseTimes.filter(r => r.time >= now - WINDOW_MS);
    const avgResponseTime = recent.length > 0 
        ? recent.reduce((sum, r) => sum + r.duration, 0) / recent.length 
        : 0;
    const isAlert = avgResponseTime > 1000;
    
    res.json({
        avgResponseTime: Math.round(avgResponseTime),
        requestCount: recent.length,
        isAlert,
        windowMs: WINDOW_MS
    });
};

export const getOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "order"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createOrder = async (req, res) => {
    const startTime = Date.now();
    orderRequestCount++;
    const { product_id, quantity, user_id } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    // basic validation
    if (!product_id || !quantity || !user_id) {
        return res.status(400).json({ error: "Missing required fields: product_id, quantity, user_id" });
    }

    const client = await pool.connect();

    try {
        let newOrder;

        // Check for existing order by Idempotency Key
        if (idempotencyKey) {
            const existingResult = await pool.query('SELECT * FROM "order" WHERE idempotency_key = $1', [idempotencyKey]);
            if (existingResult.rows.length > 0) {
                newOrder = existingResult.rows[0];
                console.log(`Idempotency hit: Order ${newOrder.id} found for key ${idempotencyKey}`);

                if (newOrder.order_status === 'DONE') {
                    return res.status(200).json({
                        order: newOrder,
                        inventory_status: 'SUCCESS',
                        message: "Order already processed (Idempotent)"
                    });
                }
            }
        }

        if (!newOrder) {
            await client.query('BEGIN');

            // foreign key constraint will handle non-existent product_id
            const insertQuery = `
                INSERT INTO "order" (product_id, quantity, user_id, order_status, idempotency_key)
                VALUES ($1, $2, $3, 'PENDING', $4)
                RETURNING id, product_id, quantity, user_id, order_status
            `;
            try {
                const result = await client.query(insertQuery, [product_id, quantity, user_id, idempotencyKey]);
                newOrder = result.rows[0];
                await client.query('COMMIT');
                console.log(`Order ${newOrder.id} created successfully.`);
            } catch (err) {
                await client.query('ROLLBACK');
                if (err.code === '23505') { // Unique violation for idempotency_key
                    const existingResult = await pool.query('SELECT * FROM "order" WHERE idempotency_key = $1', [idempotencyKey]);
                    newOrder = existingResult.rows[0];
                    if (newOrder.order_status === 'DONE') {
                        return res.status(200).json({ order: newOrder, inventory_status: 'SUCCESS', message: "Order already processed" });
                    }
                } else {
                    throw err;
                }
            }
        }

        // syncing via rabbitmq rpc
        let inventorySuccess = false;
        let inventoryMessage = '';
        let lastError = null;

        for (let i = 0; i < 3; i++) {
            try {
                console.log(`Attempting inventory update for Order ${newOrder.id} via RabbitMQ (Attempt ${i + 1})`);

                const response = await sendInventoryRequest({
                    product_id: newOrder.product_id,
                    quantity: newOrder.quantity,
                    idempotencyKey: newOrder.id.toString()
                });

                if (response.success) {
                    inventorySuccess = true;
                    inventoryMessage = response.message;
                    break;
                } else {
                    // Don't retry on client errors
                    if ([400, 404, 409].includes(response.status)) {
                        throw new Error(response.message || 'Inventory Client Error');
                    }
                    console.warn(`Inventory update failed (Attempt ${i + 1}): ${response.message}`);
                    lastError = new Error(response.message);
                }

            } catch (error) {
                console.error(`Error communicating with Inventory Service (Attempt ${i + 1}):`, error.message);
                lastError = error;
                if (error.message.includes('Inventory Client Error') || error.message.includes('Product not found') || error.message.includes('Insufficient stock')) {
                    break;
                }
            }

            // Backoff before retry
            if (!inventorySuccess && i < 2) {
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        if (inventorySuccess) {
            await pool.query('UPDATE "order" SET order_status = $1 WHERE id = $2', ['DONE', newOrder.id]);
            newOrder.order_status = 'DONE';
            addResponseTime(Date.now() - startTime);

            // CHAOS: Random 500 noise after success (every 11th request)
            if (orderRequestCount % 11 === 0) {
                console.log("CHAOS INJECTION: Order processed successfully, but returning 500 noise.");
                return res.status(500).json({ error: "Simulated Internal Server Error (Noise)" });
            }

            res.status(201).json({
                order: newOrder,
                inventory_status: 'SUCCESS',
                message: inventoryMessage
            });
        } else {
            // Update order to FAILED to prevent "ghost" pending orders
            await pool.query('UPDATE "order" SET order_status = $1 WHERE id = $2', ['FAILED', newOrder.id]);
            newOrder.order_status = 'FAILED';
            
            addResponseTime(Date.now() - startTime);
            return res.status(503).json({
                order: newOrder,
                inventory_status: 'FAILED',
                error: lastError ? lastError.message : 'Inventory Service Unreachable'
            });
        }

    } catch (error) {
        addResponseTime(Date.now() - startTime);
        await client.query('ROLLBACK');
        console.error("Error creating order:", error);

        if (error.code === '23503') { // foreign key violation
            return res.status(400).json({ error: "Invalid product_id. Product does not exist." });
        }

        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
};
