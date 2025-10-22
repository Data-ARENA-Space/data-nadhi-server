class Logger {
  constructor({ level = process.env.LOG_LEVEL || "info", baseMeta = {} } = {}) {
    this.level = level;
    this.baseMeta = this._pruneNullish(baseMeta);
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  child(extraMeta = {}) {
    const merged = { ...this.baseMeta, ...extraMeta };
    return new Logger({ level: this.level, baseMeta: this._pruneNullish(merged) });
  }

  // Support both (message, context) and (message, context, meta)
  log(level, message, context = {}, meta) {
    if (this.levels[level] > this.levels[this.level]) return;

    const metaFromContext = this._extractMetaFromContext(context);
    const finalMeta = this._pruneNullish({
      ...this.baseMeta,
      ...metaFromContext,
      ...(meta || {}),
    });

    // Remove meta keys from context to keep them only at top-level
    const cleanedContext = this._omitMetaKeys(context);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: cleanedContext,
    };

    // Conditionally include only non-nullish meta at the top level
    if (finalMeta.organisationId != null) logEntry.organisationId = finalMeta.organisationId;
    if (finalMeta.projectId != null) logEntry.projectId = finalMeta.projectId;
    if (finalMeta.pipelineId != null) logEntry.pipelineId = finalMeta.pipelineId;
    if (finalMeta.messageId != null) logEntry.messageId = finalMeta.messageId;
    if (finalMeta.logData != null) logEntry.logData = finalMeta.logData;

    try {
      console.log(JSON.stringify(logEntry));
    } catch (_e) {
      // Fallback if circular in context
      console.log(JSON.stringify({ ...logEntry, context: String(cleanedContext) }));
    }
  }

  error(msg, context = {}, meta) { this.log("error", msg, context, meta); }
  warn(msg, context = {}, meta)  { this.log("warn", msg, context, meta); }
  info(msg, context = {}, meta)  { this.log("info", msg, context, meta); }
  debug(msg, context = {}, meta) { this.log("debug", msg, context, meta); }

  _extractMetaFromContext(ctx) {
    if (!ctx || typeof ctx !== 'object') return {};
    const org = ctx.organisationId ?? ctx.orgId;
    const proj = ctx.projectId ?? ctx.projId;
    const pipe = ctx.pipelineId ?? ctx.plId;
    const msgId = ctx.messageId ?? ctx.message_id;
    const logData = ctx.logData ?? ctx.log_data;
    return this._pruneNullish({
      organisationId: org,
      projectId: proj,
      pipelineId: pipe,
      messageId: msgId,
      logData,
    });
  }

  _omitMetaKeys(ctx) {
    if (!ctx || typeof ctx !== 'object') return ctx;
    const { organisationId, orgId, projectId, projId, pipelineId, plId, messageId, message_id, logData, log_data, ...rest } = ctx;
    return rest;
  }

  _pruneNullish(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (v !== null && v !== undefined) out[k] = v;
    }
    return out;
  }
}

module.exports = Logger;
