import amqp from 'amqplib';
import { randomUUID } from 'crypto';

let connection;
let channel;
let replyQueue;
const REQUEST_QUEUE = 'inventory.requests';

// ID -> { resolve, reject, timeout }
const pendingRequests = new Map();

export const connectRabbitMQ = async () => {
    try {
        const amqpUrl = process.env.RABBITMQ_URL || 'amqp://appuser:apppass@rabbitmq:5672';
        connection = await amqp.connect(amqpUrl);
        channel = await connection.createChannel();

        // Assert request queue to make sure it exists
        await channel.assertQueue(REQUEST_QUEUE, { durable: true });

        // Assert anonymous exclusive reply queue
        const q = await channel.assertQueue('', { exclusive: true });
        replyQueue = q.queue;
        console.log(`Connected to RabbitMQ. Reply Queue: ${replyQueue}`);

        // Consumer for replies
        channel.consume(replyQueue, (msg) => {
            if (!msg) return;
            const correlationId = msg.properties.correlationId;
            const request = pendingRequests.get(correlationId);

            if (request) {
                const response = JSON.parse(msg.content.toString());
                request.resolve(response);
                clearTimeout(request.timeout);
                pendingRequests.delete(correlationId);
            } else {
                console.warn(`Received response for unknown correlationId: ${correlationId}`);
            }
        }, { noAck: true });

        return channel;
    } catch (error) {
        console.error("Failed to connect to RabbitMQ in Order Service:", error);
    }
};

export const sendInventoryRequest = (payload) => {
    return new Promise((resolve, reject) => {
        if (!channel || !replyQueue) {
            return reject(new Error("RabbitMQ channel not ready"));
        }

        const correlationId = randomUUID();
        const timeoutMs = 5000; // 2s timeout (reduced to handle Gremlin Latency/Vanishing Response)

        const timeout = setTimeout(() => {
            if (pendingRequests.has(correlationId)) {
                pendingRequests.delete(correlationId);
                reject(new Error("Inventory Service request timed out"));
            }
        }, timeoutMs);

        pendingRequests.set(correlationId, { resolve, reject, timeout });

        // Send request
        channel.sendToQueue(
            REQUEST_QUEUE,
            Buffer.from(JSON.stringify(payload)),
            { 
                correlationId: correlationId, 
                replyTo: replyQueue 
            }
        );
        
        console.log(`[RabbitMQ] Sent request ${correlationId} to ${REQUEST_QUEUE}`);
    });
};
