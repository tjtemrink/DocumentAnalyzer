const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

// Azure Functions URLs
const AZURE_FUNCTION_URL = 'https://fa-philer-docscan-d0aha6eneya7cngk.canadacentral-01.azurewebsites.net';

// Proxy endpoints to Azure Functions
app.post('/api/ScanDoc', async (req, res) => {
  try {
    const response = await fetch(`${AZURE_FUNCTION_URL}/api/ScanDoc`, {
      method: 'POST',
      headers: req.headers,
      body: req.body
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ScanDoc proxy error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.post('/api/validate', async (req, res) => {
  try {
    const response = await fetch(`${AZURE_FUNCTION_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Validate proxy error:', error);
    res.status(500).json({ error: 'Failed to validate document' });
  }
});

app.get('/api/rules', async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const response = await fetch(`${AZURE_FUNCTION_URL}/api/rules?${queryString}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Rules proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

app.post('/api/search/brief', async (req, res) => {
  try {
    const response = await fetch(`${AZURE_FUNCTION_URL}/api/search/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Search proxy error:', error);
    res.status(500).json({ error: 'Failed to search briefs' });
  }
});

app.post('/api/qa', async (req, res) => {
  try {
    const response = await fetch(`${AZURE_FUNCTION_URL}/api/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('QA proxy error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'document-qa.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Legal Knowledge Bank Frontend running on port ${PORT}`);
  console.log(`🌐 Frontend: https://app-legal-kb.azurewebsites.net`);
  console.log(`🔗 Connected to Azure Functions: ${AZURE_FUNCTION_URL}`);
  console.log(`🎯 Ready for document analysis!`);
});

