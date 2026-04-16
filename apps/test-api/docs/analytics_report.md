# POST /v1/analytics/report

Simulates an ingestion endpoint for platform analytics.

## Parameters

### Headers
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `X-App-ID` | `string` | No | Identifier for the client application. Defaults to `anonymous`. |

### Request Body
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `events` | `array` | No | List of event objects to process. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "received_events": 5,
  "app_id": "flow-dashboard-v1",
  "processing_latency_ms": 12
}
```
