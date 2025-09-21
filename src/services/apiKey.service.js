const { encryptAesGcm, decryptAesGcm } = require('./crypto.service');
const ProjectsDAL = require('../dal/projects.dal');
const CacheDAL = require('../dal/cache.dal');

const { SEC_DB, SEC_GLOBAL, NONCE_VALUE, API_KEY_CACHE_TTL_SECONDS, SECRET_CACHE_TTL_SECONDS } = process.env;

const getProjectSecret = async (projectId, orgId) => {
  let projectSecret = await CacheDAL.getProjectSecret(projectId);
  if (!projectSecret) {
    const proj = await ProjectsDAL.getProject(orgId, projectId);
    if (!proj) throw new Error('Project not found');
    projectSecret = decryptAesGcm(proj.projectSecretEncrypted, SEC_DB);
    await CacheDAL.setProjectSecret(projectId, projectSecret, SECRET_CACHE_TTL_SECONDS);
  }
  return projectSecret;
}

const getOrganisationSecret = async (orgId) => {
  let orgSecret = await CacheDAL.getOrganisationSecret(orgId);
  if (!orgSecret) {
    const org = await ProjectsDAL.getOrganisation(orgId);
    if (!org) throw new Error('Org not found');
    orgSecret = decryptAesGcm(org.organisationSecretEncrypted, SEC_DB);
    await CacheDAL.setOrganisationSecret(orgId, orgSecret, SECRET_CACHE_TTL_SECONDS);
  }
  return orgSecret;
}

const createApiKey = async (orgId, projectId) => {
  const proj = await ProjectsDAL.getProject(orgId, projectId);
  const org = await ProjectsDAL.getOrganisation(orgId);
  if (!proj || !org) throw new Error('Org or Project not found');

  const projectSecret = await getProjectSecret(projectId, orgId);
  const orgSecret = await getOrganisationSecret(orgId);

  const enc1 = encryptAesGcm(NONCE_VALUE, projectSecret);
  const enc2 = encryptAesGcm(`${enc1}|${projectId}`, orgSecret);
  const enc3 = encryptAesGcm(`${enc2}|${orgId}`, SEC_GLOBAL);

  return Buffer.from(enc3, 'utf8').toString('base64');
}

const validateApiKey = async (apiKey) => {
  // Check cache first
  const cached = await CacheDAL.getApiKey(apiKey);
  if (cached) return cached;

  let enc3 = Buffer.from(apiKey, 'base64').toString('utf8');
  const layer2 = decryptAesGcm(enc3, SEC_GLOBAL);
  const [enc2, orgId] = layer2.split('|');

  let orgSecret = await getOrganisationSecret(orgId);

  const layer1 = decryptAesGcm(enc2, orgSecret);
  const [enc1, projectId] = layer1.split('|');

  let projectSecret = await getProjectSecret(projectId, orgId);

  const nonce = decryptAesGcm(enc1, projectSecret);
  if (nonce !== NONCE_VALUE) throw new Error('Nonce mismatch');

  const result = { orgId, projectId };
  await CacheDAL.setApiKey(apiKey, result, API_KEY_CACHE_TTL_SECONDS);
  return result;
}

module.exports = { createApiKey, validateApiKey };
