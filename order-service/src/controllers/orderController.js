import pool from '../config/db.js';
// import { publishOrder } from '../config/rabbitmq.js';

let orderRequestCount = 0;

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
                // If PENDING, we fall through to retry the inventory step
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

        // syncing http communication with inventory service
        let inventorySuccess = false;
        let inventoryMessage = '';
        let lastError = null;

        for (let i = 0; i < 3; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                console.log(`Attempting inventory update for Order ${newOrder.id} (Attempt ${i + 1})`);
                
                const inventoryResponse = await fetch('http://inventory-service:3001/api/inventory', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Idempotency-Key': newOrder.id.toString()
                    },
                    body: JSON.stringify({
                        product_id: newOrder.product_id,
                        quantity: newOrder.quantity
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (inventoryResponse.ok) {
                    const inventoryData = await inventoryResponse.json();
                    inventorySuccess = true;
                    inventoryMessage = inventoryData.message;
                    break;
                } else {
                    let errorMsg = 'Inventory Error';
                    try {
                        const errorData = await inventoryResponse.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { /* ignore JSON parse error */ }

                    // Don't retry on client errors
                    if ([400, 404, 409].includes(inventoryResponse.status)) {
                        throw new Error(errorMsg || 'Inventory Client Error');
                    }
                    console.warn(`Inventory update failed (Attempt ${i + 1}): ${inventoryResponse.status}`);
                    lastError = new Error(errorMsg);
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
             // Update Order Status to DONE
             await pool.query('UPDATE "order" SET order_status = $1 WHERE id = $2', ['DONE', newOrder.id]);
             newOrder.order_status = 'DONE'; 

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
             return res.status(503).json({ 
                order: newOrder, 
                inventory_status: 'FAILED', 
                error: lastError ? lastError.message : 'Inventory Service Unreachable'
            });
        }

    } catch (error) {
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
