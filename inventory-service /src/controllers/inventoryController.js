export const getInventory = (req, res) => {
    res.json({ message: "Inventory service is running (dummy)", items: [] });
};

export const updateInventory = (req, res) => {
    res.json({ message: "Inventory updated (dummy)", update: req.body });
};
