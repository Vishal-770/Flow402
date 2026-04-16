const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 1. Identity Verification (Headers + Response Switching)
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

// 2. Transaction Simulation (Body + Validation)
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

// 3. Market Oracle (Complex Query + Dynamic List)
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

// 4. Analytics Collector (Headers + Body)
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

// 5. Regional Config (Path Parameters)
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

app.use((req, res) => {
  const info = {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString(),
  };

  console.log(`[${info.timestamp}] ${info.method} ${info.path}`);
  console.log('Headers:', JSON.stringify(info.headers, null, 2));
  console.log('Query:', JSON.stringify(info.query, null, 2));
  console.log('Body:', JSON.stringify(info.body, null, 2));
  console.log('-------------------------------------------');

  res.status(200).json({
    success: true,
    message: "Default Catch-all Echo",
    received: info
  });
});

app.listen(port, () => {
  console.log(`Dummy test server listening at http://localhost:${port}`);
});
