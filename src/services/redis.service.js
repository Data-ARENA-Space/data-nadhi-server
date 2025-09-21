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

    this.client = createClient({ url });
    this.connected = false;

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', { error: err });
      this.client = null;
      this.connected = false;
    });

    RedisService.instance = this;
  }

  async connect() {
    if (!this.client) return;
    try {
      await this.client.connect();
      this.connected = true;
      logger.info('Connected to Redis');
    } catch (err) {
      logger.error('Redis connection failed:', { error: err });
      this.client = null;
      this.connected = false;
    }
  }

  async set(key, value, ttlSeconds = null) {
    if (!this.client || !this.connected) return;
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) await this.client.setEx(key, ttlSeconds, val);
    else await this.client.set(key, val);
  }

  async get(key) {
    if (!this.client || !this.connected) return null;
    const val = await this.client.get(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  }

  async del(key) {
    if (!this.client || !this.connected) return;
    await this.client.del(key);
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
