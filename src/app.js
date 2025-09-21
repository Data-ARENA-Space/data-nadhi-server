require('dotenv').config();
const express = require('express');
const cors = require('cors');
const internalRoutes = require('./routes/internal.route');
const apiKeyMiddleware = require('./middlewares/apiKey.middleware');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});
app.use('/internal', internalRoutes);
app.get('/secure-data', apiKeyMiddleware, (req, res) => {
  res.json({ message: 'Access granted', orgId: req.orgId, projectId: req.projectId });
});

module.exports = app;
