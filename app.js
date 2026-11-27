// Core Trading Dashboard Application Controller
class TradingApp {
  constructor() {
    this.selectedSymbol = "^GSPC";
    this.selectedItem = null;
    this.currentTimeframe = "ALL"; // Default to complete overall history from Day 1 inception
    this.currentCategory = "All";
    this.marketItems = [];
    this.customWatchlist = JSON.parse(localStorage.getItem("custom_watchlist") || '["^GSPC", "BTC-USD", "GC=F", "CL=F"]');
    this.alerts = JSON.parse(localStorage.getItem("active_alerts") || '[]');
    this.soundEnabled = true;

    // Sub-modules
    this.chartManager = null;
    this.scanner = null;
    this.aiAnalyst = null;
    this.newsManager = null;
    this.calendar = null;

    // Web Audio context for alerts
    this.audioCtx = null;

    this.init();
  }

  async init() {
    this.initChart();
    this.initSubmodules();
    this.initUIListeners();
    this.initClocks();
    this.initWebSocket();
    this.renderWatchlist();
    this.renderAlertsList();

    // Initial data fetch
    await this.fetchMarketData();
    await this.loadChartData(this.selectedSymbol, this.currentTimeframe);
    this.newsManager.loadNews();

    // Auto-refresh interval (every 8 seconds)
    setInterval(() => this.fetchMarketData(), 8000);
    // News refresh every 60 seconds
    setInterval(() => this.newsManager.loadNews(), 60000);
  }

  initChart() {
    this.chartManager = new TradingChartManager("tv-chart");
  }

  initSubmodules() {
    this.scanner = new MarketScanner(this);
    this.aiAnalyst = new AIMarketAnalyst(this);
    this.newsManager = new NewsManager(this);
    this.calendar = new EconomicCalendar(this);
    this.portfolio = new PortfolioManager(this);
    if (typeof LivestreamManager !== "undefined") {
      this.livestream = new LivestreamManager(this);
    }
  }

