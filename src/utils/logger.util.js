class Logger {
  constructor({ level = process.env.LOG_LEVEL || "info", baseMeta = {} } = {}) {
    this.level = level;
    this.baseMeta = baseMeta;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  child(extraMeta = {}) {
    return new Logger({ level: this.level, baseMeta: { ...this.baseMeta, ...extraMeta } });
  }

  // Support both (message, context) and (message, context, meta)
  log(level, message, context = {}, meta) {
    if (this.levels[level] > this.levels[this.level]) return;

    const metaFromContext = this._extractMetaFromContext(context);
    const finalMeta = {
      ...{ organisationId: null, projectId: null, pipelineId: null, traceId: null, logData: null },
      ...this.baseMeta,
      ...metaFromContext,
      ...(meta || {}),
    };

    // Remove meta keys from context to keep them only at top-level
    const cleanedContext = this._omitMetaKeys(context);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      organisationId: finalMeta.organisationId ?? null,
      projectId: finalMeta.projectId ?? null,
      pipelineId: finalMeta.pipelineId ?? null,
      traceId: finalMeta.traceId ?? null,
      logData: finalMeta.logData ?? null,
      context: cleanedContext,
    };

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
    const org = ctx.organisationId ?? ctx.orgId ?? null;
    const proj = ctx.projectId ?? ctx.projId ?? null;
    const pipe = ctx.pipelineId ?? ctx.plId ?? null;
    const trace = ctx.traceId ?? ctx.trace_id ?? null;
    const logData = ctx.logData ?? ctx.log_data ?? undefined;
    return {
      organisationId: org ?? undefined,
      projectId: proj ?? undefined,
      pipelineId: pipe ?? undefined,
      traceId: trace ?? undefined,
      logData,
    };
  }

  _omitMetaKeys(ctx) {
    if (!ctx || typeof ctx !== 'object') return ctx;
    const { organisationId, orgId, projectId, projId, pipelineId, plId, traceId, trace_id, logData, log_data, ...rest } = ctx;
    return rest;
  }
}

module.exports = Logger;
