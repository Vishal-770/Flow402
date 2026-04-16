# GET /v1/finance/conversion

Simulates a real-time currency conversion/exchange service.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `from` | `string` | No | Source currency symbol (e.g., `USD`, `BTC`). Defaults to `USD`. |
| `to` | `string` | No | Target currency symbol (e.g., `EUR`, `ETH`). Defaults to `EUR`. |
| `amount` | `number` | No | Amount to convert. Defaults to `1`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "from": "USD",
  "to": "EUR",
  "amount": 100,
  "rate": 0.9241,
  "result": "92.41",
  "timestamp": "2026-04-16T10:13:35.000Z"
}
```
