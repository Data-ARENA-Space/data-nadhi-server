const { MongoClient } = require('mongodb');
const { MONGO_URL } = process.env;
const Logger = require('../utils/logger.util');
const logger = new Logger({ level: "debug" });

class MongoService {
  static instance;

  constructor() {
    if (MongoService.instance) return MongoService.instance;

    if (!MONGO_URL) throw new Error('Missing MONGO_URL');
    this.client = new MongoClient(MONGO_URL);

    MongoService.instance = this;
  }

  async connect() {
    await this.client.connect();
    logger.info('Connected to MongoDB');
  }

  db() {
    return this.client.db(); // default DB, or pass DB name optionally
  }

  async disconnect() {
    await this.client.close();
    logger.info('Disconnected from MongoDB');
  }
}

module.exports = MongoService;
