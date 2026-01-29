-- creating Product table
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- creating Order table
CREATE TABLE "order" (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES product(id),
    quantity INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_status VARCHAR(50)   -- PENDING, DONE, FAILED
);

-- creating Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES product(id),
    quantity INTEGER NOT NULL
);
