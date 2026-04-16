# GET /v1/crypto/gas

Simulates a high-frequency blockchain gas price tracker.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `chain` | `string` | No | Target blockchain name (e.g., `ethereum`, `polygon`). Defaults to `ethereum`. |
| `speed` | `string` | No | Desired confirmation speed: `slow`, `standard`, `fast`. Defaults to `standard`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "chain": "ethereum",
  "requested_speed": "fast",
  "gwei": 48,
  "estimated_seconds": 15
}
```