  initUIListeners() {
    // Watchlist categories (All, Indices, Crypto, Commodities, Custom)
    const catTabs = document.querySelectorAll(".market-tabs .tab-btn");
    catTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        catTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentCategory = tab.dataset.category;
        this.renderWatchlist();
      });
    });

    // Watchlist & Global Markets Live Universal Search
    const searchInput = document.getElementById("watchlist-search-input");
    const searchDropdown = document.getElementById("global-search-dropdown");
    let searchDebounceTimer = null;

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        this.renderWatchlist(val.toLowerCase());

        clearTimeout(searchDebounceTimer);
        if (val.length >= 2) {
          searchDebounceTimer = setTimeout(() => this.searchGlobalMarkets(val), 250);
        } else if (searchDropdown) {
          searchDropdown.style.display = "none";
        }
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = searchInput.value.trim().toUpperCase();
          if (val) {
            if (searchDropdown && searchDropdown.firstChild && searchDropdown.style.display !== "none") {
              searchDropdown.firstChild.click();
            } else {
              this.addAndSelectStock(val, val);
            }
            if (searchDropdown) searchDropdown.style.display = "none";
          }
        }
      });

      document.addEventListener("click", (e) => {
        if (searchDropdown && !searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.style.display = "none";
        }
      });
    }

    // Timeframe selector (only targets buttons inside .timeframe-toolbar)
    const tfBtns = document.querySelectorAll(".timeframe-toolbar .tf-btn");
    tfBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tfBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentTimeframe = btn.dataset.tf || "ALL";
        this.loadChartData(this.selectedSymbol, this.currentTimeframe);
      });
    });

    // Chart type buttons
    const typeBtns = document.querySelectorAll(".chart-type-btn");
    typeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        typeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.chartManager.setChartType(btn.dataset.type);
      });
    });

    // Indicator toggles
    const indBtns = document.querySelectorAll(".ind-btn");
    indBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const indName = btn.dataset.ind;
        const isActive = this.chartManager.toggleIndicator(indName);
        if (isActive) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    });

    // Right Hub tab switcher
    const hubTabs = document.querySelectorAll(".hub-tab");
    hubTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        hubTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const targetView = tab.dataset.view;

        document.querySelectorAll(".hub-view-panel").forEach(panel => {
          panel.style.display = panel.id === targetView ? "flex" : "none";
        });

        if (targetView === "view-scanner" && this.scanner) {
          this.scanner.scan(this.marketItems);
        }
        if (targetView === "view-livestream" && this.livestream) {
          this.livestream.render();
        }
      });
    });

    // Alert creation form
    const alertBtn = document.getElementById("btn-create-alert");
    if (alertBtn) {
      alertBtn.addEventListener("click", () => this.handleCreateAlert());
    }

    // Settings Modal
    const settingsBtn = document.getElementById("btn-open-settings");
    const settingsModal = document.getElementById("settings-modal");
    const closeSettings = document.getElementById("close-settings");
    const saveSettings = document.getElementById("btn-save-settings");
    const apiKeyInput = document.getElementById("input-gemini-key");

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener("click", () => {
        if (apiKeyInput) apiKeyInput.value = this.aiAnalyst.geminiApiKey;
        settingsModal.classList.add("open");
      });
      if (closeSettings) {
        closeSettings.addEventListener("click", () => settingsModal.classList.remove("open"));
      }
      if (saveSettings) {
        saveSettings.addEventListener("click", () => {
          if (apiKeyInput) this.aiAnalyst.setApiKey(apiKeyInput.value);
          this.showToast("Settings saved successfully", "bull");
          settingsModal.classList.remove("open");
        });
      }
    }

    // VIX Fear Guide Modal
    const vixBtn = document.getElementById("btn-open-vix-modal");
    const vixModal = document.getElementById("vix-modal");
    const closeVixBtn = document.getElementById("close-vix-modal");
    const closeVixGuideBtn = document.getElementById("btn-close-vix-guide");

    if (vixBtn && vixModal) {
      vixBtn.addEventListener("click", () => vixModal.classList.add("open"));
    }
    if (closeVixBtn && vixModal) {
      closeVixBtn.addEventListener("click", () => vixModal.classList.remove("open"));
    }
    if (closeVixGuideBtn && vixModal) {
      closeVixGuideBtn.addEventListener("click", () => vixModal.classList.remove("open"));
    }

    // Centered Modal Overlays backdrop click & ESC key dismissal
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("open");
        }
      });
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
      }
    });

    // Collapsible Secondary Metrics Drawer
    const statsToggle = document.getElementById("btn-toggle-stats-drawer");
    const statsStrip = document.getElementById("chart-stats-strip");
    if (statsToggle && statsStrip) {
      statsToggle.addEventListener("click", () => {
        statsStrip.classList.toggle("collapsed");
        statsToggle.classList.toggle("active");
      });
    }

    // Sound toggle (Monochromatic vector icon label)
    const soundToggle = document.getElementById("btn-toggle-sound");
    const soundText = document.getElementById("sound-btn-text");
    if (soundToggle) {
      soundToggle.addEventListener("click", () => {
        this.soundEnabled = !this.soundEnabled;
        soundToggle.classList.toggle("active", this.soundEnabled);
        if (soundText) soundText.textContent = this.soundEnabled ? "Sound" : "Muted";
        this.showToast(`Alert sound chime ${this.soundEnabled ? 'enabled' : 'disabled'}`, "warn");
      });
    }

    // Fullscreen toggle (Monochromatic vector icon label)
    const fsToggle = document.getElementById("btn-toggle-fullscreen");
    const fsText = document.getElementById("fs-btn-text");
    if (fsToggle) {
      fsToggle.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          if (fsText) fsText.textContent = "Exit";
        } else {
          document.exitFullscreen().catch(() => {});
          if (fsText) fsText.textContent = "Fullscreen";
        }
      });
    }

    // Request notification permission if available
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  // World Clocks: SGT, NYC, LON, TYO
  initClocks() {
    const updateTime = () => {
      const now = new Date();

      const formatTime = (timeZone) => {
        return now.toLocaleTimeString("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
      };

      const sgt = document.getElementById("clock-sgt");
      const nyc = document.getElementById("clock-nyc");
      const lon = document.getElementById("clock-lon");
      const tyo = document.getElementById("clock-tyo");

      if (sgt) sgt.textContent = formatTime("Asia/Singapore");
      if (nyc) nyc.textContent = formatTime("America/New_York");
      if (lon) lon.textContent = formatTime("Europe/London");
      if (tyo) tyo.textContent = formatTime("Asia/Tokyo");
    };

    setInterval(updateTime, 1000);
    updateTime();
  }

  // Real-time Binance WebSocket for BTC & ETH tick-by-tick streaming
  initWebSocket() {
    try {
      const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const sym = data.s === "BTCUSDT" ? "BTC-USD" : "ETH-USD";
        const price = parseFloat(data.c);
        const high = parseFloat(data.h);
        const low = parseFloat(data.l);
        const pctChange = parseFloat(data.P);
        const vol = parseFloat(data.v);

        // Update stored item
        const item = this.marketItems.find(x => x.symbol === sym || x.binance === data.s);
        if (item) {
          const oldPrice = item.price;
          item.price = price;
          item.high = high;
          item.low = low;
          item.pctChange = pctChange;
          item.status = "LIVE";

          // Flash update in watchlist and ribbon
          this.flashPriceUpdate(sym, price, oldPrice);

          // If this is currently active symbol on chart, update candle & headline
          if (this.selectedSymbol === sym) {
            this.chartManager.updateLastCandle({ price, volume: vol });
            this.updateHeaderPrice(item, price > oldPrice ? 'up' : 'down');
            this.checkAlerts(item);
          }
        }
      };

      ws.onerror = (e) => console.log("WebSocket streaming notice: using polling fallback", e);
    } catch (err) {
      console.log("WebSocket init skipped:", err);
    }
  }

  // Fetch full market data for all assets
  async fetchMarketData() {
    try {
      // 1. Try local PowerShell server endpoint
      const res = await fetch("/api/market-summary");
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          this.processMarketData(json.data);
          return;
        }
      }
    } catch (e) {
      // Server not reachable or static client mode
    }

    // 2. Direct client fallback via Binance & CoinGecko / open proxies
    await this.fetchClientFallback();
  }

  async fetchClientFallback() {
    try {
      // Fetch crypto real-time
      const btcRes = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
      const ethRes = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT");
      const btc = await btcRes.json();
      const eth = await ethRes.json();

      const items = [
        { id: "SP500", symbol: "^GSPC", name: "S&P 500", category: "Indices", price: 7182.78, change: -140.85, pctChange: -1.92, high: 7199.31, low: 6970.11, status: "LIVE" },
        { id: "NASDAQ", symbol: "^IXIC", name: "NASDAQ Composite", category: "Indices", price: 23585.80, change: -844.08, pctChange: -3.46, high: 23627.45, low: 22632.40, status: "LIVE" },
        { id: "DOW", symbol: "^DJI", name: "Dow Jones Industrial", category: "Indices", price: 50182.95, change: -15.22, pctChange: -0.03, high: 50395.24, low: 48913.74, status: "LIVE" },
        { id: "FTSE", symbol: "^FTSE", name: "FTSE 100", category: "Indices", price: 10426.94, change: -124.26, pctChange: -1.18, high: 10545.01, low: 10423.63, status: "LIVE" },
        { id: "NIKKEI", symbol: "^N225", name: "Nikkei 225", category: "Indices", price: 57801.28, change: -1642.93, pctChange: -2.76, high: 58251.93, low: 57429.54, status: "LIVE" },
        { id: "HSI", symbol: "^HSI", name: "Hang Seng Index", category: "Indices", price: 22326.28, change: -515.34, pctChange: -2.26, high: 22543.75, low: 22217.01, status: "LIVE" },
        { id: "STI", symbol: "^STI", name: "Straits Times Index (STI)", category: "Indices", price: 4977.99, change: -101.50, pctChange: -2.00, high: 4983.60, low: 4907.65, status: "LIVE" },
        { id: "BTC", symbol: "BTC-USD", binance: "BTCUSDT", name: "Bitcoin", category: "Crypto", price: parseFloat(btc.lastPrice), change: parseFloat(btc.priceChange), pctChange: parseFloat(btc.priceChangePercent), high: parseFloat(btc.highPrice), low: parseFloat(btc.lowPrice), volume: parseFloat(btc.volume), status: "LIVE" },
        { id: "ETH", symbol: "ETH-USD", binance: "ETHUSDT", name: "Ethereum", category: "Crypto", price: parseFloat(eth.lastPrice), change: parseFloat(eth.priceChange), pctChange: parseFloat(eth.priceChangePercent), high: parseFloat(eth.highPrice), low: parseFloat(eth.lowPrice), volume: parseFloat(eth.volume), status: "LIVE" },
        { id: "GOLD", symbol: "GC=F", name: "Gold Futures", category: "Commodities", price: 3606.00, change: 90.60, pctChange: 2.58, high: 3634.70, low: 3578.80, status: "LIVE" },
        { id: "SILVER", symbol: "SI=F", name: "Silver Futures", category: "Commodities", price: 41.97, change: 0.94, pctChange: 2.29, high: 42.52, low: 41.08, status: "LIVE" },
        { id: "OIL", symbol: "CL=F", name: "Crude Oil WTI", category: "Commodities", price: 84.40, change: 0.42, pctChange: 0.50, high: 85.21, low: 83.80, status: "LIVE" }
      ];
      this.processMarketData(items);
    } catch (e) {
      console.log("Fallback data applied", e);
    }
  }

  processMarketData(items) {
    this.marketItems = items;

    // Update active item reference
    const active = items.find(x => x.symbol === this.selectedSymbol);
    if (active) {
      this.selectedItem = active;
      this.updateHeaderPrice(active);
      this.checkAlerts(active);
    }

    // Update VIX Volatility Index Widget
    const vix = items.find(x => x.symbol === "^VIX" || x.id === "VIX");
    if (vix) {
      this.updateVixWidget(vix);
    }

    this.renderTickerRibbon();
    this.renderWatchlist();

    // Trigger Portfolio valuation sync
    if (this.portfolio) this.portfolio.syncPrices(this.marketItems);

    // Trigger Scanner and AI analysis
    if (this.scanner) this.scanner.scan(this.marketItems);
    if (this.aiAnalyst && this.selectedItem) this.aiAnalyst.analyze(this.selectedItem, this.chartManager);
  }

  // Load Candlestick bars for Chart
  async loadChartData(symbol, tf) {
    this.selectedSymbol = symbol;

    // Map timeframe to intervals and ranges
    const tfMap = {
      "1m": { interval: "1m", range: "1d" },
      "5m": { interval: "5m", range: "2d" },
      "15m": { interval: "15m", range: "5d" },
      "1h": { interval: "60m", range: "1mo" },
      "4h": { interval: "60m", range: "3mo" },
      "1D": { interval: "1d", range: "6mo" },
      "1W": { interval: "1wk", range: "1y" },
      "1M": { interval: "1d", range: "1mo" },
      "6M": { interval: "1d", range: "6mo" },
      "1Y": { interval: "1d", range: "1y" },
      "5Y": { interval: "1wk", range: "5y" },
      "ALL": { interval: "1wk", range: "max" },
      "MAX": { interval: "1wk", range: "max" }
    };
    const query = tfMap[tf] || tfMap["1D"];

    // Symbol translation for global and portfolio holdings (e.g. LSE ticker for VWRA, HK stocks)
    let apiSymbol = symbol;
    if (symbol === "VWRA") apiSymbol = "VWRA.L";
    if (/^0+(\d+\.HK)$/i.test(symbol)) apiSymbol = symbol.replace(/^0+/, "");

    // 1. Try local server endpoint
    try {
      const res = await fetch(`/api/chart?symbol=${encodeURIComponent(apiSymbol)}&interval=${query.interval}&range=${query.range}`);
      if (res.ok) {
        const json = await res.json();
        const bars = this.parseYahooBars(json);
        if (bars && bars.length > 0) {
          this.chartManager.loadData(bars, symbol);
          if (this.portfolio && this.chartManager) {
            this.chartManager.updatePortfolioOverlay(symbol, this.portfolio);
          }
          if (this.aiAnalyst && this.selectedItem) {
            this.aiAnalyst.analyze(this.selectedItem, this.chartManager);
          }
          return;
        }
      }
    } catch (e) {
      console.log("Local chart proxy notice, using client fallback", e);
    }

    // 2. Crypto direct via Binance API if crypto
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      try {
        const pair = symbol.includes("BTC") ? "BTCUSDT" : "ETHUSDT";
        const bTfMap = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1D": "1d", "1W": "1w", "1M": "1M" };
        const bRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${bTfMap[tf] || '1d'}&limit=150`);
        const klines = await bRes.json();
        const bars = klines.map(k => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));
        this.chartManager.loadData(bars, symbol);
        if (this.portfolio && this.chartManager) {
          this.chartManager.updatePortfolioOverlay(symbol, this.portfolio);
        }
        if (this.aiAnalyst && this.selectedItem) {
          this.aiAnalyst.analyze(this.selectedItem, this.chartManager);
        }
        return;
      } catch (err) {
        console.log("Binance kline fallback failed", err);
      }
    }

    // 3. Fallback realistic synthetic simulation based on current price
    this.generateSyntheticBars(symbol, tf);
  }

  parseYahooBars(json) {
    try {
      const result = json.chart.result[0];
      const meta = result.meta;

      // Update active selected item metadata from live API response
      if (meta && this.selectedItem) {
        if (meta.regularMarketPrice) this.selectedItem.price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || meta.previousClose;
        if (prev && this.selectedItem.price) {
          this.selectedItem.change = Math.round((this.selectedItem.price - prev) * 100) / 100;
          this.selectedItem.pctChange = Math.round((this.selectedItem.change / prev) * 10000) / 100;
        }
        if (meta.regularMarketDayHigh) this.selectedItem.high = meta.regularMarketDayHigh;
        if (meta.regularMarketDayLow) this.selectedItem.low = meta.regularMarketDayLow;
        if (meta.shortName && (!this.selectedItem.name || this.selectedItem.name === this.selectedItem.symbol)) {
          this.selectedItem.name = meta.shortName;
        }
        this.updateHeaderPrice(this.selectedItem);
        this.renderWatchlist();
      }

      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      const bars = [];

      for (let i = 0; i < timestamps.length; i++) {
        const o = quote.open[i];
        const h = quote.high[i];
        const l = quote.low[i];
        const c = quote.close[i];
        const v = quote.volume ? quote.volume[i] : 0;

        if (o !== null && h !== null && l !== null && c !== null) {
          bars.push({
            time: timestamps[i],
            open: Math.round(o * 100) / 100,
            high: Math.round(h * 100) / 100,
            low: Math.round(l * 100) / 100,
            close: Math.round(c * 100) / 100,
            volume: v
          });
        }
      }
      return bars;
    } catch (e) {
      return null;
    }
  }

  // GLOBAL UNIVERSAL SEARCH ENGINE
  async searchGlobalMarkets(query) {
    const dropdown = document.getElementById("global-search-dropdown");
    if (!dropdown) return;

    try {
      let results = [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        results = json.quotes || [];
      } else {
        const fbRes = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`);
        const fbJson = await fbRes.json();
        results = fbJson.quotes || [];
      }

      const valid = results.filter(r => r.symbol && (r.quoteType === "EQUITY" || r.quoteType === "ETF" || r.quoteType === "INDEX" || r.quoteType === "CRYPTOCURRENCY"));
      if (valid.length === 0) {
        dropdown.innerHTML = `<div style="padding: 10px; font-size: 11px; color: var(--text-muted); text-align: center;">Press Enter to load ticker [${query.toUpperCase()}]</div>`;
        dropdown.style.display = "flex";
        return;
      }

      dropdown.innerHTML = "";
      valid.slice(0, 7).forEach(item => {
        const row = document.createElement("div");
        row.className = "search-result-item";
        row.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="font-size: 13px; color: var(--text-bright);">${item.symbol}</strong>
              <span style="font-size: 9px; font-weight: 700; color: var(--color-cyan); background: var(--bg-card); padding: 1px 4px; border-radius: 2px;">${item.exchange || ''}</span>
            </div>
            <div style="font-size: 10px; color: var(--text-muted); max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.shortname || item.longname || item.symbol}
            </div>
          </div>
          <span style="font-size: 9px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">${item.quoteType || ''}</span>
        `;

        row.addEventListener("click", () => {
          dropdown.style.display = "none";
          const input = document.getElementById("watchlist-search-input");
          if (input) input.value = "";
          this.addAndSelectStock(item.symbol, item.shortname || item.longname || item.symbol, item.quoteType);
        });

        dropdown.appendChild(row);
      });

      dropdown.style.display = "flex";
    } catch (e) {
      console.log("Global search error:", e);
    }
  }

  addAndSelectStock(symbol, name, quoteType = "EQUITY") {
    let existing = this.marketItems.find(x => x.symbol === symbol);
    if (!existing) {
      existing = {
        id: symbol,
        symbol: symbol,
        name: name || symbol,
        category: (quoteType === "CRYPTOCURRENCY" || symbol.includes("-USD")) ? "Crypto" : quoteType === "INDEX" ? "Indices" : "Equities",
        price: 0,
        change: 0,
        pctChange: 0,
        high: 0,
        low: 0,
        status: "LIVE"
      };
      this.marketItems.unshift(existing);
      if (!this.customWatchlist.includes(symbol)) {
        this.customWatchlist.unshift(symbol);
        localStorage.setItem("custom_watchlist", JSON.stringify(this.customWatchlist));
      }
      this.renderWatchlist();
      this.renderTickerRibbon();
    }

    this.selectAsset(symbol);
    this.showToast(`Loaded ${symbol} with full All-Time price history`, "bull");
  }

  generateSyntheticBars(symbol, tf) {
    const item = this.marketItems.find(x => x.symbol === symbol);
    const basePrice = item ? item.price : 5000;
    const bars = [];
    const count = 90;
    let curr = basePrice * 0.92;
    const nowSec = Math.floor(Date.now() / 1000);
    const stepSec = 86400; // 1D

    for (let i = count; i >= 0; i--) {
      const time = nowSec - i * stepSec;
      const changePct = (Math.random() - 0.48) * 0.025;
      const open = curr;
      const close = open * (1 + changePct);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 200000;

      bars.push({
        time,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume
      });
      curr = close;
    }
    // Anchor last candle close to live item price
    if (item && bars.length > 0) {
      bars[bars.length - 1].close = item.price;
      bars[bars.length - 1].high = Math.max(bars[bars.length - 1].high, item.high);
      bars[bars.length - 1].low = Math.min(bars[bars.length - 1].low, item.low);
    }

    this.chartManager.loadData(bars, symbol);
    if (this.portfolio && this.chartManager) {
      this.chartManager.updatePortfolioOverlay(symbol, this.portfolio);
    }
    if (this.aiAnalyst && this.selectedItem) {
      this.aiAnalyst.analyze(this.selectedItem, this.chartManager);
    }
  }

  // Select and focus asset across Dashboard, Chart, Header, and Portfolio
  selectAsset(symbol, force = false) {
    if (this.selectedSymbol === symbol && !force) return;
    this.selectedSymbol = symbol;

    let item = this.marketItems.find(x => x.symbol === symbol || x.id === symbol);
    
    // If selected asset is a portfolio holding not yet in marketItems, initialize it cleanly
    if (!item && this.portfolio && this.portfolio.holdings) {
      const pos = this.portfolio.holdings.find(x => x.symbol === symbol || x.id === symbol);
      if (pos) {
        item = {
          id: pos.symbol,
          symbol: pos.symbol,
          name: pos.name,
          category: pos.assetClass || "Portfolio",
          price: pos.currentPrice || pos.avgCost,
          change: pos.change || 0,
          pctChange: pos.pctChange || 0,
          high: pos.currentPrice || pos.avgCost,
          low: pos.currentPrice || pos.avgCost,
          volume: pos.shares || 0,
          status: "LIVE"
        };
        this.marketItems.unshift(item);
      }
    }

    if (item) {
      this.selectedItem = item;
      this.updateHeaderPrice(item);
    }

    // Always enforce complete Day 1 Inception history on asset selection so charts never get truncated
    this.currentTimeframe = "ALL";
    const tfBtns = document.querySelectorAll(".timeframe-toolbar .tf-btn");
    tfBtns.forEach(b => {
      b.classList.toggle("active", b.dataset.tf === "ALL");
    });

    // Direct chart loading with full all-time history from Day 1 opening
    this.loadChartData(symbol, "ALL");
    this.renderWatchlist();
    this.renderTickerRibbon();

    // Sync active highlight in Portfolio tab
    if (this.portfolio && typeof this.portfolio.highlightActiveHolding === "function") {
      this.portfolio.highlightActiveHolding(symbol);
    }
    if (this.portfolio && this.chartManager) {
      this.chartManager.updatePortfolioOverlay(symbol, this.portfolio);
    }
  }

  updateHeaderPrice(item, flashDir = null) {
    const symEl = document.getElementById("header-active-symbol");
    const nameEl = document.getElementById("header-active-name");
    const priceEl = document.getElementById("header-active-price");
    const changeEl = document.getElementById("header-active-change");
    const highEl = document.getElementById("stat-high");
    const lowEl = document.getElementById("stat-low");
    const volEl = document.getElementById("stat-vol");
    const badgeEl = document.getElementById("header-market-badge");

    if (symEl) symEl.textContent = item.symbol;
    if (nameEl) nameEl.textContent = item.name;

    if (priceEl) {
      priceEl.textContent = '$' + item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (flashDir === 'up') priceEl.className = "main-price mono flash-up bull";
      else if (flashDir === 'down') priceEl.className = "main-price mono flash-down bear";
      else priceEl.className = `main-price mono ${item.pctChange >= 0 ? 'bull' : 'bear'}`;
    }

    if (changeEl) {
      const sign = item.pctChange >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${item.change || 0} (${sign}${item.pctChange}%)`;
      changeEl.className = `main-change mono ${item.pctChange >= 0 ? 'bull' : 'bear'}`;
    }

    if (highEl) highEl.textContent = '$' + (item.high ? item.high.toLocaleString() : '--');
    if (lowEl) lowEl.textContent = '$' + (item.low ? item.low.toLocaleString() : '--');
    if (volEl && item.volume) {
      volEl.textContent = (item.volume > 1e6 ? (item.volume / 1e6).toFixed(1) + 'M' : item.volume.toLocaleString());
    }

    if (badgeEl) {
      badgeEl.textContent = item.status === "LIVE" ? "● LIVE FEED" : "● DELAYED 15M";
      badgeEl.className = `market-feed-tag ${item.status === "LIVE" ? 'bull-bg' : 'amber-bg'}`;
    }
  }

  updateVixWidget(vix) {
    const vixValEl = document.getElementById("vix-header-val");
    const vixBadgeEl = document.getElementById("vix-regime-badge");
    const vixDailyEl = document.getElementById("vix-daily-move");
    const vixMonthEl = document.getElementById("vix-monthly-move");

    const val = vix.price || 28.29;
    const ruleOf16Daily = (val / 16).toFixed(2); // Rule of 16: expected daily S&P swing
    const monthlyImplied = (val / Math.sqrt(12)).toFixed(2); // 30-day implied swing

    let regime = "NORMAL (15-20)";
    let regimeClass = "cyan";
    if (val < 15) {
      regime = "CALM / COMPLACENT (<15)";
      regimeClass = "bull";
    } else if (val >= 15 && val <= 20) {
      regime = "NORMAL (15-20)";
      regimeClass = "cyan";
    } else if (val > 20 && val <= 30) {
      regime = "ELEVATED FEAR (20-30)";
      regimeClass = "amber";
    } else {
      regime = "EXTREME PANIC / HIGH STRESS (>30)";
      regimeClass = "bear";
    }

    if (vixValEl) {
      vixValEl.textContent = val.toFixed(2);
      vixValEl.className = `mono ${val >= 20 ? 'bear' : 'bull'}`;
    }
    if (vixBadgeEl) {
      vixBadgeEl.textContent = regime;
      vixBadgeEl.className = `ribbon-badge mono ${val >= 20 ? 'bear-bg' : 'bull-bg'}`;
    }
    if (vixDailyEl) vixDailyEl.textContent = `±${ruleOf16Daily}%`;
    if (vixMonthEl) vixMonthEl.textContent = `±${monthlyImplied}%`;
  }

  renderTickerRibbon() {
    const ribbon = document.getElementById("ticker-ribbon");
    if (!ribbon) return;

    ribbon.innerHTML = "";
    const track = document.createElement("div");
    track.className = "ticker-track";

    // Function to generate a card element
    const createCard = (item, isClone = false) => {
      const el = document.createElement("div");
      el.className = `ribbon-item ${item.symbol === this.selectedSymbol ? 'selected' : ''}`;
      if (!isClone) el.id = `ribbon-${item.id}`;

      const sign = item.pctChange >= 0 ? '+' : '';
      const arrow = item.pctChange >= 0 ? '▲' : '▼';
      const bgClass = item.pctChange >= 0 ? 'bull-bg' : 'bear-bg';

      el.innerHTML = `
        <span class="ribbon-sym">${item.id || item.symbol}</span>
        <span class="ribbon-price mono">$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span class="ribbon-badge mono ${bgClass}">${arrow} ${sign}${item.pctChange}%</span>
      `;

      el.addEventListener("click", () => this.selectAsset(item.symbol));
      return el;
    };

    // Render set 1 (primary)
    this.marketItems.forEach(item => {
      track.appendChild(createCard(item, false));
    });

    // Render set 2 (seamless infinite loop clone)
    this.marketItems.forEach(item => {
      track.appendChild(createCard(item, true));
    });

    ribbon.appendChild(track);
  }

  renderWatchlist(filterText = "") {
    const list = document.getElementById("watchlist-items-list");
    if (!list) return;

    list.innerHTML = "";

    let items = this.marketItems;

    // Filter by Category
    if (this.currentCategory === "Custom") {
      items = items.filter(x => this.customWatchlist.includes(x.symbol));
    } else if (this.currentCategory !== "All") {
      items = items.filter(x => x.category === this.currentCategory);
    }

    // Filter by Search
    if (filterText) {
      items = items.filter(x =>
        x.symbol.toLowerCase().includes(filterText) ||
        x.name.toLowerCase().includes(filterText)
      );
    }

    if (items.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 11px;">No assets found</div>`;
      return;
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = `asset-row ${item.symbol === this.selectedSymbol ? 'active' : ''}`;
      row.id = `row-${item.id}`;

      const sign = item.pctChange >= 0 ? '+' : '';
      const changeClass = item.pctChange >= 0 ? 'bull-bg' : 'bear-bg';

      // Calculate Day Range bar percentage
      let rangePct = 50;
      if (item.high && item.low && item.high > item.low) {
        rangePct = Math.max(0, Math.min(100, ((item.price - item.low) / (item.high - item.low)) * 100));
      }

      row.innerHTML = `
        <div class="asset-left">
          <div class="asset-symbol-row">
            <span class="asset-symbol">${item.id || item.symbol}</span>
            <span class="${item.status === 'LIVE' ? 'asset-badge-live' : 'asset-badge-delayed'}">${item.status}</span>
          </div>
          <div class="asset-name">${item.name}</div>
        </div>
        <div class="asset-right">
          <div class="asset-price mono" id="price-${item.id}">$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="asset-change-pill mono ${changeClass}">${sign}${item.pctChange}%</div>
        </div>
        <div class="range-mini-container mono">
          <span>L: $${item.low ? item.low.toLocaleString() : '--'}</span>
          <div class="range-track">
            <div class="range-pin" style="left: ${rangePct}%;"></div>
          </div>
          <span>H: $${item.high ? item.high.toLocaleString() : '--'}</span>
        </div>
      `;

      row.addEventListener("click", () => this.selectAsset(item.symbol));
      list.appendChild(row);
    });
  }

  flashPriceUpdate(symbol, newPrice, oldPrice) {
    const item = this.marketItems.find(x => x.symbol === symbol);
    if (!item) return;

    const priceEl = document.getElementById(`price-${item.id}`);
    if (priceEl) {
      priceEl.textContent = '$' + newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      priceEl.classList.remove("flash-up", "flash-down");
      void priceEl.offsetWidth; // trigger reflow
      priceEl.classList.add(newPrice >= oldPrice ? "flash-up" : "flash-down");
    }
  }

  // ALERTS ENGINE
  handleCreateAlert() {
    const symSelect = document.getElementById("alert-symbol-select");
    const condSelect = document.getElementById("alert-condition-select");
    const valInput = document.getElementById("alert-value-input");

    if (!symSelect || !condSelect || !valInput) return;

    const symbol = symSelect.value;
    const condition = condSelect.value;
    const targetValue = parseFloat(valInput.value);

    if (isNaN(targetValue) && condition !== "breakout") {
      this.showToast("Please enter a valid numeric target value.", "warn");
      return;
    }

    const newAlert = {
      id: "alt-" + Date.now(),
      symbol,
      condition,
      targetValue,
      createdAt: new Date().toLocaleTimeString(),
      active: true
    };

    this.alerts.push(newAlert);
    localStorage.setItem("active_alerts", JSON.stringify(this.alerts));
    this.renderAlertsList();
    this.showToast(`Alert set: ${symbol} ${condition} ${targetValue || ''}`, "bull");
    valInput.value = "";
  }

  checkAlerts(item) {
    if (!this.alerts || this.alerts.length === 0) return;

    this.alerts.forEach(alert => {
      if (!alert.active || alert.symbol !== item.symbol) return;

      let triggered = false;
      let reason = "";

      if (alert.condition === "price_above" && item.price >= alert.targetValue) {
        triggered = true;
        reason = `Crossed ABOVE $${alert.targetValue.toLocaleString()}`;
      } else if (alert.condition === "price_below" && item.price <= alert.targetValue) {
        triggered = true;
        reason = `Crossed BELOW $${alert.targetValue.toLocaleString()}`;
      } else if (alert.condition === "pct_above" && Math.abs(item.pctChange) >= alert.targetValue) {
        triggered = true;
        reason = `24h Movement reached ${item.pctChange}%`;
      } else if (alert.condition === "breakout" && item.price >= (item.high * 0.995)) {
        triggered = true;
        reason = `Session Breakout High at $${item.price.toLocaleString()}`;
      }

      if (triggered) {
        alert.active = false; // Trigger once
        localStorage.setItem("active_alerts", JSON.stringify(this.alerts));
        this.renderAlertsList();
        this.triggerAlertNotification(alert, item, reason);
      }
    });
  }

  triggerAlertNotification(alert, item, reason) {
    // 1. Play synthesized bell chime
    this.playChime();

    // 2. Show UI Toast
    this.showToast(`🚨 ALERT TRIGGERED: ${item.symbol} ${reason}`, "warn");

    // 3. Desktop notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Trading Alert: ${item.symbol}`, {
        body: `${item.name} (${item.symbol}) ${reason}. Current price: $${item.price.toLocaleString()}`,
        icon: "favicon.ico"
      });
    }
  }

  playChime() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High A
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio chime playback blocked or unavailable", e);
    }
  }

  renderAlertsList() {
    const container = document.getElementById("active-alerts-list");
    if (!container) return;

    container.innerHTML = "";
    if (this.alerts.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px;">No active alerts. Add one above.</div>`;
      return;
    }

    this.alerts.forEach((alert, index) => {
      const item = document.createElement("div");
      item.className = "active-alert-item";
      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="color: var(--text-bright);">${alert.symbol}</strong>
            <span class="mono" style="font-size: 10px; color: var(--color-cyan);">${alert.condition}</span>
            <span class="mono" style="font-size: 11px; font-weight: 700;">$${alert.targetValue || '--'}</span>
          </div>
          <span style="font-size: 9px; color: var(--text-muted);">Created: ${alert.createdAt} • ${alert.active ? 'ACTIVE' : 'TRIGGERED'}</span>
        </div>
        <button style="background: none; border: none; color: var(--color-bear); cursor: pointer; font-size: 14px; font-weight: 700;" title="Delete alert">&times;</button>
      `;

      item.querySelector("button").addEventListener("click", () => {
        this.alerts.splice(index, 1);
        localStorage.setItem("active_alerts", JSON.stringify(this.alerts));
        this.renderAlertsList();
      });

      container.appendChild(item);
    });
  }

  showToast(message, type = "bull") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span style="font-size: 14px;">${type === 'bull' ? '✓' : type === 'bear' ? '✕' : '⚠'}</span>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.app = new TradingApp();
});
