# POST /v1/transactions/create

Simulates a blockchain transaction submission.

## Request Body

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | `number` | Yes | The quantity of tokens to transfer. |
| `to` | `string` | Yes | The destination wallet address. |
| `symbol` | `string` | Yes | The token symbol (e.g., `ETH`, `USDC`). |

## Response

### Success (201 Created)
```json
{
  "success": true,
  "tx_hash": "0x...",
  "timestamp": "2026-04-16T...",
  "status": "pending_confirmation"
}
```

### Error (400 Bad Request)
Returned if required fields are missing.
```json
{
  "success": false,
  "error": "Invalid transaction schema",
  "required_fields": ["amount", "to", "symbol"]
}
```
