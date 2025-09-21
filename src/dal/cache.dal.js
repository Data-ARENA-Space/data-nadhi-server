let redis = null;

const setRedisService = (redisService) => {
  redis = redisService;
}

const getApiKey = async (apiKey) => {
  if (!redis || !redis.connected) return null;
  return await redis.get(`datanadhiserver:apikey:${apiKey}`);
}

const setApiKey = async (apiKey, data, ttl) => {
  if (!redis || !redis.connected) return;
  await redis.set(`datanadhiserver:apikey:${apiKey}`, data, ttl);
}

const getOrganisationSecret = async (orgId) => {
  if (!redis || !redis.connected) return null;
  return await redis.get(`datanadhiserver:orgid:${orgId}`);
}

const setOrganisationSecret = async (orgId, secret, ttl) => {
  if (!redis || !redis.connected) return;
  await redis.set(`datanadhiserver:orgid:${orgId}`, secret, ttl);
}

const getProjectSecret = async (projectId) => {
  if (!redis || !redis.connected) return null;
  return await redis.get(`datanadhiserver:projectid:${projectId}`);
}

const setProjectSecret = async (projectId, secret, ttl) => {
  if (!redis || !redis.connected) return;
  await redis.set(`datanadhiserver:projectid:${projectId}`, secret, ttl);
}

module.exports = {
  setRedisService,
  getApiKey,
  setApiKey,
  getOrganisationSecret,
  setOrganisationSecret,
  getProjectSecret,
  setProjectSecret
};
