const https = require('https');
const url = require('url');

function fetchHttps(targetUrl, timeoutMs = 8000) {
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

  const { symbol = '^GSPC', interval = '1d' } = req.query || {};
  let range = (req.query && req.query.range) || '1mo';
  if (range === 'all') range = 'max';

  let symEncoded = encodeURIComponent(symbol);
  if (symbol === 'VWRA') symEncoded = 'VWRA.L';
  if (/^0+(\d+\.HK)$/i.test(symbol)) symEncoded = symbol.replace(/^0+/, '');

  const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symEncoded}?interval=${interval}&range=${range}`;

  try {
    const resp = await fetchHttps(apiUrl, 9000);
    res.statusCode = resp.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(resp.data);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

