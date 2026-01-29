import amqp from 'amqplib';

let channel = null;
let connection = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://appuser:apppass@rabbitmq:5672';
const EXCHANGE_NAME = 'order_exchange';

export const connectRabbitMQ = async () => {
    try {
        console.log(`Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log(`Connected to RabbitMQ`);
        console.log(`Exchange '${EXCHANGE_NAME}' asserted`);
        
        // handling connection close/error to reconnect?
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

export const getChannel = () => channel;

export const publishOrder = async (order) => {
    if (!channel) {
        console.error("RabbitMQ channel not available. Message not sent.");
        throw new Error("RabbitMQ channel not available");
    }

    const routingKey = 'order.created';
    const message = JSON.stringify(order);
    
    try {
        const result = channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(message), {
            persistent: true
        });
        
        if (result) {
            console.log(`[x] Sent order ${order.id} to '${EXCHANGE_NAME}' with key '${routingKey}'`);
        } else {
            console.error('Buffer full, message could not be sent immediately');
        }
    } catch (err) {
        console.error("Error publishing message:", err);
    }
};
