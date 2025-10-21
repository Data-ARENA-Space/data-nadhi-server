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

    this.url = url || null;
    this.client = null;
    this.connected = false;
    this._reconnecting = false;

    if (this.url) {
      this._initClient();
    }

    RedisService.instance = this;
  }

  _initClient() {
    this.client = createClient({ 
      url: this.url,
      socket: {
        // Disable automatic reconnect retries for Redis (cache is optional)
        reconnectStrategy: () => new Error('Redis reconnect disabled')
      }
    });
    this.connected = false;

    // Enhanced event handlers - only log problems and recovery
    this.client.on('error', (err) => {
      logger.error('Redis connection error:', { error: err.message });
      this.connected = false;
      // Single reconnection attempt, then leave caching disabled if it fails
      if (!this._reconnecting) {
        void this.tryReconnect(1);
      }
    });

    this.client.on('ready', () => {
      // Only log when recovering from a previous failure
      if (!this.connected) {
        logger.info('Redis connection restored');
      }
      this.connected = true;
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.connected = false;
      if (!this._reconnecting) {
        void this.tryReconnect(1);
      }
    });
  }

  async tryReconnect(maxAttempts = 1, delayMs = 1000) {
    if (!this.url) return false;
    if (this._reconnecting) return false;
    this._reconnecting = true;
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          this._initClient();
          await this.client.connect();
          this.connected = true;
          logger.info('Redis reconnected');
          return true;
        } catch (err) {
          this.connected = false;
          this.client = null;
          if (attempt === maxAttempts) {
            logger.warn('Redis reconnection failed, leaving caching disabled', { error: err.message });
            return false;
          }
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      return false;
    } finally {
      this._reconnecting = false;
    }
  }

  async connect() {
    if (!this.client && this.url) this._initClient();
    if (!this.client) return;
    try {
      await this.client.connect();
      this.connected = true;
      logger.info('Connected to Redis');
    } catch (err) {
      // Do not retry Redis - proceed without cache
      logger.warn('Redis connect failed, proceeding without cache', { error: err.message });
      this.client = null;
      this.connected = false;
    }
  }

  async set(key, value, ttlSeconds = null) {
    if (!this.client) return;
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) await this.client.setEx(key, ttlSeconds, val);
      else await this.client.set(key, val);
    } catch (err) {
      logger.warn('Redis set failed', { error: err.message });
    }
  }

  async get(key) {
    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    } catch (err) {
      logger.warn('Redis get failed', { error: err.message });
      return null;
    }
  }

  // Safe, silent cache operations (preferred for cache usage)
  async safe_get(key) {
    if (!this.client || !this.connected) {
      await this.tryReconnect(1);
    }
    if (!this.client || !this.connected) return null;
    try { await this.client.ping(); } catch (_e) { await this.tryReconnect(1); }
    if (!this.client || !this.connected) return null;
    try {
      const val = await this.client.get(key);
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    } catch (_err) {
      return null;
    }
  }

  async safe_set(key, value, ttlSeconds = null) {
    if (!this.client || !this.connected) {
      await this.tryReconnect(1);
    }
    if (!this.client || !this.connected) return;
    try { await this.client.ping(); } catch (_e) { await this.tryReconnect(1); }
    if (!this.client || !this.connected) return;
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) await this.client.setEx(key, ttlSeconds, val);
      else await this.client.set(key, val);
    } catch (_err) {
      // fail silently
    }
  }

  async del(key) {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      logger.warn('Redis del failed', { error: err.message });
    }
  }

  // No operation-level retries for Redis: cache should not block or retry

  async disconnect() {
    if (!this.client || !this.connected) return;
    await this.client.disconnect();
    this.client = null;
    this.connected = false;
    logger.info('Redis disconnected');
  }
}

module.exports = RedisService;
