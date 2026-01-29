export const getOrders = (req, res) => {
    res.json({ message: "Order service is running (dummy)" });
};

export const createOrder = (req, res) => {
    res.json({ message: "Order created (dummy)", order: req.body });
};
