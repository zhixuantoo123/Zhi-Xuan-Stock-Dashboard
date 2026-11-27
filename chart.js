// TradingView Lightweight Charts & Technical Analysis Engine
class TradingChartManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
    this.candleSeries = null;
    this.lineSeries = null;
    this.areaSeries = null;
    this.volumeSeries = null;

    this.ema20Series = null;
    this.ema50Series = null;
    this.ema200Series = null;
    this.bbUpperSeries = null;
    this.bbLowerSeries = null;
    this.bbMiddleSeries = null;
    this.avgCostPriceLine = null;

    this.currentData = []; // Raw OHLCV bars
    this.currentSymbol = "^GSPC";
    this.currentTimeframe = "1D";
    this.currentChartType = "candles";

    this.activeIndicators = {
      ema20: true,
      ema50: false,
      ema200: false,
      bb: false,
      fib: false,
      volume: true,
      rsi: true,
      macd: false
    };
    this.fibPriceLines = [];

    this.rsiCanvas = document.getElementById("rsi-canvas");
    this.macdCanvas = document.getElementById("macd-canvas");
    this.calculatedIndicators = {};

    this.initChart();
    this.setupResizeListener();
  }

  initChart() {
    if (!this.container || typeof LightweightCharts === 'undefined') {
      console.warn("LightweightCharts not loaded yet or container missing");
      return;
    }

    this.container.innerHTML = "";

    this.chart = LightweightCharts.createChart(this.container, {
      width: this.container.clientWidth || 800,
      height: this.container.clientHeight || 450,
      layout: {
        background: { type: 'solid', color: '#080B10' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'Roboto Mono', 'SF Mono', Consolas, monospace"
      },
      grid: {
        vertLines: { color: '#131A29', style: 1 },
        horzLines: { color: '#131A29', style: 1 }
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: {
          color: '#00D2FF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1E2638'
        },
        horzLine: {
          color: '#00D2FF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1E2638'
        }
      },
      rightPriceScale: {
        borderColor: '#1E2638',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        alignLabels: true
      },
      timeScale: {
        borderColor: '#1E2638',
        timeVisible: true,
        secondsVisible: false
      }
    });

    // Candlestick Series
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: '#00F090',
      downColor: '#FF385C',
      borderVisible: true,
      borderUpColor: '#00F090',
      borderDownColor: '#FF385C',
      wickUpColor: '#00F090',
      wickDownColor: '#FF385C'
    });

    // Volume Series (isolated on dedicated scale to prevent candle overlap)
    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale'
    });
    this.chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });

    // Crosshair handler for OHLC legend
    this.chart.subscribeCrosshairMove((param) => {
      this.updateLegend(param);
    });
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      if (this.chart && this.container) {
        this.chart.applyOptions({
          width: this.container.clientWidth,
          height: this.container.clientHeight
        });
        this.drawSubpanes();
      }
    });
  }

  setChartType(type) {
    this.currentChartType = type;
    if (!this.currentData || this.currentData.length === 0) return;

    if (type === 'candles') {
      if (this.lineSeries) { this.chart.removeSeries(this.lineSeries); this.lineSeries = null; }
      if (this.areaSeries) { this.chart.removeSeries(this.areaSeries); this.areaSeries = null; }
      if (!this.candleSeries) {
        this.candleSeries = this.chart.addCandlestickSeries({
          upColor: '#00F090',
          downColor: '#FF385C',
          borderVisible: true,
          borderUpColor: '#00F090',
          borderDownColor: '#FF385C',
          wickUpColor: '#00F090',
          wickDownColor: '#FF385C'
        });
      }
      this.candleSeries.setData(this.currentData);
    } else if (type === 'line') {
      if (this.candleSeries) { this.chart.removeSeries(this.candleSeries); this.candleSeries = null; }
      if (this.areaSeries) { this.chart.removeSeries(this.areaSeries); this.areaSeries = null; }
      if (!this.lineSeries) {
        this.lineSeries = this.chart.addLineSeries({
          color: '#00D2FF',
          lineWidth: 2
        });
      }
      const lineData = this.currentData.map(d => ({ time: d.time, value: d.close }));
      this.lineSeries.setData(lineData);
    } else if (type === 'area') {
      if (this.candleSeries) { this.chart.removeSeries(this.candleSeries); this.candleSeries = null; }
      if (this.lineSeries) { this.chart.removeSeries(this.lineSeries); this.lineSeries = null; }
      if (!this.areaSeries) {
        this.areaSeries = this.chart.addAreaSeries({
          topColor: 'rgba(0, 210, 255, 0.4)',
          bottomColor: 'rgba(0, 210, 255, 0.0)',
          lineColor: '#00D2FF',
          lineWidth: 2
        });
      }
      const areaData = this.currentData.map(d => ({ time: d.time, value: d.close }));
      this.areaSeries.setData(areaData);
    }
  }

  loadData(data, symbol = this.currentSymbol) {
    if (!data || data.length === 0) return;
    this.currentData = data;
    this.currentSymbol = symbol;

    if (this.chart && this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this.chart.applyOptions({
        width: this.container.clientWidth,
        height: this.container.clientHeight
      });
    }

    // Set candlestick data
    if (this.candleSeries) {
      this.candleSeries.setData(data);
    } else if (this.lineSeries) {
      this.lineSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
    } else if (this.areaSeries) {
      this.areaSeries.setData(data.map(d => ({ time: d.time, value: d.close })));
    }

    // Set volume data
    if (this.volumeSeries) {
      const volData = data.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(0, 240, 144, 0.22)' : 'rgba(255, 56, 92, 0.22)'
      }));
      this.volumeSeries.setData(volData);
    }

    // Compute indicators
    this.recalculateIndicators();

    // Reset view
    this.chart.timeScale().fitContent();

    // Compute historical performance stats (1Y Return, 52W High, 52W Low)
    this.updateHistoricalPerformance(data);

    // Draw subpanes
    this.drawSubpanes();

    // Default legend
    const last = data[data.length - 1];
    this.setLegendValues(last);
  }

  updateHistoricalPerformance(data) {
    if (!data || data.length === 0) return;

    const first = data[0];
    const last = data[data.length - 1];
    const currentPrice = last.close;

    // Day 1 Inception stats
    const firstDate = new Date(first.time * 1000);
    const inceptionDateStr = firstDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const firstOpen = first.open || first.close;
    const allTimeReturn = firstOpen > 0 ? ((currentPrice - firstOpen) / firstOpen) * 100 : 0;

    const incepDateEl = document.getElementById("stat-inception-date");
    const incepPriceEl = document.getElementById("stat-inception-price");
    const allTimeEl = document.getElementById("stat-alltime-gain");

    if (incepDateEl) incepDateEl.textContent = inceptionDateStr;
    if (incepPriceEl) incepPriceEl.textContent = '$' + firstOpen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (allTimeEl) {
      const sign = allTimeReturn >= 0 ? '+' : '';
      allTimeEl.textContent = `${sign}${allTimeReturn.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
      allTimeEl.className = `stat-val mono ${allTimeReturn >= 0 ? 'bull' : 'bear'}`;
    }

    // Look back up to 252 bars (approx 1 trading year) or entire dataset
    const lookback = Math.min(data.length, 252);
    const startIndex = Math.max(0, data.length - lookback);
    const baseBar = data[startIndex];
    const startPrice = baseBar.open || baseBar.close;

    const returnPct = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;

    let h52 = -Infinity;
    let l52 = Infinity;
    for (let i = startIndex; i < data.length; i++) {
      if (data[i].high > h52) h52 = data[i].high;
      if (data[i].low < l52) l52 = data[i].low;
    }

    const perfEl = document.getElementById("stat-1y-perf");
    const h52El = document.getElementById("stat-52w-high");
    const l52El = document.getElementById("stat-52w-low");

    if (perfEl) {
      const sign = returnPct >= 0 ? '+' : '';
      perfEl.textContent = `${sign}${returnPct.toFixed(2)}%`;
      perfEl.className = `stat-val mono ${returnPct >= 0 ? 'bull' : 'bear'}`;
    }
    if (h52El && h52 !== -Infinity) {
      h52El.textContent = '$' + h52.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (l52El && l52 !== Infinity) {
      l52El.textContent = '$' + l52.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // Institutional Average Purchase Price Overlay & P&L Telemetry
  updatePortfolioOverlay(symbol, portfolioManager) {
    // 1. Cleanly remove previous price line
    if (this.avgCostPriceLine) {
      if (this.candleSeries) {
        try { this.candleSeries.removePriceLine(this.avgCostPriceLine); } catch (e) {}
      }
      if (this.lineSeries) {
        try { this.lineSeries.removePriceLine(this.avgCostPriceLine); } catch (e) {}
      }
      this.avgCostPriceLine = null;
    }

    const posStrip = document.getElementById("chart-position-strip");
    if (!portfolioManager || !portfolioManager.holdings) {
      if (posStrip) posStrip.style.display = "none";
      return;
    }

    // Match holding (supports VWRA / VWRA.L, HK tickers)
    const holding = portfolioManager.holdings.find(h => {
      if (h.symbol === symbol || h.id === symbol) return true;
      if (symbol === "VWRA.L" && h.symbol === "VWRA") return true;
      if (symbol === "VWRA" && h.symbol === "VWRA.L") return true;
      return false;
    });

    if (!holding) {
      if (posStrip) posStrip.style.display = "none";
      return;
    }

    const curPrice = holding.currentPrice || (this.currentData.length > 0 ? this.currentData[this.currentData.length - 1].close : holding.avgCost);
    const pnlPerShare = curPrice - holding.avgCost;
    const pnlPct = holding.avgCost > 0 ? (pnlPerShare / holding.avgCost) * 100 : 0;
    const totalPnl = pnlPerShare * holding.shares;
    const sign = pnlPerShare >= 0 ? '+' : '';
    const isBull = pnlPerShare >= 0;
    const currSym = holding.currency === "SGD" ? "S$" : (holding.currency === "HKD" ? "HK$" : "$");

    // 2. Draw Institutional Horizontal Average Cost Price Line on Active Series
    const targetSeries = this.candleSeries || this.lineSeries || this.areaSeries;
    if (targetSeries && typeof targetSeries.createPriceLine === 'function') {
      try {
        this.avgCostPriceLine = targetSeries.createPriceLine({
          price: holding.avgCost,
          color: isBull ? '#00F090' : '#FF385C',
          lineWidth: 2,
          lineStyle: 2, // Dashed line
          axisLabelVisible: true,
          title: `YOUR AVG COST: ${currSym}${holding.avgCost.toFixed(2)} (${sign}${pnlPct.toFixed(2)}%)`
        });
      } catch (e) {
        console.warn("Could not draw average cost price line:", e);
      }
    }

    // 3. Display Institutional Portfolio Position Live Ribbon
    if (posStrip) {
      posStrip.style.display = "flex";
      posStrip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="pos-strip-badge ${holding.broker === 'IBKR' ? 'badge-ibkr' : 'badge-tiger'}">${holding.broker}</span>
          <span style="font-weight: 800; color: #FFF;">YOUR HOLDING:</span>
          <span><strong>${holding.shares.toLocaleString()}</strong> Shares</span>
        </div>
        <div class="pos-strip-detail">
          <span>AVG COST: <strong class="cyan">${currSym}${holding.avgCost.toFixed(2)}</strong></span>
          <span class="sep">•</span>
          <span>CURRENT DAY: <strong>${currSym}${curPrice.toFixed(2)}</strong></span>
          <span class="sep">•</span>
          <span>PER-SHARE SPREAD: <strong class="${isBull ? 'bull' : 'bear'}">${sign}${currSym}${pnlPerShare.toFixed(2)} (${sign}${pnlPct.toFixed(2)}%)</strong></span>
          <span class="sep">•</span>
          <span>NET P&L: <strong class="${isBull ? 'bull' : 'bear'}">${sign}${currSym}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        </div>
      `;
    }
  }

  recalculateIndicators() {
    const closes = this.currentData.map(d => d.close);
    const times = this.currentData.map(d => d.time);

    // EMA 20
    const ema20 = this.calcEMA(closes, 20);
    this.updateLineIndicator('ema20', ema20, times, '#00D2FF', 2);

    // EMA 50
    const ema50 = this.calcEMA(closes, 50);
    this.updateLineIndicator('ema50', ema50, times, '#FFB800', 2);

    // EMA 200
    const ema200 = this.calcEMA(closes, 200);
    this.updateLineIndicator('ema200', ema200, times, '#A855F7', 2);

    // Bollinger Bands (20, 2)
    const bb = this.calcBollingerBands(closes, 20, 2);
    this.updateBBIndicator(bb, times);

    // RSI (14)
    this.calculatedIndicators.rsi = this.calcRSI(closes, 14);

    // MACD (12, 26, 9)
    this.calculatedIndicators.macd = this.calcMACD(closes, 12, 26, 9);

    // Pivot & Support / Resistance
    this.calculatedIndicators.keyLevels = this.calcKeyLevels(this.currentData);

    // Auto-drawn institutional Fibonacci retracement lines
    this.updateFibonacciLines();
  }

  // Auto-Drawn Institutional Fibonacci Retracement Price Lines
  updateFibonacciLines() {
    const targetSeries = this.candleSeries || this.lineSeries || this.areaSeries;
    if (!targetSeries) return;

    // Clean previous fib lines
    if (this.fibPriceLines && this.fibPriceLines.length > 0) {
      this.fibPriceLines.forEach(line => {
        try { targetSeries.removePriceLine(line); } catch (e) {}
      });
      this.fibPriceLines = [];
    }

    if (!this.activeIndicators.fib || !this.currentData || this.currentData.length < 5) return;

    const levels = this.calcKeyLevels(this.currentData);
    const high = levels.high60;
    const low = levels.low60;
    const diff = high - low;
    if (diff <= 0) return;

    const fibRatios = [
      { ratio: 0.000, price: high, label: "0.0% Swing High", color: "#FF385C", style: 0 },
      { ratio: 0.236, price: high - diff * 0.236, label: "23.6% Fib", color: "#FFB800", style: 2 },
      { ratio: 0.382, price: high - diff * 0.382, label: "38.2% Golden Pocket", color: "#00D2FF", style: 2 },
      { ratio: 0.500, price: high - diff * 0.500, label: "50.0% Equilibrium", color: "#A855F7", style: 1 },
      { ratio: 0.618, price: high - diff * 0.618, label: "61.8% Golden Ratio", color: "#00F090", style: 2 },
      { ratio: 0.786, price: high - diff * 0.786, label: "78.6% Deep Retracement", color: "#3B82F6", style: 2 },
      { ratio: 1.000, price: low, label: "100.0% Swing Low", color: "#00F090", style: 0 }
    ];

    fibRatios.forEach(fib => {
      try {
        const line = targetSeries.createPriceLine({
          price: fib.price,
          color: fib.color,
          lineWidth: fib.ratio === 0.618 || fib.ratio === 0.382 ? 2 : 1,
          lineStyle: fib.style,
          axisLabelVisible: true,
          title: `FIB ${fib.label}: $${fib.price.toFixed(2)}`
        });
        this.fibPriceLines.push(line);
      } catch (e) {}
    });
  }

  updateLineIndicator(name, values, times, color, width = 1) {
    const seriesProp = name + 'Series';
    if (!this.activeIndicators[name]) {
      if (this[seriesProp]) {
        this.chart.removeSeries(this[seriesProp]);
        this[seriesProp] = null;
      }
      return;
    }

    if (!this[seriesProp]) {
      this[seriesProp] = this.chart.addLineSeries({
        color: color,
        lineWidth: width,
        crosshairMarkerVisible: false,
        priceLineVisible: false
      });
    }

    const data = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null && !isNaN(values[i])) {
        data.push({ time: times[i], value: values[i] });
      }
    }
    this[seriesProp].setData(data);
  }

  updateBBIndicator(bb, times) {
    if (!this.activeIndicators.bb) {
      if (this.bbUpperSeries) { this.chart.removeSeries(this.bbUpperSeries); this.bbUpperSeries = null; }
      if (this.bbLowerSeries) { this.chart.removeSeries(this.bbLowerSeries); this.bbLowerSeries = null; }
      if (this.bbMiddleSeries) { this.chart.removeSeries(this.bbMiddleSeries); this.bbMiddleSeries = null; }
      return;
    }

    if (!this.bbUpperSeries) {
      this.bbUpperSeries = this.chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.7)', lineWidth: 1, priceLineVisible: false });
      this.bbMiddleSeries = this.chart.addLineSeries({ color: 'rgba(96, 165, 250, 0.6)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      this.bbLowerSeries = this.chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.7)', lineWidth: 1, priceLineVisible: false });
    }

    const uData = [], mData = [], lData = [];
    for (let i = 0; i < times.length; i++) {
      if (bb.upper[i] !== null) {
        uData.push({ time: times[i], value: bb.upper[i] });
        mData.push({ time: times[i], value: bb.middle[i] });
        lData.push({ time: times[i], value: bb.lower[i] });
      }
    }
    this.bbUpperSeries.setData(uData);
    this.bbMiddleSeries.setData(mData);
    this.bbLowerSeries.setData(lData);
  }

  toggleIndicator(name) {
    this.activeIndicators[name] = !this.activeIndicators[name];
    this.recalculateIndicators();
    this.drawSubpanes();
    return this.activeIndicators[name];
  }

  // Real-time tick update (e.g. from WebSocket)
  updateLastCandle(tick) {
    if (!this.currentData || this.currentData.length === 0) return;
    const lastBar = this.currentData[this.currentData.length - 1];
    const price = tick.price;
    const vol = tick.volume || 0;

    lastBar.close = price;
    if (price > lastBar.high) lastBar.high = price;
    if (price < lastBar.low) lastBar.low = price;
    lastBar.volume += vol;

    if (this.candleSeries) {
      this.candleSeries.update(lastBar);
    }
    this.setLegendValues(lastBar);
  }

  updateLegend(param) {
    const hud = document.getElementById("chart-crosshair-hud");
    if (!param || !param.time || !param.seriesData) {
      if (hud) hud.style.display = "none";
      return;
    }
    const bar = param.seriesData.get(this.candleSeries) || param.seriesData.get(this.lineSeries) || param.seriesData.get(this.areaSeries);
    if (bar) {
      this.setLegendValues(bar);
      if (hud) {
        hud.style.display = "flex";
        const dateObj = new Date(param.time * 1000);
        const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const openVal = bar.open || bar.value || 0;
        const closeVal = bar.close || bar.value || 0;
        const isUp = closeVal >= openVal;
        const movePct = openVal > 0 ? (((closeVal - openVal) / openVal) * 100).toFixed(2) : "0.00";
        const sign = isUp ? "+" : "";

        hud.innerHTML = `
          <div class="hud-title-row">
            <span class="cyan" style="font-weight: 800;">${this.currentSymbol || 'ASSET'}</span>
            <span style="font-size: 10px; color: var(--text-muted);">${dateStr}</span>
          </div>
          <div class="hud-grid">
            <div class="hud-item"><span class="hud-lbl">O:</span> <span>$${openVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="hud-item"><span class="hud-lbl">H:</span> <span>$${(bar.high || bar.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="hud-item"><span class="hud-lbl">L:</span> <span>$${(bar.low || bar.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="hud-item"><span class="hud-lbl">C:</span> <span class="${isUp ? 'bull' : 'bear'}">$${closeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2px;">
            <span class="hud-lbl">MOVE: <strong class="${isUp ? 'bull' : 'bear'}">${sign}${movePct}%</strong></span>
            <span class="hud-lbl">VOL: <strong>${bar.volume ? (bar.volume > 1e6 ? (bar.volume / 1e6).toFixed(2) + 'M' : (bar.volume / 1e3).toFixed(1) + 'K') : '--'}</strong></span>
          </div>
        `;
      }
    } else if (hud) {
      hud.style.display = "none";
    }
  }

  setLegendValues(bar) {
    if (!bar) return;
    const o = document.getElementById("leg-open");
    const h = document.getElementById("leg-high");
    const l = document.getElementById("leg-low");
    const c = document.getElementById("leg-close");
    const v = document.getElementById("leg-vol");

    if (o) o.textContent = (bar.open || bar.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (h) h.textContent = (bar.high || bar.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (l) l.textContent = (bar.low || bar.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (c) {
      const val = bar.close || bar.value || 0;
      c.textContent = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      c.className = (bar.close >= bar.open) ? 'bull' : 'bear';
    }
    if (v && bar.volume) {
      v.textContent = (bar.volume > 1e6 ? (bar.volume / 1e6).toFixed(2) + 'M' : (bar.volume / 1e3).toFixed(1) + 'K');
    }
  }

  // SUBPANES RENDERING (RSI & MACD using High-Res HTML5 Canvas)
  drawSubpanes() {
    this.drawRSI();
    this.drawMACD();
  }

  drawRSI() {
    const pane = document.getElementById("rsi-pane");
    if (!pane || !this.rsiCanvas) return;
    if (!this.activeIndicators.rsi) {
      pane.style.display = "none";
      return;
    }
    pane.style.display = "flex";

    const canvas = this.rsiCanvas;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight - 20;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const rsi = this.calculatedIndicators.rsi;
    if (!rsi || rsi.length === 0) return;

    // Draw Overbought (70) and Oversold (30) bands
    const y70 = height * (1 - 70 / 100);
    const y30 = height * (1 - 30 / 100);
    const y50 = height * 0.5;

    ctx.fillStyle = "rgba(168, 85, 247, 0.05)";
    ctx.fillRect(0, y70, width, y30 - y70);

    ctx.strokeStyle = "rgba(255, 56, 92, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y70);
    ctx.lineTo(width, y70);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 240, 144, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, y30);
    ctx.lineTo(width, y30);
    ctx.stroke();

    ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
    ctx.beginPath();
    ctx.moveTo(0, y50);
    ctx.lineTo(width, y50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw RSI Line
    ctx.strokeStyle = "#A855F7";
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const validRsi = [];
    for (let i = 0; i < rsi.length; i++) {
      if (rsi[i] !== null) validRsi.push({ idx: i, val: rsi[i] });
    }
    if (validRsi.length < 2) return;

    const step = width / (validRsi.length - 1);
    validRsi.forEach((pt, index) => {
      const x = index * step;
      const y = height * (1 - pt.val / 100);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Latest RSI value text
    const latestVal = validRsi[validRsi.length - 1].val.toFixed(1);
    const valElem = document.getElementById("rsi-val-badge");
    if (valElem) {
      valElem.textContent = latestVal;
      valElem.className = latestVal >= 70 ? 'bear' : latestVal <= 30 ? 'bull' : 'cyan';
    }
  }

  drawMACD() {
    const pane = document.getElementById("macd-pane");
    if (!pane || !this.macdCanvas) return;
    if (!this.activeIndicators.macd) {
      pane.style.display = "none";
      return;
    }
    pane.style.display = "flex";

    const canvas = this.macdCanvas;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight - 20;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const macdData = this.calculatedIndicators.macd;
    if (!macdData || !macdData.macdLine || macdData.macdLine.length === 0) return;

    // Filter valid
    const valid = [];
    let maxAbs = 0.0001;
    for (let i = 0; i < macdData.macdLine.length; i++) {
      if (macdData.macdLine[i] !== null && macdData.signalLine[i] !== null) {
        const m = macdData.macdLine[i];
        const s = macdData.signalLine[i];
        const h = macdData.histogram[i];
        maxAbs = Math.max(maxAbs, Math.abs(m), Math.abs(s), Math.abs(h));
        valid.push({ m, s, h });
      }
    }
    if (valid.length < 2) return;

    const zeroY = height / 2;
    const scale = (height / 2 - 10) / maxAbs;
    const step = width / (valid.length - 1);

    // Draw Zero line
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    // Draw Histogram
    valid.forEach((pt, i) => {
      const x = i * step;
      const barHeight = pt.h * scale;
      ctx.fillStyle = pt.h >= 0 ? "rgba(0, 240, 144, 0.6)" : "rgba(255, 56, 92, 0.6)";
      ctx.fillRect(x - step * 0.4, zeroY, step * 0.8, -barHeight);
    });

    // Draw MACD Line
    ctx.strokeStyle = "#00D2FF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    valid.forEach((pt, i) => {
      const x = i * step;
      const y = zeroY - pt.m * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Signal Line
    ctx.strokeStyle = "#FFB800";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    valid.forEach((pt, i) => {
      const x = i * step;
      const y = zeroY - pt.s * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Latest MACD values
    const latest = valid[valid.length - 1];
    const valElem = document.getElementById("macd-val-badge");
    if (valElem) {
      valElem.textContent = `M: ${latest.m.toFixed(2)} | S: ${latest.s.toFixed(2)} | H: ${latest.h.toFixed(2)}`;
    }
  }

  // MATHEMATICAL FORMULAS
  calcEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = new Array(data.length).fill(null);
    let sum = 0;
    for (let i = 0; i < period; i++) {
      if (data[i] !== undefined) sum += data[i];
    }
    let prev = sum / period;
    ema[period - 1] = prev;

    for (let i = period; i < data.length; i++) {
      const val = data[i] * k + prev * (1 - k);
      ema[i] = val;
      prev = val;
    }
    return ema;
  }

  calcBollingerBands(data, period = 20, multiplier = 2) {
    const upper = new Array(data.length).fill(null);
    const middle = new Array(data.length).fill(null);
    const lower = new Array(data.length).fill(null);

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const stdev = Math.sqrt(variance);

      middle[i] = mean;
      upper[i] = mean + multiplier * stdev;
      lower[i] = mean - multiplier * stdev;
    }
    return { upper, middle, lower };
  }

  calcRSI(data, period = 14) {
    const rsi = new Array(data.length).fill(null);
    if (data.length <= period) return rsi;

    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
    return rsi;
  }

  calcMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calcEMA(data, fastPeriod);
    const slowEMA = this.calcEMA(data, slowPeriod);

    const macdLine = new Array(data.length).fill(null);
    const validMacd = [];

    for (let i = 0; i < data.length; i++) {
      if (fastEMA[i] !== null && slowEMA[i] !== null) {
        macdLine[i] = fastEMA[i] - slowEMA[i];
        validMacd.push(macdLine[i]);
      }
    }

    const signalValid = this.calcEMA(validMacd, signalPeriod);
    const signalLine = new Array(data.length).fill(null);
    const histogram = new Array(data.length).fill(null);

    const offset = data.length - validMacd.length;
    for (let i = 0; i < validMacd.length; i++) {
      if (signalValid[i] !== null) {
        const fullIdx = offset + i;
        signalLine[fullIdx] = signalValid[i];
        histogram[fullIdx] = macdLine[fullIdx] - signalValid[i];
      }
    }

    return { macdLine, signalLine, histogram };
  }

  calcKeyLevels(bars) {
    if (!bars || bars.length < 10) return null;
    let high = -Infinity;
    let low = Infinity;
    const recent = bars.slice(-60); // Last 60 bars

    recent.forEach(b => {
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
    });

    const diff = high - low;
    const fib382 = high - diff * 0.382;
    const fib500 = high - diff * 0.500;
    const fib618 = high - diff * 0.618;
    const currentPrice = bars[bars.length - 1].close;

    return {
      high60: high,
      low60: low,
      r2: high,
      r1: currentPrice < fib382 ? fib382 : high,
      s1: currentPrice > fib618 ? fib618 : low,
      s2: low,
      fib382,
      fib500,
      fib618
    };
  }
}
window.TradingChartManager = TradingChartManager;
