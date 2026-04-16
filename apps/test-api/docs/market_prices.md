# GET /v1/market/prices

Simulates a price oracle for multiple token assets.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `tokens` | `string` | No | Comma-separated list of symbols (e.g., `ETH,USDC,SOL`). Defaults to `ETH,USDC,DAI`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "source": "Dummy Oracle Framework",
  "data": [
    {
      "symbol": "ETH",
      "price": "2845.12",
      "confidence": "0.9842"
    },
    ...
  ]
}
```
