# Dummy Test API

A simple Express server for testing proxy and gateway logic.

## Base URL
`http://localhost:3001`

## Registered Infrastructure Endpoints

| Endpoint | Method | Documentation | Logic |
| :--- | :--- | :--- | :--- |
| `/v1/auth/validate` | `GET` | [View Docs](./docs/auth_validate.md) | Header validation (Authorization) |
| `/v1/transactions/create` | `POST` | [View Docs](./docs/transactions_create.md) | Schema-based payload validation |
| `/v1/market/prices` | `GET` | [View Docs](./docs/market_prices.md) | Complex query string processing |
| `/v1/analytics/report` | `POST` | [View Docs](./docs/analytics_report.md) | Custom header & array ingestion |
| `/v1/infrastructure/config/:region` | `GET` | [View Docs](./docs/infrastructure_config.md) | Path parameter resolution |

---

## Utility Endpoints

| Endpoint | Method | Example |
| :--- | :--- | :--- |
| `/user` | `GET` | `GET /user?id=123` |
| `/echo` | `POST` | (Echoes JSON body) |
| `/status` | `GET` | System uptime monitoring |
| `/*` | `ANY` | Global catch-all reflection |

---

## Running
```bash
node server.js
```
