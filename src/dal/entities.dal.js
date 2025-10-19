const MongoService = require('../services/mongo.service');
const mongoService = new MongoService(); // singleton instance

const getPipeline = (orgId, projectId, pipelineCode) => {
  const db = mongoService.db();
  return db.collection('Pipelines').findOne({ pipelineCode: pipelineCode, projectId, organisationId: orgId });
}

const getPipelineById = (orgId, projectId, pipelineId) => {
  const db = mongoService.db();
  return db.collection('Pipelines').findOne({ pipelineId, projectId, organisationId: orgId });
}

const getProject = (orgId, projectId) => {
  const db = mongoService.db();
  return db.collection('Projects').findOne({ projectId, organisationId: orgId });
}

const getOrganisation = (orgId) => {
  const db = mongoService.db();
  return db.collection('Organisations').findOne({ organisationId: orgId });
}


module.exports = { getProject, getOrganisation, getPipeline, getPipelineById, mongoService };
