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
  await mongo.connect();
  await redis.connect();
  app.listen(PORT, () => logger.info("Server started", { port: PORT }));
}

init().catch(err => {
  logger.error('Init failed', { error: err });
  process.exit(1);
});
