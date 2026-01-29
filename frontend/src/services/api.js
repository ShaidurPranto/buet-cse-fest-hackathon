// Consolidated API Service for future integration
export const API_URL = 'http://localhost:3001/api';

export const fetchOrders = async () => {
    // const res = await fetch(`${API_URL}/orders`);
    // return res.json();
};

export const fetchInventory = async () => {
    try {
        const res = await fetch(`${API_URL}/inventory`);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

export const updateInventory = async (product_id, quantity) => {
    try {
        const res = await fetch(`${API_URL}/inventory`, {
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
