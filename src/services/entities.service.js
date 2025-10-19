const { encryptAesGcm, decryptAesGcm } = require('./crypto.service');

const entitiesDal = require('../dal/entities.dal');
const cacheDal = require('../dal/cache.dal');

const {SEC_DB, ENTITY_CACHE_TTL_SECONDS, SECRET_CACHE_TTL_SECONDS} = process.env;

const getOrganisationById = async (orgId) => {
  // Check cache first
  let org = await cacheDal.getOrganisation(orgId);
  if (org) return org;

  org = await entitiesDal.getOrganisation(orgId);
  if (org) {
    cacheDal.setOrganisation(orgId, org, ENTITY_CACHE_TTL_SECONDS);
  }
  return org;
}

const getProjectById = async (orgId, projectId) => {
  // Check cache first
  let project = await cacheDal.getProject(orgId, projectId);
  if (project) return project;

  project = await entitiesDal.getProject(orgId, projectId);
  if (project) {
    cacheDal.setProject(orgId, projectId, project, ENTITY_CACHE_TTL_SECONDS);
  }
  return project;
}

const getPipelineByCode = async (orgId, projectId, pipelineCode) => {
  // Check cache first
  let pipeline = await cacheDal.getPipeline(orgId, projectId, pipelineCode);
  if (pipeline) return pipeline;
  pipeline = await entitiesDal.getPipeline(orgId, projectId, pipelineCode);
  if (pipeline) {
    cacheDal.setPipeline(orgId, projectId, pipelineCode, pipeline, ENTITY_CACHE_TTL_SECONDS);
  }
  return pipeline;
}

const getPipelineById = async (orgId, projectId, pipelineId) => {
  // Check cache first
  let pipeline = await cacheDal.getPipelineById(orgId, projectId, pipelineId);
  if (pipeline) return pipeline;
  pipeline = await entitiesDal.getPipelineById(orgId, projectId, pipelineId);
  if (pipeline) {
    cacheDal.setPipelineById(orgId, projectId, pipelineId, pipeline, ENTITY_CACHE_TTL_SECONDS);
  }
  return pipeline;
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

const getProcessorId = async (orgId, projectId, pipelineId) => {
    const org = await getOrganisationById(orgId);
    if (!org) throw new Error('Organisation not found');
    const project = await getProjectById(orgId, projectId);
    if (!project) throw new Error('Project not found');
    const pipeline = await getPipelineById(orgId, projectId, pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');
    return pipeline.processorId || project.processorId || org.processorId || "default";
}

module.exports = { getPipelineByCode, getOrganisationSecret, getProjectSecret, getProcessorId, getPipelineById };