const { encryptAesGcm, decryptAesGcm } = require('./crypto.service');

const projectDal = require('../dal/projects.dal');
const cacheDal = require('../dal/cache.dal');
const { get } = require('express/lib/response');

const {SEC_DB, ENTITY_CACHE_TTL_SECONDS, SECRET_CACHE_TTL_SECONDS} = process.env;

const getOrganisationById = async (orgId) => {
  // Check cache first
  let org = await cacheDal.getOrganisation(orgId);
  if (org) return org;

  org = await projectDal.getOrganisation(orgId);
  if (org) {
    cacheDal.setOrganisation(orgId, org, ENTITY_CACHE_TTL_SECONDS);
  }
  return org;
}

const getProjectById = async (orgId, projectId) => {
  // Check cache first
  let project = await cacheDal.getProject(orgId, projectId);
  console.log("Cache project", project);
  if (project) return project;

  project = await projectDal.getProject(orgId, projectId);
  console.log("Testing ---->>>> ", project);
  if (project) {
    cacheDal.setProject(orgId, projectId, project, ENTITY_CACHE_TTL_SECONDS);
  }
  return project;
}

const getPipelineByCode = async (orgId, projectId, pipelineCode) => {
  // Check cache first
  let pipeline = await cacheDal.getPipeline(orgId, projectId, pipelineCode);
  if (pipeline) return pipeline;

console.log("DAta", orgId, projectId, pipelineCode);
  pipeline = await projectDal.getPipeline(orgId, projectId, pipelineCode);
  if (pipeline) {
    cacheDal.setPipeline(orgId, projectId, pipelineCode, pipeline, ENTITY_CACHE_TTL_SECONDS);
  }
  return pipeline;
}

const getProcessorById = async (processorId) => {
  // Check cache first
  let processor = await cacheDal.getProcessor(processorId);
  if (processor) return processor;

  processor = await projectDal.getProcessor(processorId);
  if (processor) {
    cacheDal.setProcessor(processorId, processor, ENTITY_CACHE_TTL_SECONDS);
  }
  return processor;
}

const getQueueById = async (queueId) => {
  // Check cache first
  let queue = await cacheDal.getQueue(queueId);
  if (queue) return queue;

  queue = await projectDal.getQueue(queueId);
  if (queue) {
    cacheDal.setQueue(queueId, queue, ENTITY_CACHE_TTL_SECONDS);
  }
  return queue;
}

const getOrganisationSecret = async (orgId) => {
    let orgSecret = await cacheDal.getOrganisationSecret(orgId);
    if (!orgSecret) {
        let organisation = await getOrganisationById(orgId);
        // console.log(organisation, organisation.organisationSecret);
        if (!organisation) throw new Error('Organisation not found');
        orgSecret = decryptAesGcm(organisation.organisationSecretEncrypted, SEC_DB);
        cacheDal.setOrganisationSecret(orgId, orgSecret, SECRET_CACHE_TTL_SECONDS);
    }
    return orgSecret;
}

const getProjectSecret = async (orgId, projectId) => {
    let projectSecret = await cacheDal.getProjectSecret(orgId, projectId);
    if (!projectSecret) {
        let project = await getProjectById(orgId, projectId);
        if (!project) throw new Error('Project not found');
        projectSecret = decryptAesGcm(project.projectSecretEncrypted, SEC_DB);
        cacheDal.setProjectSecret(orgId, projectId, projectSecret, SECRET_CACHE_TTL_SECONDS);
    }
    return projectSecret;
}

const getQueue = async (orgId) => {
    const org = await getOrganisationById(orgId);
    if (!org) throw new Error('Organisation not found');
    const defaultQueueId = process.env.DEFAULT_QUEUE_ID || 'default';
    let processorId = org.processorId;
    let queueId = defaultQueueId;
    if (processorId) {
        const processor = await getProcessorById(processorId);
        if (processor?.config?.queueId) queueId = processor.config.queueId;
    }
    const queue = await getQueueById(queueId);
    if (!queue) throw new Error('Queue not found');
    return queue;
}

const _getQueueCredentials = async (orgId) => {
    const queue = await getQueue(orgId);

    console.log("Queue config", queue.queueConfig);
    let {fileStorage, database} = queue.queueConfig;
    fileStorageCredentials = JSON.parse(decryptAesGcm(fileStorage.encryptedCreds, SEC_DB));
    databaseCredentials = JSON.parse(decryptAesGcm(database.encryptedCreds, SEC_DB));

    return { fileStorage: {...fileStorage, creds: fileStorageCredentials}, database: {...database, creds: databaseCredentials} };
}

const getQueueCredentials = async (orgId) => {
    let queueCreds = await cacheDal.getQueueCreds(orgId);
    if (queueCreds) return queueCreds;
    
    queueCreds = await _getQueueCredentials(orgId);
    if (queueCreds) {
        cacheDal.setQueueCreds(orgId, JSON.stringify(queueCreds), ENTITY_CACHE_TTL_SECONDS);
    }
    return queueCreds;
}

module.exports = { getPipelineByCode, getOrganisationSecret, getProjectSecret, getQueueCredentials };