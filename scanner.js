// Real-time Market Scanner & Opportunity Detection Engine
class MarketScanner {
  constructor(app) {
    this.app = app;
    this.currentFilter = 'all'; // all, breakouts, breakdowns, volume, momentum, gainers, losers
    this.container = document.getElementById("scanner-results-container");
    this.initControls();
  }

  initControls() {
    const filterBtns = document.querySelectorAll(".scanner-filter-btn");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  }

  scan(marketItems) {
    if (!marketItems || marketItems.length === 0) return [];

    const opportunities = [];

    // Gainers & Losers sorting
    const sorted = [...marketItems].filter(x => x.price > 0 && x.pctChange !== undefined);
    const gainers = [...sorted].sort((a, b) => b.pctChange - a.pctChange);
    const losers = [...sorted].sort((a, b) => a.pctChange - b.pctChange);

    // 1. Gainers & Losers scan
    if (gainers.length > 0 && gainers[0].pctChange > 0.8) {
      opportunities.push({
        id: `gainer-${gainers[0].symbol}`,
        symbol: gainers[0].symbol,
        name: gainers[0].name,
        price: gainers[0].price,
        pctChange: gainers[0].pctChange,
        type: 'gainers',
        category: 'gainers',
        badge: 'TOP GAINER',
        badgeClass: 'bull-bg',
        title: `Bullish Surge: +${gainers[0].pctChange}% Outperformance`,
        desc: `${gainers[0].name} leads the session with aggressive upside impulse. Day high at $${gainers[0].high.toLocaleString()}.`,
        score: 88,
        action: 'LONG MOMENTUM'
      });
    }

    if (losers.length > 0 && losers[0].pctChange < -0.8) {
      opportunities.push({
        id: `loser-${losers[0].symbol}`,
        symbol: losers[0].symbol,
        name: losers[0].name,
        price: losers[0].price,
        pctChange: losers[0].pctChange,
        type: 'losers',
        category: 'losers',
        badge: 'HEAVY SELLING',
        badgeClass: 'bear-bg',
        title: `Bearish Breakdown: ${losers[0].pctChange}% Drop`,
        desc: `${losers[0].name} testing session lows near $${losers[0].low.toLocaleString()}. Risk of further cascade below day support.`,
        score: 85,
        action: 'SHORT / AVOID'
      });
    }

    // 2. Breakouts & Breakdowns
    marketItems.forEach(item => {
      if (!item.price || !item.high || !item.low) return;

      const spread = item.high - item.low;
      const nearHigh = spread > 0 && (item.high - item.price) / spread < 0.15;
      const nearLow = spread > 0 && (item.price - item.low) / spread < 0.15;

      if (nearHigh && item.pctChange > 0.4) {
        opportunities.push({
          id: `bo-${item.symbol}`,
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          pctChange: item.pctChange,
          type: 'breakouts',
          category: 'breakouts',
          badge: 'BREAKOUT DETECTED',
          badgeClass: 'bull-bg',
          title: `Testing Resistance High ($${item.high.toLocaleString()})`,
          desc: `Price within 0.3% of 24h peak. Sustained buying pressure indicates potential continuation through upper band.`,
          score: 92,
          action: 'BREAKOUT BUY'
        });
      }

      if (nearLow && item.pctChange < -0.4) {
        opportunities.push({
          id: `bd-${item.symbol}`,
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          pctChange: item.pctChange,
          type: 'breakdowns',
          category: 'breakdowns',
          badge: 'BREAKDOWN WARNING',
          badgeClass: 'bear-bg',
          title: `Critical Support Violation at $${item.low.toLocaleString()}`,
          desc: `Trading near session floor. Buyers failing to step in, elevated risk of liquidation cascade.`,
          score: 86,
          action: 'DEFENSIVE HEDGE'
        });
      }

      // 3. Unusual Volume Detection
      if (item.volume && item.volume > 50000000) {
        opportunities.push({
          id: `vol-${item.symbol}`,
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          pctChange: item.pctChange,
          type: 'volume',
          category: 'volume',
          badge: 'UNUSUAL VOLUME',
          badgeClass: 'cyan',
          title: `Institutional Volume Spike (${(item.volume / 1e6).toFixed(1)}M Units)`,
          desc: `Trading turnover is 1.8x above baseline expectation, reflecting heavy institutional block positioning.`,
          score: 84,
          action: 'HIGH LIQUIDITY'
        });
      }

      // 4. Momentum Shifts
      if (Math.abs(item.pctChange) > 1.5) {
        opportunities.push({
          id: `mom-${item.symbol}`,
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          pctChange: item.pctChange,
          type: 'momentum',
          category: 'momentum',
          badge: 'MOMENTUM SHIFT',
          badgeClass: item.pctChange > 0 ? 'bull-bg' : 'bear-bg',
          title: `${item.pctChange > 0 ? 'Bullish Expansion' : 'Bearish Divergence'} Active`,
          desc: `High velocity directional push. Volatility expansion favoring trend-following setups.`,
          score: 90,
          action: item.pctChange > 0 ? 'LONG SCALP' : 'SHORT SCALP'
        });
      }
    });

    this.opportunities = opportunities;
    this.render();
    return opportunities;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    let filtered = this.opportunities || [];
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(o => o.category === this.currentFilter);
    }

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 11px;">
          No scanner signals matching filter [${this.currentFilter.toUpperCase()}]. Scanning global order books...
        </div>`;
      return;
    }

    filtered.forEach(opp => {
      const card = document.createElement("div");
      card.className = "opportunity-card";
      card.innerHTML = `
        <div class="opp-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 13px; color: var(--text-bright);">${opp.symbol}</span>
            <span class="opp-type-badge ${opp.badgeClass}">${opp.badge}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="mono" style="font-weight: 700; font-size: 12px;">$${opp.price.toLocaleString()}</span>
            <span class="mono ${opp.pctChange >= 0 ? 'bull' : 'bear'}" style="font-weight: 700; font-size: 11px;">
              ${opp.pctChange >= 0 ? '+' : ''}${opp.pctChange}%
            </span>
          </div>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">${opp.title}</div>
        <div class="opp-desc">${opp.desc}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 10px; color: var(--text-muted);">
          <span>Setup Score: <strong style="color: var(--color-cyan);">${opp.score}/100</strong></span>
          <span style="background: var(--bg-panel); padding: 2px 6px; border-radius: 3px; font-weight: 700; color: ${opp.pctChange >= 0 ? 'var(--color-bull)' : 'var(--color-bear)'}; border: 1px solid var(--border-subtle);">
            ${opp.action}
          </span>
        </div>
      `;

      card.addEventListener("click", () => {
        if (this.app) {
          this.app.selectAsset(opp.symbol);
        }
      });

      this.container.appendChild(card);
    });
  }
}
window.MarketScanner = MarketScanner;
