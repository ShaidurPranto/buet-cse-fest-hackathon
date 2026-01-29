import pool from '../config/db.js';

export const updateInventory = async (productId, quantity) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
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
