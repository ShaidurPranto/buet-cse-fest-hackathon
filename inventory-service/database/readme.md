# Inventory Service Database

This directory manages the PostgreSQL database schema for the **Inventory Service**.

## Schema Overview

The inventory relies on a simple schema to track stock levels for products.

### Tables

1.  **`inventory`**
    *   `product_id` (INTEGER, PK): Unique identifier for the product. Corresponds to the product ID in the Order Service.
    *   `quantity` (INTEGER): The current available stock for the product.

## Migrations

We use SQL-based migrations to manage database changes.
-   `001_create_tables.sql`: Initial setup of the inventory table.

## Seeds

-   `seed_data.sql`: Populates the inventory with initial stock for testing.
