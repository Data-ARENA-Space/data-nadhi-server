const { getPipelineByCode } = require('../services/entities.service');
const { enqueue } = require('../services/queue.service');
const { generateMessageId } = require('../services/crypto.service');
const { ValidationError, NotFoundError } = require('../utils/error.util');
const context = require('../utils/context.util');

const triggerPipeline = async (req, res, next) => {
  try {
    let { pipeline_id, log_data } = req.body;
    if (!pipeline_id || !log_data) throw new ValidationError('Missing pipeline_id or log_data');

    // put log_data into async context so it appears on outer log fields
    context.set({ logData: log_data });
    req.logger = context.getLogger();

    // pipeline_id input from user is actually pipelineCode
    req.logger.debug('Trigger pipeline request received', { pipelineCode: pipeline_id });
    const pipeline = await getPipelineByCode(req.orgId, req.projectId, pipeline_id);

    if (!pipeline || !pipeline.pipelineId) {
      throw new NotFoundError('Pipeline not found for the given project', { context: { pipelineCode: pipeline_id } });
    }

    if (!pipeline.active) {
      throw new ValidationError('Pipeline is not active', { context: { pipelineCode: pipeline_id, pipelineId: pipeline.pipelineId } });
    }

    // enrich async context with pipelineId for downstream async functions
    req.pipelineId = pipeline.pipelineId;
    context.set({ pipelineId: pipeline.pipelineId });
    req.logger = context.getLogger();
    req.logger.debug('Pipeline resolved', { pipelineId: pipeline.pipelineId });

    // Generate messageId before enqueuing
    const messageId = generateMessageId(pipeline.pipelineId, log_data.trace_id || log_data.traceId || 'anonymous');

    // Build a per-request event logger detached from ALS to avoid context loss
    const eventLogger = req.logger.child({
      organisationId: req.orgId,
      projectId: req.projectId,
      pipelineId: pipeline.pipelineId,
      messageId,
      logData: log_data,
    });

    // Enqueue asynchronously without waiting (fire and forget)
    enqueue(req.orgId, req.projectId, pipeline.pipelineId, messageId, log_data, { logger: eventLogger });
    // Note: Errors are logged to MinIO inside enqueue function

    req.logger.debug('Trigger accepted', { messageId, pipelineCode: pipeline_id });

    res.json({ message: "Started Processing", messageId });
  } catch (err) {
    next(err);
  }
}

module.exports = { triggerPipeline };
