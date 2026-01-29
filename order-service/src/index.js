import 'dotenv/config';
import app from './app.js';
import { bootstrapDatabase } from './database/bootstrap.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    console.log('Starting Order Service...');

    await bootstrapDatabase();
    // await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();
