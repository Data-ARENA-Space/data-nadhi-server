// redis.service.js
const { createClient } = require('redis');
const Logger = require('../utils/logger.util');
const logger = new Logger({ level: "debug" });

class RedisService {
  static instance;

  constructor(url) {
    if (RedisService.instance) {
      return RedisService.instance;
    }

    if (!url) {
      this.client = null;
      this.connected = false;
      return;
    }

    this.client = createClient({ 
      url,
      socket: {
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 50, 5000); // Max 5s delay
          // Only log after several failed attempts to reduce noise
          if (retries > 3) {
            logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          }
          return delay;
        }
      }
    });
    this.connected = false;

    // Enhanced event handlers - only log problems and recovery
    this.client.on('error', (err) => {
      logger.error('Redis connection error:', { error: err.message });
      this.connected = false;
    });

    this.client.on('ready', () => {
      // Only log when recovering from a previous failure
      if (!this.connected) {
        logger.info('Redis connection restored');
      }
      this.connected = true;
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
      this.connected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.connected = false;
    });

    RedisService.instance = this;
  }

  async connect(maxRetries = 5) {
    if (!this.client) return;
    await this.connectWithRetry(maxRetries);
  }

  async connectWithRetry(maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.client.connect();
        this.connected = true;
        logger.info('Connected to Redis');
        return;
      } catch (err) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 30000); // Max 30s delay
        logger.error(`Redis connection attempt ${attempt}/${maxRetries} failed:`, { error: err.message });
        
        if (attempt === maxRetries) {
          logger.error('All Redis connection attempts failed');
          this.client = null;
          this.connected = false;
          throw new Error(`Failed to connect to Redis after ${maxRetries} attempts: ${err.message}`);
        }
        
        logger.info(`Retrying Redis connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async set(key, value, ttlSeconds = null) {
    return await this.withRetry(async () => {
      if (!this.client) throw new Error('Redis client not available');
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) await this.client.setEx(key, ttlSeconds, val);
      else await this.client.set(key, val);
    });
  }

  async get(key) {
    return await this.withRetry(async () => {
      if (!this.client) return null;
      const val = await this.client.get(key);
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    });
  }

  async del(key) {
    return await this.withRetry(async () => {
      if (!this.client) return;
      await this.client.del(key);
    });
  }

  // Wrapper for Redis operations with retry logic
  async withRetry(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        // Check if it's a connection-related error
        const isConnectionError = err.code === 'ECONNREFUSED' ||
                                 err.code === 'ETIMEDOUT' ||
                                 err.message.includes('connection') ||
                                 err.message.includes('Socket closed unexpectedly') ||
                                 !this.connected;
        
        if (!isConnectionError || attempt === maxRetries) {
          // For non-connection errors or final attempt, return null for gets, throw for others
          if (err.message.includes('Redis client not available') && attempt === maxRetries) {
            return null; // Gracefully handle unavailable Redis for cache operations
          }
          throw err;
        }
        
        const delay = Math.min(Math.pow(2, attempt) * 500, 5000); // Max 5s delay
        logger.warn(`Redis operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, { error: err.message });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async disconnect() {
    if (!this.client || !this.connected) return;
    await this.client.disconnect();
    this.client = null;
    this.connected = false;
    logger.info('Redis disconnected');
  }
}

module.exports = RedisService;
