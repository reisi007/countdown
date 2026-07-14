# Countdown Deployment

## Prerequisites

- Docker and Docker Compose installed on the server
- Portainer instance for management (optional)
- Access to GitHub Container Registry (`ghcr.io/anomalyco/countdown`)

## Quick Start

```bash
# Pull and start the container
docker compose pull
docker compose up -d

# Check logs
docker compose logs -f
```

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

1. Push to `main` triggers the pipeline
2. Tests run via Vitest
3. Docker image is built and pushed to GHCR
4. Portainer webhook triggers automatic redeployment

## Portainer Setup

1. In Portainer, create a new stack
2. Use the `docker-compose.yml` from this directory
3. Configure the webhook URL in GitHub Secrets as `PORTAINER_WEBHOOK_URL`
4. The stack will auto-update when the webhook fires

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |

## Network

The container connects to the `proxy` network for Caddy reverse proxy access.
