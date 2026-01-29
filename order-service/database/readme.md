# Order Service Database

This directory manages the PostgreSQL database schema for the **Order Service**.

## Schema Overview

The order service handles product definitions and order records.

### Tables

1.  **`product`**
    *   `id` (SERIAL, PK): Auto-incrementing unique identifier for products.
    *   `name` (VARCHAR): Human-readable name of the product.

2.  **`order`** (Quoted as `"order"` in queries due to SQL keywords)
    *   `id` (SERIAL, PK): Auto-incrementing unique identifier for orders.
    *   `product_id` (INTEGER, FK): Reference to the `product` table.
    *   `quantity` (INTEGER): Number of items requested.
    *   `user_id` (INTEGER): ID of the user placing the order.
    *   `order_status` (VARCHAR): Status tracking. Values include:
        -   `PENDING`: Order received, awaiting inventory authentication.
        -   `DONE`: Inventory confirmed and deducted.
        -   `FAILED`: Insufficient stock or other errors.

## Migrations

-   `001_create_tables.sql`: Sets up the `product` and `order` tables.

## Seeds

-   `seed_data.sql`: Populates the `product` table with initial items (e.g., Apple, Banana, Orange).
