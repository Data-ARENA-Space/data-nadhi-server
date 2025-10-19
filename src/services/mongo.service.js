const { MongoClient } = require('mongodb');
const { MONGO_URL } = process.env;
const Logger = require('../utils/logger.util');
const logger = new Logger({ level: "debug" });

class MongoService {
  static instance;

  constructor() {
    if (MongoService.instance) return MongoService.instance;

    if (!MONGO_URL) throw new Error('Missing MONGO_URL');
    
    // MongoDB client with connection pooling and retry options
    this.client = new MongoClient(MONGO_URL, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true
    });

    // Add connection event handlers - only log problems
    this.client.on('serverHeartbeatFailed', () => {
      logger.warn('MongoDB heartbeat failed - connection may be lost');
    });

    this.client.on('close', () => {
      logger.warn('MongoDB connection closed');
    });

    MongoService.instance = this;
  }

  async connect(maxRetries = 5) {
    await this.connectWithRetry(maxRetries);
  }

  async connectWithRetry(maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.client.connect();
        logger.info('Connected to MongoDB');
        return;
      } catch (err) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 30000); // Max 30s delay
        logger.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, { error: err.message });
        
        if (attempt === maxRetries) {
          logger.error('All MongoDB connection attempts failed');
          throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${err.message}`);
        }
        
        logger.info(`Retrying MongoDB connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  db() {
    return this.client.db(); // default DB, or pass DB name optionally
  }

  // Wrapper for database operations with retry logic
  async withRetry(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        // Check if it's a connection-related error
        const isConnectionError = err.name === 'MongoNetworkError' || 
                                 err.name === 'MongoServerSelectionError' ||
                                 err.message.includes('connection') ||
                                 err.message.includes('timeout');
        
        if (!isConnectionError || attempt === maxRetries) {
          throw err; // Re-throw if not connection error or final attempt
        }
        
        const delay = Math.min(Math.pow(2, attempt) * 500, 5000); // Max 5s delay
        logger.warn(`MongoDB operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, { error: err.message });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async disconnect() {
    await this.client.close();
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = MongoService;
