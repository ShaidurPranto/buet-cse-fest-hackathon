# Order Service

The **Order Service** is the entry point for placing orders in the system. It handles incoming requests, validates them, and communicates with the Inventory Service asynchronously via RabbitMQ to process stock.

## 🚀 Key Features
*   **Create Order**: REST API to accept user orders.
*   **Product Management**: Maintains a list of available products.
*   **Event Driven**: Publishes `order.created` events to RabbitMQ when a new order is received.
*   **Status Management**: Updates order status (PENDING, DONE, FAILED) based on availability.

## 🛠 Tech Stack
*   **Language**: Node.js (ES Modules)
*   **Framework**: Express.js
*   **Database**: PostgreSQL (NeonDB)
*   **Message Broker**: RabbitMQ (`amqplib`)

## 🔧 Configuration
The service relies on the following environment variables (defined in `.env`):
-   `PORT`: Service port (default: 3000)
-   `DATABASE_URL`: Postgres connection string
-   `RABBITMQ_URL`: RabbitMQ connection string

## 📡 API Endpoints
*   `GET /health`: Health check.
*   `POST /orders`: Place a new order.
    *   Body: `{ "product_id": 1, "user_id": 1, "quantity": 5 }`

## 📦 Docker & Kubernetes
Includes a `Dockerfile` for containerization and is deployable via the manifests in the `k8s/` directory.
