// High-Performance Zero-Dependency Node.js Web Server & Financial Data Proxy
// Compatible with Render, Vercel, Railway, Fly.io, Heroku, Windows, Linux, and macOS
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const cache = {
  marketSummary: null,
  marketSummaryTime: 0,
  news: null,
  newsTime: 0
};

const CORE_SYMBOLS = [
  { id: "SP500", symbol: "^GSPC", name: "S&P 500", category: "Indices", type: "index" },
  { id: "NASDAQ", symbol: "^IXIC", name: "NASDAQ Composite", category: "Indices", type: "index" },
  { id: "DOW", symbol: "^DJI", name: "Dow Jones Industrial", category: "Indices", type: "index" },
  { id: "VIX", symbol: "^VIX", name: "CBOE Volatility Index (VIX)", category: "Indices", type: "volatility" },
  { id: "FTSE", symbol: "^FTSE", name: "FTSE 100", category: "Indices", type: "index" },
  { id: "NIKKEI", symbol: "^N225", name: "Nikkei 225", category: "Indices", type: "index" },
  { id: "HSI", symbol: "^HSI", name: "Hang Seng Index", category: "Indices", type: "index" },
  { id: "STI", symbol: "^STI", name: "Straits Times Index (STI)", category: "Indices", type: "index" },
  { id: "BTC", symbol: "BTC-USD", binance: "BTCUSDT", name: "Bitcoin", category: "Crypto", type: "crypto" },
  { id: "ETH", symbol: "ETH-USD", binance: "ETHUSDT", name: "Ethereum", category: "Crypto", type: "crypto" },
  { id: "GOLD", symbol: "GC=F", name: "Gold Futures", category: "Commodities", type: "commodity" },
  { id: "SILVER", symbol: "SI=F", name: "Silver Futures", category: "Commodities", type: "commodity" },
  { id: "OIL", symbol: "CL=F", name: "Crude Oil WTI", category: "Commodities", type: "commodity" }
];

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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Market Summary
  if (pathname === '/api/market-summary') {
    const now = Date.now();
    if (cache.marketSummary && (now - cache.marketSummaryTime < 15000)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(cache.marketSummary));
      return;
    }

    try {
      const results = [];
      for (const item of CORE_SYMBOLS) {
        try {
          const symEncoded = encodeURIComponent(item.symbol);
          const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symEncoded}?interval=1d&range=5d`;
          const resp = await fetchHttps(apiUrl, 3500);
          const parsed = JSON.parse(resp.data);
          const data = parsed.chart.result[0];
          const meta = data.meta;

          const price = meta.regularMarketPrice || 0;
          const prevClose = meta.chartPreviousClose || meta.previousClose || price;
          const change = price - prevClose;
          const pctChange = prevClose > 0 ? Math.round((change / prevClose) * 10000) / 100 : 0;
          const high = meta.regularMarketDayHigh || price;
          const low = meta.regularMarketDayLow || price;
          const volume = meta.regularMarketVolume || 0;
          const week52High = meta.fiftyTwoWeekHigh || high;
          const week52Low = meta.fiftyTwoWeekLow || low;

          const quotes = (data.indicators.quote[0] && data.indicators.quote[0].close) || [];
          const sparkline = quotes.filter(q => q !== null).map(q => Math.round(q * 100) / 100);

          results.push({
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            category: item.category,
            type: item.type,
            binance: item.binance,
            price: Math.round(price * 100) / 100,
            change: Math.round(change * 100) / 100,
            pctChange,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            week52High: Math.round(week52High * 100) / 100,
            week52Low: Math.round(week52Low * 100) / 100,
            volume,
            prevClose: Math.round(prevClose * 100) / 100,
            sparkline,
            marketState: "LIVE",
            currency: meta.currency,
            timestamp: meta.regularMarketTime,
            status: "LIVE"
          });
        } catch (err) {
          results.push({
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            category: item.category,
            type: item.type,
            price: 0,
            status: "UNAVAILABLE"
          });
        }
      }

      const summaryData = {
        success: true,
        timestamp: new Date().toISOString(),
        data: results
      };
      cache.marketSummary = summaryData;
      cache.marketSummaryTime = now;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(summaryData));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 2. API: Chart Kline/Historical Data (Full Inception Day 1 History)
  if (pathname === '/api/chart') {
    let sym = query.symbol || '^GSPC';
    let interval = query.interval || '1d';
    let range = query.range || '1mo';
    if (range === 'all') range = 'max';

    let symEncoded = encodeURIComponent(sym);
    if (sym === 'VWRA') symEncoded = 'VWRA.L';
    if (/^0+(\d+\.HK)$/i.test(sym)) symEncoded = sym.replace(/^0+/, '');

    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symEncoded}?interval=${interval}&range=${range}`;

    try {
      const resp = await fetchHttps(apiUrl, 9000);
      res.writeHead(resp.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(resp.data);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch chart: ' + e.message }));
    }
    return;
  }

  // 3. API: Live Stream Video ID Resolver (100% Zero Login, Singapore & Global)
  if (pathname === '/api/live-id') {
    const ch = query.channel || 'cna';
    const videoIds = {
      cna: "-PWMxjBgr0k",
      bloomberg: "dp8PhLsUcFE",
      skynews: "9Auq9mYxFEE",
      france24: "h3MuIUNCCzI",
      dwnews: "gCNeDWCI0Q0",
      aljazeera: "bNyUyrR0PHo",
      euronews: "pykpO5kQJ98"
    };

    let resolvedId = videoIds[ch] || "-PWMxjBgr0k";
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ channel: ch, videoId: resolvedId }));
    return;
  }

  // 4. API: Global Ticker Search
  if (pathname === '/api/search') {
    const q = query.q;
    if (!q) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ quotes: [] }));
      return;
    }
    const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    try {
      const resp = await fetchHttps(apiUrl, 5000);
      res.writeHead(resp.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(resp.data);
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ quotes: [] }));
    }
    return;
  }

  // 5. Static File Server
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(path.join(BASE_DIR, reqPath));

  if (!safePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] AlphaTerminal Trading Dashboard running on port ${PORT}`);
    console.log(`[SERVER] Local access: http://localhost:${PORT}`);
    console.log(`[SERVER] Ready for cloud deployment on Render, Vercel, Railway, or local tunnel!`);
  });
}

module.exports = server;
