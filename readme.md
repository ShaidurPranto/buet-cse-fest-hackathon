# Railway Ticketing & Inventory System (Mock Hackathon Project)

Welcome to the **BUET CSE Hackathon 2026** backend project! 🚀

This repository hosts a robust, event-driven microservices application designed to handle high-concurrency order processing, simulating a simplified ticketing or e-commerce inventory system.

## 🏗 System Architecture

We've built this system using a **Microservices Architecture** to ensure scalability and separation of concerns.

### The Services
1.  **Frontend (React + Vite)**: A dashboard for users to place orders and admins to monitor inventory and system health.
2.  **Order Service**: The gatekeeper. It accepts order requests, saves them to the database with a "PENDING" status, and publishes an event to the message broker.
3.  **Inventory Service**: The worker. It consumes order events, checks stock availability in its own database, and processes the inventory deduction.
4.  **RabbitMQ**: The messenger. This message broker decouples the Order and Inventory services, ensuring that the heavy lifting of inventory processing doesn't block the user from placing an order.

### Data Flow
1.  User clicks "Buy" on the Frontend.
2.  **Frontend** $\rightarrow$ sends POST request to **Order Service**.
3.  **Order Service** creates a record in Postgres (Status: `PENDING`) $\rightarrow$ sends message to **RabbitMQ**.
4.  **Inventory Service** picks up the message $\rightarrow$ checks stock in Postgres.
    *   If Stock > Order: Decrements stock.
    *   If Stock < Order: Marks as failed (logic handled in consumer).

## 🛠 Technology Stack

*   **Frontend**: React, Vite, Lucide React (Icons).
*   **Backend Runtime**: Node.js (ES Modules).
*   **Framework**: Express.js.
*   **Databases**: PostgreSQL (Hosted on **NeonDB** for serverless scaling).
*   **Message Broker**: RabbitMQ.
*   **Containerization**: Docker & Docker Compose.
*   **Orchestration**: Kubernetes (K8s) manifests included.

## 🚀 How to Run

You have two ways to fly: interacting with Docker Compose locally, or deploying to a Kubernetes cluster.

### A. Docker Compose (Local Development)

This is the easiest way to spin up the entire stack on your machine.

1.  **Clone & Configure**:
    Ensure you have your `.env` files set up in `order-service/` and `inventory-service/` with valid `DATABASE_URL` credentials (NeonDB).

2.  **Spin Up**:
    ```bash
    docker-compose up --build
    ```

3.  **Access**:
    *   **Frontend**: `http://localhost:5173` (Check terminal for exact Vite port)
    *   **Order Service**: `http://localhost:3000`
    *   **Inventory Service**: `http://localhost:3001`
    *   **RabbitMQ Management**: `http://localhost:15672` (User: `appuser`, Pass: `apppass`)

### B. Kubernetes (Cloud/Production)

Ready for the big leagues? Use our K8s manifests.

1.  **Apply Configuration**:
    We have a unified manifest that sets up Secrets, Deployments, and Services.
    *   *Note: Edit `k8s/combined.yaml` to include your real `DATABASE_URL` secret before applying.*

    ```bash
    kubectl apply -f k8s/combined.yaml
    ```

2.  **Scale**:
    Need to handle more orders?
    ```bash
    kubectl scale deployment order-service --replicas=5
    ```

## 📂 Project Structure

*   `frontend/`: The React UI application.
*   `order-service/`: Node.js service for order management.
*   `inventory-service/`: Node.js service for stock management.
*   `rabbitmq-service/`: Configuration and definitions for the broker.
*   `k8s/`: Kubernetes deployment YAML files.
*   `scripts/`: Utility scripts for deployment/testing.

## 🧪 Testing

We have included a load test script to simulate simplified traffic.
```bash
k6 run load_test.js
```

---
*Built with ❤️ for the BUET CSE Fest Hackathon 2026.*
