# Railway Ticketing Microservices System

A microservices-based railway ticketing system built with Node.js, Express, and PostgreSQL. The system is designed to be deployed on Kubernetes and uses Docker for containerization.

## Architecture

The system consists of the following microservices:

1.  **Auth Service**: Handles user registration, login, and JWT token management.
2.  **Train Service**: Manages train schedules, stations, and fare information.
3.  **Booking Service**: Handles ticket booking, seat reservation with concurrency control (locking), and inventory management.
4.  **Database**: A shared PostgreSQL database (sharded logically) or single instance used by all services (as per requirements).

## Prerequisites

-   Docker & Docker Compose
-   Kubernetes (Minikube or any cluster)
-   Node.js v18+ (for local developement)
-   kubectl

## Project Structure

```
repo-root/
├── services/
│   ├── auth-service/     # Authentication microservice
│   ├── booking-service/  # Booking microservice
│   └── train-service/    # Train catalog microservice
├── database/
│   ├── migrations/       # SQL for creating tables
│   └── seeds/            # SQL for initial data
├── k8s/                  # Kubernetes manifests
├── scripts/              # Helper scripts
│   ├── build-all.sh      # Build all docker images
│   └── deploy-all.sh     # Deploy to K8s
├── docker-compose.yml    # Local orchestration
└── nginx.conf            # Nginx config for local gateway
```

## Running Locally (Docker Compose)

1.  Build and start all services:
    ```bash
    docker-compose up --build
    ```
2.  The API behaves as if behind a gateway:
    -   Auth: `http://localhost:8080/auth`
    -   Booking: `http://localhost:8080/bookings`
    -   Train: `http://localhost:8080/api/schedules`

## Running on Kubernetes

1.  Build Docker images (ensure they are available to your cluster, e.g., minikube docker-env or push to registry):
    ```bash
    ./scripts/build-all.sh
    ```
2.  Deploy to Kubernetes:
    ```bash
    ./scripts/deploy-all.sh
    ```
3.  Enable Ingress (if using Minikube):
    ```bash
    minikube addons enable ingress
    ```

## Testing

Each service has its own test suite using Jest.

```bash
# Auth Service
cd services/auth-service
npm install
npm test

# Booking Service
cd services/booking-service
npm install
npm test

# Train Service
cd services/train-service
npm install
npm test
```

## CI/CD

GitHub Actions workflows are defined in `.github/workflows/` for each service. They automatically:
1.  Run tests on Push/PR to `main`.
2.  Build and Push Docker images to Docker Hub (on `main`).

## API Endpoints

### Auth Service
-   `POST /auth/register`: Register new user
-   `POST /auth/login`: Login user (returns access & refresh tokens)

### Train Service
-   `GET /api/schedules/schedules?from=Dhaka&to=Chittagong`: Search trains

### Booking Service
-   `POST /bookings/initialize-trip`: Initialize seats for a trip (Admin)
-   `POST /bookings/select-seat`: Lock a seat (Concurrency safe)
-   `POST /bookings`: Book a ticket

