// Consolidated API Service for future integration
export const INVENTORY_API_URL = 'http://localhost:3001/api';
export const ORDER_API_URL = 'http://localhost:3000/api';

// Product API
export const fetchProducts = async () => {
    try {
        const res = await fetch(`${ORDER_API_URL}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Order API
export const fetchOrders = async () => {
    try {
        const res = await fetch(`${ORDER_API_URL}/orders`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const createOrder = async (product_id, quantity, user_id) => {
    try {
        const res = await fetch(`${ORDER_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id, quantity, user_id }),
        });
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const fetchInventory = async () => {
    try {
        const res = await fetch(`${INVENTORY_API_URL}/inventory`);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

export const updateInventory = async (product_id, quantity) => {
    try {
        const res = await fetch(`${INVENTORY_API_URL}/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id, quantity }),
        });
        if (!res.ok) throw new Error('Failed to update inventory');
        return res.json();
    } catch (error) {
        console.error('Error updating inventory:', error);
        throw error;
    }
};
