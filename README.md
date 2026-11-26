# AlphaTerminal Pro - AI-Powered Global Trading Dashboard

A professional, high-performance financial market terminal inspired by **Bloomberg Terminal** and **TradingView**, designed for real-time global market monitoring, algorithmic technical screening, and intelligent macroeconomic analysis.

---

## 🚀 Key Features

### 1. Global Market Overview
- **Real-Time Asset Coverage**:
  - **Global Indices**: S&P 500 (`^GSPC`), NASDAQ (`^IXIC`), Dow Jones Industrial (`^DJI`), FTSE 100 (`^FTSE`), Nikkei 225 (`^N225`), Hang Seng Index (`^HSI`), Singapore Straits Times Index (`^STI`).
  - **Cryptocurrencies**: Bitcoin (`BTC-USD`), Ethereum (`ETH-USD`).
  - **Commodities**: Gold Futures (`GC=F`), Silver Futures (`SI=F`), Crude Oil WTI (`CL=F`).
- **Live Metrics**: Real-time prices, 24-hour dollar change and percentage change, session high and low range bar, 24-hour trading turnover.
- **Data Status Indicators**: Clear badges indicating `● LIVE FEED` (with real-time WebSocket tick flashes) or `● DELAYED 15M`.

### 2. Interactive Trading Charts (TradingView Engine)
- Powered by **TradingView Lightweight Charts** with responsive dark-theme styling.
- **Timeframes**: `1m`, `5m`, `15m`, `1h`, `4h`, `1D`, `1W`, `1M`.
- **Chart Styles**: Candlestick, Line, and Area.
- **Integrated Technical Indicators**:
  - **EMA 20** (Cyan, short-term momentum)
  - **EMA 50** (Amber, intermediate trend)
  - **EMA 200** (Purple, institutional macro baseline)
  - **Bollinger Bands** (20-period, 2.0 standard deviations with upper, middle, and lower bands)
  - **Volume Histogram** (dynamically colored by candle direction)
  - **RSI Sub-pane** (14-period Relative Strength Index with 70 overbought and 30 oversold dashed boundaries)
  - **MACD Sub-pane** (12/26/9 Moving Average Convergence Divergence with signal line and color-coded zero-line histogram)
  - Real-time crosshair with Open, High, Low, Close, Volume legend overlay.

### 3. Real-Time Market Scanner
- Automatically scans order books and technical configurations across all tracked assets:
  - **Biggest Gainers & Losers**: Ranked sorting with percentage delta badges.
  - **Breakout Detection**: Identifies assets trading within 0.3% of their 24h / 20-day resistance high or piercing upper Bollinger Bands.
  - **Breakdown Warnings**: Detects assets violating baseline support or lower Bollinger Bands.
  - **Unusual Volume Alerts**: Flags assets experiencing institutional volume spikes (> 1.5x average).
  - **Momentum Shifts**: Identifies MACD bullish/bearish crossovers and RSI oversold bounces.
  - **One-Click Chart Focus**: Clicking any opportunity card instantly loads that asset on the chart and refreshes the AI analyst.

### 4. AI Market Analyst & Sentiment Engine
- **Fear & Greed Market Sentiment Meter**: 0-100 real-time score calculated from price momentum, market breadth, and multi-timeframe RSI.
- **Market Regime Classification**: Identifies structural postures (e.g. *Strong Bullish Expansion*, *Consolidation Range*, *Corrective Retracement*, *Bearish Impulse*).
- **Key Support & Resistance Levels**: Fibonacci retracements (38.2%, 50.0%, 61.8%) and 60-bar pivot highs and lows (R2, R1, S1, S2).
- **Plain-Language Explanations**:
  - *What Happened*: Executive breakdown of recent session moves.
  - *Why It Moved*: Macro drivers, order-book liquidity, and technical catalysts.
  - *Key Levels to Watch*: Breakout triggers and invalidation stop levels.
- **Interactive AI Analyst**:
  - Ask questions about trend direction, entry zones, or Federal Reserve policy impact.
  - Includes full optional **Google Gemini API Key** integration in Settings for live LLM queries, with a built-in high-precision quantitative financial analysis engine that works out of the box with zero setup.

### 5. Live Financial News & Market Impact
- Breaking financial news parsed from live CNBC and Bloomberg wire feeds.
- **AI Market Impact Badges**: Automatically categorizes headlines with `BULLISH CATALYST`, `BEARISH HEADWIND`, or `VOLATILITY ALERT`.
- **One-Sentence AI Summaries**: Explains why the news matters for traders and cross-asset allocations.
- Filter by category: *All*, *Markets*, *Fed & Rates*, *Commodities*, *Crypto*.

