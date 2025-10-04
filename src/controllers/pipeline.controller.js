const { getPipelineByCode } = require('../services/projects.service');
const { enqueue } = require('../services/queue.service');

const triggerPipeline = async (req, res) => {
  try {
    const { pipeline_id, log_data } = req.body;
    if (!pipeline_id || !log_data) return res.status(400).json({ error: 'Missing pipeline_id or log_data' });

    // pipeline_id input from user is actually pipelineCode
    const pipeline = await getPipelineByCode(req.orgId, req.projectId, pipeline_id);

    console.log(pipeline)

    if (!pipeline || !pipeline.pipelineId) {
      return res.status(400).json({ error: 'Pipeline not found for the given project' });
    }

    if (!pipeline.active) {
      return res.status(400).json({ error: 'Pipeline is not active' });
    }

    enqueue(req.orgId, req.projectId, pipeline.pipelineId, log_data);

    console.log(`Processing pipeline ${pipeline_id} with log data:`, log_data);
    
    res.json({ message: "Started Processing" });
  } catch (err) {
    console.error('Internal Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { triggerPipeline };