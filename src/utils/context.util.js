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
  const baseMeta = {
    organisationId: s.organisationId ?? null,
    projectId: s.projectId ?? null,
    pipelineId: s.pipelineId ?? null,
    traceId: s.traceId ?? null,
    logData: s.logData ?? null,
  };
  s.logger = new Logger({ baseMeta });
  return s.logger;
}

module.exports = { run, enter, get, set, getLogger };
