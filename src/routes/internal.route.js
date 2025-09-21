const express = require('express');
const { createApiKeyController, encryptGlobalController } = require('../controllers/internal.controller');
// const { encryptGlobalController } = require('../controllers/encrypt.controller');

const router = express.Router();
router.post('/create-api-key', createApiKeyController);
router.post('/encrypt-entity-level-secrets', encryptGlobalController);

module.exports = router;
