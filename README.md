# data-nadhi-server

## Dev Container Setup

This project is designed to run inside a VS Code dev container.

### Port Forwarding
The server port is configured via the `.env` file (default: `PORT=5000`).
Make sure your `.devcontainer/devcontainer.json` has:

```json
"forwardPorts": [5000]
```

If you change the port in `.env`, update `forwardPorts` accordingly.

### Server Binding
The server should bind to `0.0.0.0` to be accessible from outside the container.

### Accessing from Another Dev Container
If using Docker Compose or a custom network, use the service/container name as the hostname (e.g., `http://data-nadhi-server:5000`).

### Common Issues
- **403 Forbidden**: Ensure you are using the correct HTTP method and endpoint. Some routes only accept POST requests.
- **Cannot POST /route**: Double-check the route and method. Restart the server after changes.
- **remote origin already exists**: Your Git remote is already set. Use `git remote -v` to check, or `git remote set-url origin <url>` to update.

---
For more details, see the code and comments in the repository.
