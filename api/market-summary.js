const https = require('https');
const url = require('url');

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

function fetchHttps(targetUrl, timeoutMs = 4000) {
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

  try {
    const results = [];
    for (const item of CORE_SYMBOLS) {
      try {
        const symEncoded = encodeURIComponent(item.symbol);
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symEncoded}?interval=1d&range=5d`;
        const resp = await fetchHttps(apiUrl, 3000);
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

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString(), data: results }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};

