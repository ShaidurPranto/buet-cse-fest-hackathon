## Project Structure

## Project Structure

```
repo-root/
├── inventory-service/    # Inventory management microservice
│   ├── src/
│   │   ├── app.js                # Express app setup
│   │   ├── index.js              # Entry point
│   │   ├── config/
│   │   │   └── db.js             # Database configuration
│   │   ├── controllers/
│   │   │   └── inventoryController.js
│   │   ├── routes/
│   │   │   └── inventoryRoutes.js
│   │   └── database/
│   │       └── bootstrap.js      # Database initialization
│   ├── database/
│   │   ├── migrations/           # SQL for creating tables
│   │   └── seeds/                # SQL for initial data
│   ├── tests/
│   ├── package.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── order-service/        # Order management microservice
│   ├── src/
│   │   ├── app.js                # Express app setup
│   │   ├── index.js              # Entry point
│   │   ├── config/
│   │   │   ├── db.js             # Database configuration
│   │   │   └── rabbitmq.js       # RabbitMQ configuration
│   │   ├── controllers/
│   │   │   └── orderController.js
│   │   ├── routes/
│   │   │   └── orderRoutes.js
│   │   └── database/
│   │       └── bootstrap.js      # Database initialization
│   ├── database/
│   │   ├── migrations/           # SQL for creating tables
│   │   └── seeds/                # SQL for initial data
│   ├── tests/
│   ├── package.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── rabbitmq-service/     # RabbitMQ message broker service
│   ├── definitions.json  # RabbitMQ configuration
│   ├── rabbitmq.conf     # RabbitMQ config file
│   ├── README.md
│   └── docker-compose.yml
├── k8s/                  # Kubernetes manifests
├── scripts/              # Helper scripts
├── spec/                 # Project specifications
│   ├── spec.txt          # Specification file
│   └── Final-Round-Question-M_D.pdf
├── docker-compose.yml    # Local orchestration for all services
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore rules
└── readme.md             # This file
```

## Services Overview

### Inventory Service
Manages inventory items and stock levels. Provides API endpoints for:
- GET `/api/inventory` - Retrieve inventory items
- POST `/api/inventory` - Update inventory

### Order Service
Handles order processing and management. Provides API endpoints for:
- GET `/api/orders` - Retrieve orders
- POST `/api/orders` - Create new orders

Integrates with RabbitMQ for asynchronous messaging.

### RabbitMQ Service
Message broker for inter-service communication and async task processing.