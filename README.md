# Data Nadhi Server

Main API server for Data Nadhi that handles pipeline management and API requests.

## Description

This server provides REST API endpoints for managing data pipelines, connects to MongoDB for data storage, and uses Redis for caching pipeline configurations and secrets.

## Dev Container

This repository includes a dev container configuration with all required dependencies and services pre-configured.

**To use:**
1. Open the repository in VS Code
2. Click "Reopen in Container" when prompted
3. All services (MongoDB, Redis) will be available automatically

## Running the Server

```bash
npm run dev
```

The server will start on the port specified in your environment variables (default: 5000).

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
MONGO_URL=mongodb://mongo:27017/datanadhi_dev
REDIS_URL=redis://redis:6379
SEC_DB=my-secret-db-key
SEC_GLOBAL=my-global-root-key
NONCE_VALUE=DataNadhi
API_KEY_CACHE_TTL_SECONDS=300
SECRET_CACHE_TTL_SECONDS=3600
```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
