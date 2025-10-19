require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiKeyMiddleware = require('./middlewares/apiKey.middleware');
const pipelineRoutes = require('./routes/pipeline.route');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});
app.use('/api/entities', apiKeyMiddleware, pipelineRoutes);

module.exports = app;
