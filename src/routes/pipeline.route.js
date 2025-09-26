const { triggerPipeline } = require("../controllers/pipeline.controller");
const express = require('express');

const router = express.Router();
router.post('/trigger', triggerPipeline);

module.exports = router;