# x402 Backend Gateway

A robust, dynamic payment gateway built with NestJS, integrated with the Thirdweb x402 protocol for cross-chain API monetization.

## Features
- **Dynamic Proxying**: Routes requests as `gw/:gatewayPath/*` using metadata fetched from the database.
- **x402 Payment Settlement**: Verifies and settles cross-chain payments via the `thirdweb/x402` facilitator.
- **Activity Logging**: Automatically logs every request (latency, caller, status, price) to the `api_calls` table.
- **Secure Upstream Communication**: Enforces only authorized headers from the `api_upstream_headers` table while forwarding body and query params.

## Prerequisites
- Node.js (v18+)
- pnpm / npm
- Neon PostgreSQL database

## Installation
```bash
pnpm install
```

## Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL='your-neon-db-url'
PORT=4000
THIRDWEB_SECRET_KEY='your-thirdweb-secret-key'
SERVER_WALLET_ADDRESS='0xYourServerWalletAddress'
```

## Running
```bash
# Development mode (with watcher)
pnpm dev

# Build for production
pnpm build

# Start production build
pnpm start:prod
```

## Architecture
- **DatabaseModule**: Global module for Drizzle ORM and Neon connection.
- **ThirdwebModule**: Initializes the Thirdweb client and x402 facilitator.
- **GatewayModule**: Handles the dynamic wildcard routing and payment settlement logic.
- **Drizzle Schema**: Synchronized with the `main-app` for data consistency.

## Usage
Route any request through:
`http://localhost:4000/gw/{gatewayPath}/{remaining-path}`

The gateway will check if the endpoint exists, verify the `x-payment` header, log the call, and proxy the request to the upstream provider.
