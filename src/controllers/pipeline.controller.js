const triggerPipeline = (req, res) => {
  try {
    const { pipeline_id, log_data } = req.body;
    if (!pipeline_id || !log_data) return res.status(400).json({ error: 'Missing pipeline_id or log_data' });

    console.log(`Processing pipeline ${pipeline_id} with log data:`, log_data);
    
    res.json({ message: "Started Processing" });
  } catch (err) {
    console.error('Encrypt-global error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { triggerPipeline };