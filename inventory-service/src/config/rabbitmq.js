import amqp from 'amqplib';
import { updateInventory } from '../controllers/inventoryController.js';

let channel = null;
let connection = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://appuser:apppass@rabbitmq:5672';
const INVENTORY_QUEUE = 'inventory_queue';
const RESPONSE_EXCHANGE = 'inventory_exchange';
const RESPONSE_ROUTING_KEY = 'inventory.response';

export const connectRabbitMQ = async () => {
    try {
        console.log(`Inventory Service connecting to RabbitMQ at ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        
        await channel.assertQueue(INVENTORY_QUEUE, { durable: true });
        await channel.assertExchange(RESPONSE_EXCHANGE, 'direct', { durable: true });

        console.log(`Connected to RabbitMQ`);
        
        // Start Consuming
        consumeInventoryQueue();

        connection.on('close', () => {
            console.error('RabbitMQ connection closed, retrying...');
            setTimeout(connectRabbitMQ, 5000);
        });

    } catch (error) {
        console.error("RabbitMQ Connection Error:", error);
        console.log("Retrying RabbitMQ connection in 5 seconds...");
        setTimeout(connectRabbitMQ, 5000);
    }
};

const consumeInventoryQueue = () => {
    if (!channel) return;

    console.log(`Waiting for messages in ${INVENTORY_QUEUE}...`);
    
    channel.consume(INVENTORY_QUEUE, async (msg) => {
        if (msg !== null) {
            try {
                const orderData = JSON.parse(msg.content.toString());
                console.log("Received order:", orderData);

                const { id: orderId, product_id, quantity } = orderData;
                
                // Process Inventory Update
                const result = await updateInventory(product_id, quantity);
                
                // Publish Response
                const response = {
                    order_id: orderId,
                    status: result.success ? 'SUCCESS' : 'FAILURE',
                    message: result.message
                };

                channel.publish(RESPONSE_EXCHANGE, RESPONSE_ROUTING_KEY, Buffer.from(JSON.stringify(response)));
                console.log("Sent response:", response);

                channel.ack(msg);
            } catch (err) {
                console.error("Error processing message:", err);
                channel.nack(msg, false, false); // or recurse/dlq depending on strategy
            }
        }
    });
};
