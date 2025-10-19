require('dotenv').config();
const app = require('./app');
const MongoService = require('./services/mongo.service');
const RedisService = require('./services/redis.service');
const cacheDal = require('./dal/cache.dal');
const Logger = require('./utils/logger.util'); 
const logger = new Logger({ level: "debug" });

const { PORT = 3000, REDIS_URL } = process.env;

const mongo = new MongoService();  // singleton instance
const redis = new RedisService(REDIS_URL);
cacheDal.setRedisService(redis);

async function init() {
  try {
    // Try to connect to MongoDB with retries
    logger.info('Connecting to MongoDB...');
    await mongo.connect();
    
    // Try to connect to Redis with retries
    logger.info('Connecting to Redis...');
    await redis.connect();
    
    // Start the server
    app.listen(PORT, () => logger.info("Server started", { port: PORT }));
    
  } catch (err) {
    logger.error('Failed to initialize server:', { error: err.message });
    
    // Graceful shutdown on startup failure
    await gracefulShutdown();
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await mongo.disconnect();
    await redis.disconnect();
  } catch (err) {
    logger.error('Error during shutdown:', { error: err.message });
  }
}

// Handle graceful shutdown on SIGINT and SIGTERM
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

// Start the application
init().catch(err => {
  logger.error('Unexpected error during initialization:', { error: err });
  process.exit(1);
});
