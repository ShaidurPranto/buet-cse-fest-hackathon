# Inventory Service

The **Inventory Service** manages stock levels for products. It acts as a consumer in our event-driven architecture, listening for order events and updating stock accordingly.

## 🚀 Key Features
*   **Stock Management**: Tracks quantity for each product ID.
*   **Event Consumer**: Listens to `order.created` events from RabbitMQ.
*   **Concurrency Handling**: Ensures atomic updates to inventory to prevent race conditions during high loads (handled via database transactions).
*   **Compensating Actions**: If stock is sufficient, it deducts the amount; if not, it signals an order failure (conceptually).

## 🛠 Tech Stack
*   **Language**: Node.js
*   **Framework**: Express.js (for health checks and basic APIs)
*   **Database**: PostgreSQL (NeonDB)
*   **Message Broker**: RabbitMQ (`amqplib`)

## 🔧 Configuration
-   `PORT`: Service port (default: 3001)
-   `DATABASE_URL`: Postgres connection string
-   `RABBITMQ_URL`: RabbitMQ connection string

## 🔄 Workflow
1.  Connects to RabbitMQ on startup.
2.  Subscribes to the `inventory_queue`.
3.  When an order message arrives:
    *   Checks database for sufficient stock.
    *   If available -> Descrements stock.
    *   If unavailable -> Logs insufficient funds (future: publish `order.failed` event).

## 📦 Docker & Kubernetes
Run as a containerized microservice. See root `docker-compose.yml` or `k8s/` for deployment details.
