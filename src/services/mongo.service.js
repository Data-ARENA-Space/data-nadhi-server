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

  async connect() {
    // Single connect attempt
    await this.client.connect();
    logger.info('Connected to MongoDB');
  }

  async ensureHealthy() {
    // Ping once; on failure, try one reconnect then throw if still failing
    try {
      await this.db().admin().ping();
      return true;
    } catch (_err) {
      try {
        await this.client.close().catch(() => {});
        await this.client.connect();
        await this.db().admin().ping();
        logger.info('MongoDB reconnected after ping failure');
        return true;
      } catch (err) {
        // Propagate error without retries
        throw err;
      }
    }
  }

  db() {
    return this.client.db(); // default DB, or pass DB name optionally
  }

  // Access wrapper: ping once on access, try a single reconnect on ping failure, then run op
  async withRetry(operation) {
    await this.ensureHealthy();
    return await operation();
  }

  async disconnect() {
    await this.client.close();
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = MongoService;
