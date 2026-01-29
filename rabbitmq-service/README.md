# RabbitMQ Service

This service runs a RabbitMQ message broker with the Management Plugin enabled.

## Prerequisities

- Docker
- Docker Compose

## Running the Service

To start the RabbitMQ service, run the following command in this directory:

```bash
docker-compose up -d
```

## Accessing the Management Interface

Once the service is running, you can access the RabbitMQ Management Interface at:

http://localhost:15672

- **Username:** guest
- **Password:** guest

The AMQP port is `5672`.
