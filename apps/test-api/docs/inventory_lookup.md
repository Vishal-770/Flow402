# GET /v1/inventory/lookup

Simulates a global inventory/SKU management system.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `sku` | `string` | **Yes** | The Stock Keeping Unit identifier to check. |
| `warehouse` | `string` | No | Target warehouse location (e.g., `NY`, `LDN`). Defaults to `Global`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "sku": "SKU-9982X",
  "warehouse": "LDN",
  "stock_level": 342,
  "status": "in_stock",
  "last_updated": "2026-04-16T10:13:43.000Z"
}
```

### Error (400 Bad Request)
Returned if `sku` is missing.
```json
{
  "success": false,
  "error": "SKU is required"
}
```
