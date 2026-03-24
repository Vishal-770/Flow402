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
