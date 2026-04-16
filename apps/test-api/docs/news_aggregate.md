# GET /v1/news/aggregate

Simulates a news aggregation and sentiment analysis engine.

## Parameters

### Query String
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `topic` | `string` | No | Focus topic for news retrieval (e.g., `Metaverse`, `Energy`). Defaults to `Technology`. |
| `limit` | `number` | No | Maximum number of articles to return. Defaults to `3`. |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "topic": "Blockchain",
  "count": 2,
  "articles": [
    {
      "id": 1,
      "title": "Blockchain News Item 1",
      "sentiment": "positive",
      "relevance": "0.94"
    },
    {
      "id": 2,
      "title": "Blockchain News Item 2",
      "sentiment": "neutral",
      "relevance": "0.78"
    }
  ]
}
```
