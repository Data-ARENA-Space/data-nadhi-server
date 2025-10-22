require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiKeyMiddleware = require('./middlewares/apiKey.middleware');
const pipelineRoutes = require('./routes/pipeline.route');
const requestLogger = require('./middlewares/requestLogger.middleware');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();
app.use(cors());
app.use(express.json());

// Attach a request-scoped logger and traceId to all requests early
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Protect entities routes with API key
app.use('/api/entities', apiKeyMiddleware, pipelineRoutes);

// Centralized error handler (must be after routes)
app.use(errorMiddleware);

module.exports = app;
