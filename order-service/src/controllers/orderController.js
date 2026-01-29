import pool from '../config/db.js';
import { publishOrder } from '../config/rabbitmq.js';

export const getOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "order"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching orders:", error);
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

        // publishing event to RabbitMQ
        await publishOrder(newOrder);

        res.status(201).json(newOrder);

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
