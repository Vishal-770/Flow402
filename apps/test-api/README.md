# Dummy Test API

A simple Express server for testing proxy and gateway logic.

## Base URL
`http://localhost:3001`

## Endpoints

### 1. GET `/user`
Returns test user data based on query parameter.
- **Query Params**: `id` (optional)
- **Example**: `GET /user?id=123`

### 2. POST `/echo`
Echoes back the request body.
- **Body**: Any JSON object
- **Example**: `POST /echo` with `{"test": "data"}`

### 3. GET `/status`
Returns server status and uptime.
- **Example**: `GET /status`

### 4. Catch-all `/*`
Any other path/method will return a full echo of the request (headers, query, body, path).

## Running
```bash
node server.js
```