### 6. Economic Calendar (Singapore SGT Time UTC+8)
- High-impact global macroeconomic releases: FOMC Rate Decisions, US Non-Farm Payrolls (NFP), US Core PCE / CPI, Singapore Core CPI & GDP, ECB Rate Decisions, Bank of Japan policy, China Manufacturing PMI.
- **Prominent Singapore Time (SGT UTC+8)**: Formatted in local Singapore time with exact dates and 24-hour clock.
- Shows **Actual**, **Forecast**, and **Previous** benchmark numbers.
- **Live Event Countdown**: Displays a real-time countdown clock to the next high-impact release.

### 7. Custom Watchlist & Sound Alerts
- Filter watchlist by *All*, *Indices*, *Crypto*, *Commodities*, or custom starred assets.
- Real-time search across symbols and asset names.
- **Alert Triggers**:
  - Price Crosses Above Target
  - Price Crosses Below Target
  - 24h Movement % Exceeds Threshold
  - Session High Breakout
- **Multi-Channel Notifications**:
  - In-app floating toast notification stack.
  - Synthesized trading bell chime via **Web Audio API** (no audio files required).
  - Web Notification API desktop alerts.

---

## 🏃 Quick Start

### Option A: One-Click Windows Launcher
Double-click `start.bat` in the project directory. This starts the background server on port 3000 and automatically opens your browser to `http://localhost:3000`.

### Option B: Accessing Online & Sharing Globally
To access your dashboard from your smartphone, iPad, or any remote computer outside your home network:

1. **Instant 1-Click Secure HTTPS Tunnel**:
   - Double-click `share-online.bat`.
   - It automatically generates a secure, encrypted public HTTPS link (e.g. `https://xxxx.trycloudflare.com`).
   - Open that URL on your phone or tablet anywhere in the world! Zero account, signup, or router port-forwarding required.

2. **Access via Local Wi-Fi (Same Network)**:
   - Make sure your PC is on, then open `http://10.122.1.5:3000` from your phone or tablet connected to the same Wi-Fi.

3. **24/7 Permanent Cloud Deployment (PC can be turned off)**:
   - The repository includes a production-ready, zero-dependency Node.js backend: [server.js](file:///c:/Users/zhixu/Trading%20Dashboard/server.js) and [package.json](file:///c:/Users/zhixu/Trading%20Dashboard/package.json).
   - Push this folder to a GitHub repository.
   - Go to [Render.com](https://render.com) or [Vercel](https://vercel.com) and create a **Free Web Service**.
   - Build Command: (leave empty or `npm install`), Start Command: `node server.js`.
   - You get a free permanent URL (e.g. `https://my-trading-dashboard.onrender.com`) running 24/7 with zero cost!

### Option C: Direct File Mode
You can also open [index.html](file:///c:/Users/zhixu/Trading%20Dashboard/index.html) directly in any modern browser (Chrome, Edge, Firefox, Brave). In standalone mode, the app connects directly to Binance real-time WebSockets and client-side market endpoints!

---

## 📁 File Structure

```text
Trading Dashboard/
├── index.html                 # Bloomberg Terminal & TradingView inspired layout
├── styles.css                 # Dark theme design system (obsidian, neon bull green, vibrant bear red)
├── app.js                     # Central application controller, WebSocket feeds, and alert engine
├── chart.js                   # Lightweight Charts engine, indicator math (EMA, BB, RSI, MACD)
├── portfolio.js               # Holdings matrix, auto chart redirect & daily macro directives
├── livestream.js              # World Monitor 24/7 Satellite TV (CNA Singapore, Bloomberg, Sky News)
├── scanner.js                 # Real-time breakout, volume, and momentum scanner
├── ai-analyst.js              # Quantitative sentiment score, key levels, and AI reasoning
├── news.js                    # Live financial news feed and AI impact analysis
├── calendar.js                # Economic calendar with Singapore SGT time and countdown
├── server.ps1                 # High-performance PowerShell HTTP server & market data proxy
├── server.js                  # Cross-platform Node.js backend for Render/Vercel/Railway cloud hosting
├── package.json               # Cloud deployment manifest
├── start.bat                  # One-click Windows launch script
├── share-online.bat           # One-click instant secure HTTPS public tunnel
├── share-online.ps1           # Tunnel engine supporting Cloudflare & OpenSSH
├── lightweight-charts.standalone.js # Bundled TradingView Lightweight Charts library
└── README.md                  # Documentation and user guide
```
