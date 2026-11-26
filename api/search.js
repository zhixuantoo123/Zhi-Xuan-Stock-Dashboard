const https = require('https');
const url = require('url');

function fetchHttps(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: timeoutMs
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const q = (req.query && req.query.q) || '';
  if (!q) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ quotes: [] }));
    return;
  }

  const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
  try {
    const resp = await fetchHttps(apiUrl, 5000);
    res.statusCode = resp.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(resp.data);
  } catch (e) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ quotes: [] }));
  }
};

