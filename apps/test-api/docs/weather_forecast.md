# GET /v1/weather/forecast

Simulates a weather forecasting service for specific geo-coordinates.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `lat` | `float` | **Yes** | Latitude of the target location. |
| `lon` | `float` | **Yes** | Longitude of the target location. |
| `units` | `string` | No | Measurement units: `metric` (Celsius) or `imperial` (Fahrenheit). Defaults to `metric`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "location": {
    "lat": "40.7128",
    "lon": "-74.0060"
  },
  "units": "metric",
  "forecast": {
    "temperature": "22.5",
    "condition": "Partly Cloudy",
    "humidity": "64%"
  }
}
```

### Error (400 Bad Request)
Returned if `lat` or `lon` are missing.
```json
{
  "success": false,
  "error": "Latitude and Longitude are required"
}
```
