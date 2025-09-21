const MongoService = require('../services/mongo.service');
const mongoService = new MongoService(); // singleton instance

const getProject = (orgId, projectId) => {
  const db = mongoService.db();
  return db.collection('Projects').findOne({ projectId, organisationId: orgId });
}

const getOrganisation = (orgId) => {
  const db = mongoService.db();
  return db.collection('Organisations').findOne({ organisationId: orgId });
}

module.exports = { getProject, getOrganisation, mongoService };
