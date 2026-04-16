# GET /v1/auth/validate

Simulates a cryptographic identity verification process.

## Parameters

### Headers
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | Yes | Bearer token format: `Bearer <token>` |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "identity": {
    "address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "session_id": "sid_...",
    "permissions": ["read:endpoints", "execute:proxy"]
  },
  "received_token": "<token>"
}
```

### Error (401 Unauthorized)
Returned if the `Authorization` header is missing.
```json
{
  "success": false,
  "error": "Authentication required",
  "expected_header": "Authorization: Bearer <token>"
}
```
