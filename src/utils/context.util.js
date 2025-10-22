const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

function run(fn, initial = {}) {
  return als.run({ ...initial }, fn);
}

function enter(initial = {}) {
  als.enterWith({ ...initial });
}

function get() {
  return als.getStore() || null;
}

function set(partial) {
  let s = als.getStore();
  if (!s) {
    // Initialize a store if none exists yet
    s = { ...partial };
    als.enterWith(s);
    return;
  }
  Object.assign(s, partial);
  // If a logger exists in store, rebind with new base meta
  if (s.logger && typeof s.logger.child === 'function') {
    s.logger = s.logger.child(partial);
  }
}

function getLogger() {
  const Logger = require('./logger.util');
  let s = als.getStore();
  if (!s) {
    s = {};
    als.enterWith(s);
  }
  if (s.logger) return s.logger;
  const baseMeta = {};
  if (s.organisationId != null) baseMeta.organisationId = s.organisationId;
  if (s.projectId != null) baseMeta.projectId = s.projectId;
  if (s.pipelineId != null) baseMeta.pipelineId = s.pipelineId;
  if (s.messageId != null) baseMeta.messageId = s.messageId;
  if (s.logData != null) baseMeta.logData = s.logData;
  s.logger = new Logger({ baseMeta });
  return s.logger;
}

module.exports = { run, enter, get, set, getLogger };
