-- Seed Products
INSERT INTO product (name) VALUES 
('Laptop'),
('Smartphone'),
('Headphones'),
('Monitor'),
('Keyboard');

-- Seed Inventory
INSERT INTO inventory (product_id, quantity) VALUES 
(1, 100),
(2, 50),
(3, 200),
(4, 75),
(5, 150);

-- Seed Orders
INSERT INTO "order" (product_id, quantity, user_id) VALUES 
(1, 1, 101),
(2, 2, 102),
(3, 1, 103),
(4, 1, 104),
(5, 1, 105);
