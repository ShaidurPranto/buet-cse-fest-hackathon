import amqp from 'amqplib';

let connection;
let channel;
const QUEUE_NAME = 'inventory.requests';

export const connectRabbitMQ = async () => {
    try {
        const amqpUrl = process.env.RABBITMQ_URL || 'amqp://appuser:apppass@rabbitmq:5672';
        connection = await amqp.connect(amqpUrl);
        channel = await connection.createChannel();
        
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        // Prefetch 1 to ensure one-by-one processing (good for simulation)
        await channel.prefetch(1); 
        
        console.log(`Connected to RabbitMQ`);
        return channel;
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
    }
};

export const startInventoryConsumer = (updateInventoryLogic) => {
    if (!channel) {
        console.error("RabbitMQ channel not established, cannot start consumer");
        return;
    }

    console.log(`Waiting for messages in ${QUEUE_NAME}...`);
    
    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        const content = JSON.parse(msg.content.toString());
        const { product_id, quantity, idempotencyKey } = content;
        const { replyTo, correlationId } = msg.properties;

        console.log(`[RabbitMQ] Received inventory request:`, content);

        try {
             // Pass logic to process the request
             const result = await updateInventoryLogic({ product_id, quantity, idempotencyKey });
            
            const response = {
                 ...result,
                 status: result.success ? 200 : (result.message === 'Product not found' ? 404 : 409)
            };

            // Send response to temporary reply queue using the default exchange (empty string)
            if (replyTo) {
                channel.sendToQueue(
                    replyTo,
                    Buffer.from(JSON.stringify(response)),
                    { correlationId: correlationId }
                );
            }

            // Acknowledge the request
            channel.ack(msg);

        } catch (error) {
            console.error("Error processing RabbitMQ message:", error);
             channel.ack(msg);
        }
    });
};
