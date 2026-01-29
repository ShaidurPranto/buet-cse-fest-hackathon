import pool from '../config/db.js';
// import { publishOrder } from '../config/rabbitmq.js';

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
    const { product_id, quantity, user_id } = req.body;

    // basic validation
    if (!product_id || !quantity || !user_id) {
        return res.status(400).json({ error: "Missing required fields: product_id, quantity, user_id" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // foreign key constraint will handle non-existent product_id
        const insertQuery = `
            INSERT INTO "order" (product_id, quantity, user_id)
            VALUES ($1, $2, $3)
            RETURNING id, product_id, quantity, user_id
        `;
        const result = await client.query(insertQuery, [product_id, quantity, user_id]);
        const newOrder = result.rows[0];

        await client.query('COMMIT');
        
        console.log(`Order ${newOrder.id} created successfully.`);

        // syncing http communication with inventory service
        try {
            // using AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout as per spec 

            const inventoryResponse = await fetch('http://inventory-service:3001/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: newOrder.product_id,
                    quantity: newOrder.quantity
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!inventoryResponse.ok) {
                const errorData = await inventoryResponse.json();
                console.error(`Inventory update failed for Order ${newOrder.id}:`, errorData);
                 return res.status(inventoryResponse.status).json({ 
                    order: newOrder, 
                    inventory_status: 'FAILED', 
                    error: errorData.error || 'Inventory Update Failed' 
                });
            }

            const inventoryData = await inventoryResponse.json();
             res.status(201).json({ 
                order: newOrder, 
                inventory_status: 'SUCCESS',
                message: inventoryData.message 
            });

        } catch (error) {
            console.error("Error communicating with Inventory Service:", error);
            if (error.name === 'AbortError') {
                 return res.status(503).json({ 
                    order: newOrder, 
                    inventory_status: 'TIMEOUT', 
                    error: 'Inventory Service did not respond in time' 
                });
            }
             return res.status(503).json({ 
                order: newOrder, 
                inventory_status: 'ERROR', 
                error: 'Could not contact Inventory Service' 
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
