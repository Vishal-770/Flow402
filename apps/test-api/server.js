import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... [Endpoints remain unchanged] ...
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Flow402 Test API is operational",
    endpoints: ["/user", "/echo", "/status", "/v1/auth/validate", "/v1/transactions/create", "/v1/market/prices", "/v1/analytics/report", "/v1/infrastructure/config/:region", "/v1/weather/forecast", "/v1/finance/conversion", "/v1/inventory/lookup", "/v1/news/aggregate", "/v1/crypto/gas"]
  });
});

app.get('/user', (req, res) => {
  const userId = req.query.id || 'unknown';
  res.json({
    success: true,
    data: {
      id: userId,
      name: `Test User ${userId}`,
      email: `user${userId}@example.com`
    },
    received: { query: req.query, headers: req.headers }
  });
});

app.post('/echo', (req, res) => {
  res.json({
    success: true,
    message: "Data received successfully",
    body: req.body,
    received: { headers: req.headers }
  });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: "online",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── Phase 3: Dummy Infrastructure Endpoints ───────────────────────────────

app.get('/v1/auth/validate', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      expected_header: "Authorization: Bearer <token>"
    });
  }
  
  const token = auth.split(' ')[1];
  res.json({
    success: true,
    identity: {
      address: "0x" + "a".repeat(40),
      session_id: "sid_" + Math.random().toString(36).substring(7),
      permissions: ["read:endpoints", "execute:proxy"]
    },
    received_token: token
  });
});

app.post('/v1/transactions/create', (req, res) => {
  const { amount, to, symbol } = req.body;
  
  if (!amount || !to || !symbol) {
    return res.status(400).json({
      success: false,
      error: "Invalid transaction schema",
      required_fields: ["amount", "to", "symbol"]
    });
  }

  res.status(201).json({
    success: true,
    tx_hash: "0x" + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
    timestamp: new Date().toISOString(),
    status: "pending_confirmation"
  });
});

app.get('/v1/market/prices', (req, res) => {
  const tokens = (req.query.tokens || "ETH,USDC,DAI").split(',');
  const prices = tokens.map(t => ({
    symbol: t.trim().toUpperCase(),
    price: (Math.random() * 3000).toFixed(2),
    confidence: (0.95 + Math.random() * 0.05).toFixed(4)
  }));

  res.json({
    success: true,
    source: "Dummy Oracle Framework",
    data: prices
  });
});

app.post('/v1/analytics/report', (req, res) => {
  const appId = req.headers['x-app-id'] || 'anonymous';
  const events = req.body.events || [];

  res.json({
    success: true,
    received_events: events.length,
    app_id: appId,
    processing_latency_ms: Math.floor(Math.random() * 40)
  });
});

app.get('/v1/infrastructure/config/:region', (req, res) => {
  const { region } = req.params;
  const config = {
    us_east: { node_count: 50, latency_target: "20ms", priority: "high" },
    eu_west: { node_count: 32, latency_target: "45ms", priority: "medium" },
    default: { node_count: 10, latency_target: "100ms", priority: "low" }
  };

  res.json({
    success: true,
    region: region,
    configuration: config[region] || config.default
  });
});

// ─── Phase 4: Extended Query Parameter Use Cases ───────────────────────────

app.get('/v1/weather/forecast', (req, res) => {
  const { lat, lon, units = 'metric' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, error: "Latitude and Longitude are required" });
  }
  res.json({
    success: true,
    location: { lat, lon },
    units,
    forecast: {
      temperature: (Math.random() * 30).toFixed(1),
      condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 100) + "%"
    }
  });
});

app.get('/v1/finance/conversion', (req, res) => {
  const { from = 'USD', to = 'EUR', amount = 1 } = req.query;
  const rate = (0.8 + Math.random() * 0.4).toFixed(4);
  res.json({
    success: true,
    from,
    to,
    amount: parseFloat(amount as string),
    rate: parseFloat(rate),
    result: (parseFloat(amount as string) * parseFloat(rate)).toFixed(2),
    timestamp: new Date().toISOString()
  });
});

app.get('/v1/inventory/lookup', (req, res) => {
  const { sku, warehouse = 'Global' } = req.query;
  if (!sku) {
    return res.status(400).json({ success: false, error: "SKU is required" });
  }
  res.json({
    success: true,
    sku,
    warehouse,
    stock_level: Math.floor(Math.random() * 500),
    status: Math.random() > 0.1 ? "in_stock" : "out_of_stock",
    last_updated: new Date().toISOString()
  });
});

app.get('/v1/news/aggregate', (req, res) => {
  const { topic = 'Technology', limit = '3' } = req.query;
  const numLimit = parseInt(limit as string) || 3;
  const articles = Array.from({ length: numLimit }).map((_, i) => ({
    id: i + 1,
    title: `${topic} News Item ${i + 1}`,
    sentiment: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)],
    relevance: (Math.random()).toFixed(2)
  }));
  res.json({
    success: true,
    topic,
    count: articles.length,
    articles
  });
});

app.get('/v1/crypto/gas', (req, res) => {
  const { chain = 'ethereum', speed = 'standard' } = req.query;
  const baseGas = Math.floor(Math.random() * 50) + 10;
  const speeds: Record<string, number> = {
    slow: baseGas * 0.8,
    standard: baseGas,
    fast: baseGas * 1.5
  };
  res.json({
    success: true,
    chain: (chain as string).toLowerCase(),
    requested_speed: speed,
    gwei: Math.floor(speeds[speed as string] || baseGas),
    estimated_seconds: speed === 'fast' ? 15 : speed === 'standard' ? 60 : 300
  });
});

app.use((req, res) => {
  const info = {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Default Catch-all Echo",
    received: info
  });
});

// For local direct execution
if (process.env.NODE_ENV !== 'production' && !process.env.CLOUDFLARE_WORKER && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Dummy test server listening at http://localhost:${port}`);
  });
}

// Handler for Cloudflare Workers
const handler = serverless(app);

const cfExport = {
  fetch: async (request, env, ctx) => {
    return await handler(request, env, ctx);
  }
};

// Hybrid Export: Support both Vercel (default app export) and Cloudflare (fetch wrapper)
export const fetch = cfExport.fetch;
export default (process.env.VERCEL ? app : cfExport);
