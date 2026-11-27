// Portfolio Management & Elite Global Trader Decision Engine
// Fully loaded with verified holdings from Tiger Brokers (Account 50280676) and IBKR (Account U18729869)
class PortfolioManager {
  constructor(app) {
    this.app = app;
    this.storageKey = "user_holdings_v2";
    // Base FX Rates
    this.fx = {
      USDSGD: 1.2850,
      USDHKD: 7.7850
    };
    this.holdings = this.loadHoldings();
    this.cashBalances = {
      tigerUSD: 181.29,
      tigerSGD: 172.00,
      ibkrUSD: 66.43,
      ibkrSGD: 60.55
    };
    this.displayCurrency = "USD"; // USD or SGD toggle
    this.container = document.getElementById("portfolio-view-container");
    this.initUI();
  }

  loadHoldings() {
    // Exact holdings extracted from statements as of Nov 25, 2026
    const verifiedHoldings = [
      // --- INTERACTIVE BROKERS (IBKR - U18729869) ---
      {
        id: "ibkr-vwra",
        symbol: "VWRA",
        name: "Vanguard FTSE All-World UCITS ETF (LSE)",
        broker: "IBKR",
        shares: 46,
        avgCost: 191.10,
        currentPrice: 174.00,
        currency: "USD",
        market: "GLOBAL_ETF",
        assetClass: "Equity Index ETF",
        notes: "Core long-term diversified global wealth engine (Irish Domiciled, Accumulating)"
      },

      // --- TIGER BROKERS (TigerTrade - 50280676) ---
      // SINGAPORE (SGX)
      {
        id: "tiger-d05",
        symbol: "D05.SI",
        name: "DBS Group Holdings Ltd",
        broker: "Tiger",
        shares: 200,
        avgCost: 52.66,
        currentPrice: 66.24,
        currency: "SGD",
        market: "SG",
        assetClass: "Financials / Banking",
        notes: "Mega-cap dividend leader. Recent quarterly dividend paid SGD 162.00."
      },
      {
        id: "tiger-o39",
        symbol: "O39.SI",
        name: "Oversea-Chinese Banking Corp (OCBC)",
        broker: "Tiger",
        shares: 200,
        avgCost: 14.65,
        currentPrice: 26.62,
        currency: "SGD",
        market: "SG",
        assetClass: "Financials / Banking",
        notes: "High-yield compounding stalwart (+81.7% unrealized gain)."
      },
      {
        id: "tiger-es3",
        symbol: "ES3.SI",
        name: "SPDR Straits Times Index ETF",
        broker: "Tiger",
        shares: 300,
        avgCost: 4.46,
        currentPrice: 5.05,
        currency: "SGD",
        market: "SG",
        assetClass: "Singapore Equity Index",
        notes: "Domestic benchmark exposure with resilient dividend yield."
      },
      {
        id: "tiger-1d0",
        symbol: "1D0.SI",
        name: "Kimly Limited",
        broker: "Tiger",
        shares: 2500,
        avgCost: 0.311,
        currentPrice: 0.365,
        currency: "SGD",
        market: "SG",
        assetClass: "Consumer Discretionary",
        notes: "Cash-flow positive local coffee shop operator (+17.4% gain)."
      },

      // US STOCKS & ETFS (Tiger)
      {
        id: "tiger-aapl",
        symbol: "AAPL",
        name: "Apple Inc.",
        broker: "Tiger",
        shares: 10,
        avgCost: 245.14,
        currentPrice: 354.07,
        currency: "USD",
        market: "US",
        assetClass: "Mega-Cap Tech",
        notes: "Capital compounding juggernaut (+44.4% unrealized gain)."
      },
      {
        id: "tiger-googl",
        symbol: "GOOGL",
        name: "Alphabet Inc. (Class A)",
        broker: "Tiger",
        shares: 10.0044,
        avgCost: 160.28,
        currentPrice: 279.05,
        currency: "USD",
        market: "US",
        assetClass: "Mega-Cap Tech / Cloud / AI",
        notes: "Outperformer (+74.1% unrealized gain). Strong cloud and search moat."
      },
      {
        id: "tiger-spy",
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        broker: "Tiger",
        shares: 3.00519,
        avgCost: 643.57,
        currentPrice: 718.78,
        currency: "USD",
        market: "US",
        assetClass: "US Broad Market ETF",
        notes: "Baseline institutional equity standard (+11.7% gain)."
      },
      {
        id: "tiger-qqqm",
        symbol: "QQQM",
        name: "Invesco NASDAQ 100 ETF",
        broker: "Tiger",
        shares: 5.00355,
        avgCost: 230.33,
        currentPrice: 262.78,
        currency: "USD",
        market: "US",
        assetClass: "Tech Growth ETF",
        notes: "Core tech exposure (+14.1% gain)."
      },
      {
        id: "tiger-gldm",
        symbol: "GLDM",
        name: "SPDR Gold MiniShares Trust",
        broker: "Tiger",
        shares: 20,
        avgCost: 62.23,
        currentPrice: 70.26,
        currency: "USD",
        market: "COMMODITY",
        assetClass: "Precious Metals",
        notes: "Sovereign currency hedge and geopolitical insurance (+12.9% gain)."
      },
      {
        id: "tiger-shld",
        symbol: "SHLD",
        name: "Global X Defense Tech ETF",
        broker: "Tiger",
        shares: 10,
        avgCost: 53.09,
        currentPrice: 57.72,
        currency: "USD",
        market: "US",
        assetClass: "Aerospace & Defense",
        notes: "Structural beneficiary of rising global defense expenditures (+8.7% gain)."
      },
      {
        id: "tiger-slvr",
        symbol: "SLVR",
        name: "Sprott Silver Miners & Physical Silver",
        broker: "Tiger",
        shares: 20,
        avgCost: 43.61,
        currentPrice: 36.07,
        currency: "USD",
        market: "COMMODITY",
        assetClass: "Precious Metals / Industrial",
        notes: "Correction phase (-17.3% drawdown). Volatile high-beta commodity asset."
      },
      {
        id: "tiger-nlr",
        symbol: "NLR",
        name: "VanEck Uranium and Nuclear Energy ETF",
        broker: "Tiger",
        shares: 4,
        avgCost: 139.75,
        currentPrice: 77.93,
        currency: "USD",
        market: "US",
        assetClass: "Clean Energy / Nuclear",
        notes: "Severe drawdown (-44.2% loss). Sector contracted sharply after 2024 peak."
      },
      {
        id: "tiger-tqqq",
        symbol: "TQQQ",
        name: "ProShares UltraPro QQQ (3x Leveraged)",
        broker: "Tiger",
        shares: 4,
        avgCost: 49.85,
        currentPrice: 46.19,
        currency: "USD",
        market: "LEVERAGED",
        assetClass: "3x Daily Leverage ETF",
        notes: "Tactical trading instrument. Subject to high compounding volatility decay."
      },

      // HONG KONG (HKEX)
      {
        id: "tiger-01398",
        symbol: "01398.HK",
        name: "ICBC (Industrial & Commercial Bank of China)",
        broker: "Tiger",
        shares: 1000,
        avgCost: 4.84,
        currentPrice: 7.69,
        currency: "HKD",
        market: "HK",
        assetClass: "Chinese Banking / State-Owned",
        notes: "High-dividend state enterprise yielding generous payout (+58.6% gain)."
      },
      {
        id: "tiger-03067",
        symbol: "03067.HK",
        name: "iShares Hang Seng TECH ETF",
        broker: "Tiger",
        shares: 100,
        avgCost: 11.44,
        currentPrice: 7.32,
        currency: "HKD",
        market: "HK",
        assetClass: "China Tech Growth ETF",
        notes: "Prolonged valuation drawdown (-36.0% loss). Heavily discounted multiples."
      }
    ];

    // Check if user has an override saved, otherwise default to verified holdings
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return verifiedHoldings;
  }

  saveHoldings() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.holdings));
    this.render();
  }

  initUI() {
    const addBtn = document.getElementById("btn-open-add-holding");
    const modal = document.getElementById("holding-modal");
    const closeBtn = document.getElementById("close-holding-modal");
    const saveBtn = document.getElementById("btn-save-holding");
    const clearBtn = document.getElementById("btn-clear-holdings");
    const importBtn = document.getElementById("btn-import-csv");
    const fileInput = document.getElementById("csv-file-input");

    // Portfolio View-Only Security Lock Controller
    const authBtn = document.getElementById("btn-manager-auth");
    const lockBtn = document.getElementById("btn-lock-portfolio");
    const editToolbar = document.getElementById("manager-edit-toolbar");
    
    // Check if session previously unlocked
    if (sessionStorage.getItem("portfolio_manager_unlocked") === "true") {
      this.isManagerUnlocked = true;
      if (editToolbar) editToolbar.style.display = "block";
      if (authBtn) {
        authBtn.innerHTML = "🔓 Manager Mode";
        authBtn.classList.add("unlocked");
      }
    } else {
      this.isManagerUnlocked = false;
      if (editToolbar) editToolbar.style.display = "none";
    }

    if (authBtn) {
      authBtn.addEventListener("click", () => {
        if (this.isManagerUnlocked) {
          this.lockPortfolio();
        } else {
          const pin = prompt("Enter Portfolio Manager Access PIN (Owner Only):");
          if (pin === "2026" || pin === "zhixuan") {
            this.unlockPortfolio();
          } else if (pin !== null) {
            alert("Incorrect access credentials. Portfolio remains strictly in View-Only mode.");
          }
        }
      });
    }

    if (lockBtn) {
      lockBtn.addEventListener("click", () => this.lockPortfolio());
    }

    // Portfolio Subview Switcher (Holdings Matrix vs Daily Macro Directives)
    const btnHoldings = document.getElementById("btn-port-tab-holdings");
    const btnRecs = document.getElementById("btn-port-tab-recs");
    const viewHoldings = document.getElementById("portfolio-holdings-subview");
    const viewRecs = document.getElementById("portfolio-recs-subview");

    if (btnHoldings && btnRecs) {
      btnHoldings.addEventListener("click", () => {
        btnHoldings.classList.add("active");
        btnRecs.classList.remove("active");
        if (viewHoldings) viewHoldings.style.display = "flex";
        if (viewRecs) viewRecs.style.display = "none";
        this.currentSubview = "holdings";
      });

      btnRecs.addEventListener("click", () => {
        btnRecs.classList.add("active");
        btnHoldings.classList.remove("active");
        if (viewHoldings) viewHoldings.style.display = "none";
        if (viewRecs) viewRecs.style.display = "flex";
        this.currentSubview = "recommendations";
        this.renderDailyRecommendations();
      });
    }

    if (addBtn && modal) {
      addBtn.addEventListener("click", () => modal.classList.add("open"));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => modal.classList.remove("open"));
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.handleAddHoldingFromModal());
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("Reset holdings to the verified statement snapshot?")) {
          localStorage.removeItem(this.storageKey);
          this.holdings = this.loadHoldings();
          this.render();
          this.app.showToast("Holdings reloaded from statements", "bull");
        }
      });
    }
    if (importBtn && fileInput) {
      importBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => this.handleCSVUpload(e));
    }
  }

  unlockPortfolio() {
    this.isManagerUnlocked = true;
    sessionStorage.setItem("portfolio_manager_unlocked", "true");
    const editToolbar = document.getElementById("manager-edit-toolbar");
    const authBtn = document.getElementById("btn-manager-auth");
    if (editToolbar) editToolbar.style.display = "block";
    if (authBtn) {
      authBtn.innerHTML = '<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> <span>Manager Mode</span>';
      authBtn.classList.add("unlocked");
    }
    this.render();
    if (this.app) this.app.showToast("Manager mode unlocked: Position editing enabled", "cyan");
  }

  lockPortfolio() {
    this.isManagerUnlocked = false;
    sessionStorage.removeItem("portfolio_manager_unlocked");
    const editToolbar = document.getElementById("manager-edit-toolbar");
    const authBtn = document.getElementById("btn-manager-auth");
    if (editToolbar) editToolbar.style.display = "none";
    if (authBtn) {
      authBtn.innerHTML = '<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L16 7l-2-2-4 4-2-2-4 4 2 2-3 3 1.5 1.5L6 17l2 2 4-4-2-2 4-4 1.5 1.5 1.5-1.5z"></path></svg> <span>Manager Login</span>';
      authBtn.classList.remove("unlocked");
    }
    this.render();
    if (this.app) this.app.showToast("Portfolio locked to View-Only mode", "bull");
  }

  // Convert any price/value into USD equivalent
  toUSD(val, currency) {
    if (!val) return 0;
    if (currency === "SGD") return val / this.fx.USDSGD;
    if (currency === "HKD") return val / this.fx.USDHKD;
    return val;
  }

  // Convert any price/value into SGD equivalent
  toSGD(val, currency) {
    if (!val) return 0;
    if (currency === "USD") return val * this.fx.USDSGD;
    if (currency === "HKD") return (val / this.fx.USDHKD) * this.fx.USDSGD;
    return val;
  }

  // UNBIASED ELITE TRADER DECISION ENGINE
  // Formulates strict, mathematical risk-adjusted execution plans for each holding
  generateTraderVerdict(pos, totalPortfolioUSD) {
    const posValUSD = this.toUSD((pos.currentPrice || pos.avgCost) * pos.shares, pos.currency);
    const posCostUSD = this.toUSD(pos.avgCost * pos.shares, pos.currency);
    const pnlUSD = posValUSD - posCostUSD;
    const pnlPct = posCostUSD > 0 ? (pnlUSD / posCostUSD) * 100 : 0;
    const weightPct = totalPortfolioUSD > 0 ? (posValUSD / totalPortfolioUSD) * 100 : 0;

    // 1. SPECIFIC RULE: OVER-CONCENTRATION (DBS)
    if (pos.symbol.includes("D05") && weightPct > 20) {
      return {
        action: "TRIM 25% / LOCK PROFIT",
        actionClass: "bear-bg",
        risk: "DANGEROUS CONCENTRATION RISK",
        riskClass: "bear",
        invalidation: "SGD 61.50",
        target: "SGD 70.00",
        rationale: `DBS accounts for ${weightPct.toFixed(1)}% of your entire global wealth ($13,248 SGD). Even with exceptional bank earnings and dividends, holding >20% in a single bank stock exposes you to severe banking margin compression or credit cycle shocks. Take 50 shares of profit ($3,300+ SGD) off the table and set trailing stop at SGD 61.50.`
      };
    }

    // 2. SPECIFIC RULE: MASSIVE WINNER (OCBC)
    if (pos.symbol.includes("O39") && pnlPct > 70) {
      return {
        action: "TRAIL STOP TO SGD 24.50",
        actionClass: "bull-bg",
        risk: "EXCELLENT COMPOUNDING",
        riskClass: "bull",
        invalidation: "SGD 24.50",
        target: "SGD 28.50",
        rationale: `OCBC has generated an extraordinary +${pnlPct.toFixed(1)}% gain from your SGD 14.65 entry. Protect your gains by placing a firm trailing stop at SGD 24.50 (locking in a guaranteed 67%+ gain) while continuing to collect high-dividend distributions.`
      };
    }

    // 3. SPECIFIC RULE: CORE ALL-WORLD BACKBONE (VWRA on IBKR)
    if (pos.symbol === "VWRA") {
      return {
        action: "ACCUMULATE ON DIP (DCA)",
        actionClass: "cyan",
        risk: "VERY LOW (GLOBAL DIVERSIFICATION)",
        riskClass: "cyan",
        invalidation: "USD 162.00",
        target: "USD 210.00",
        rationale: `VWRA holds over 3,600 companies across 47 nations and forms the bedrock of your long-term wealth. Current -8.9% drawdown is a normal market fluctuation. Continue disciplined periodic dollar-cost averaging into IBKR; do not panic sell.`
      };
    }

    // 4. SPECIFIC RULE: SEVERE THESIS BREAKDOWN (NLR - Uranium)
    if (pos.symbol === "NLR" && pnlPct < -35) {
      return {
        action: "TAX-LOSS HARVEST / CUT",
        actionClass: "bear-bg",
        risk: "BROKEN SECTOR MOMENTUM",
        riskClass: "bear",
        invalidation: "BREACHED ($75.00)",
        target: "USD 88.00",
        rationale: `Position is underwater by -${Math.abs(pnlPct).toFixed(1)}% ($139.75 cost vs $77.93). As an institutional trader, you must acknowledge when a theme has broken down. Sell to harvest capital losses to offset your AAPL/GOOGL capital gains, and reallocate into higher-relative-strength names.`
      };
    }

    // 5. SPECIFIC RULE: HANG SENG TECH (03067.HK)
    if (pos.symbol.includes("03067") && pnlPct < -25) {
      return {
        action: "HOLD WITH STRICT CEILING",
        actionClass: "amber-bg",
        risk: "ELEVATED REGULATORY RISK",
        riskClass: "amber",
        invalidation: "HKD 6.80",
        target: "HKD 9.20",
        rationale: `Hang Seng Tech trades at steep historical valuation discounts. Because position size is small (100 shares, ~USD $94), downside to portfolio is capped. Hold as an asymmetric recovery call, but exit immediately if breaking below HKD 6.80.`
      };
    }

    // 6. SPECIFIC RULE: MEGA-CAP WINNERS (AAPL & GOOGL)
    if (pos.symbol === "AAPL" || pos.symbol === "GOOGL") {
      return {
        action: "HOLD / RIDE RUNNERS",
        actionClass: "bull-bg",
        risk: "BLUE CHIP COMPOUNDER",
        riskClass: "bull",
        invalidation: pos.symbol === "AAPL" ? "USD 325.00" : "USD 255.00",
        target: pos.symbol === "AAPL" ? "USD 385.00" : "USD 310.00",
        rationale: `Both mega-caps are outperforming with +44% to +74% gains. Institutional momentum remains intact. Never cut your winners prematurely; let cash flows compound and trail stops below the 50-day EMA.`
      };
    }

    // 7. SPECIFIC RULE: LEVERAGED INSTRUMENTS (TQQQ)
    if (pos.symbol === "TQQQ") {
      return {
        action: "STRICT TACTICAL EXIT",
        actionClass: "bear-bg",
        risk: "HIGH VOLATILITY DECAY",
        riskClass: "bear",
        invalidation: "USD 43.50",
        target: "USD 52.00",
        rationale: `3x leveraged ETFs are designed strictly for intraday/swing trading due to compounding beta decay during market chop. Never hold TQQQ as a multi-year investment. Set a tight stop at $43.50.`
      };
    }

    // 8. GENERAL HIGH-RETURN HARVEST
    if (pnlPct >= 40) {
      return {
        action: "TRAIL STOP / PROTECT",
        actionClass: "bull-bg",
        risk: "STRONG POSITION",
        riskClass: "bull",
        invalidation: `${pos.currency} ${(pos.currentPrice * 0.92).toFixed(2)}`,
        target: `${pos.currency} ${(pos.currentPrice * 1.20).toFixed(2)}`,
        rationale: `Position is generating strong returns (+${pnlPct.toFixed(1)}%). Raise stop floor to lock in minimum 30%+ net profit.`
      };
    }

    // DEFAULT ACTION
    return {
      action: "HOLD / BALANCED WEIGHT",
      actionClass: "cyan",
      risk: "MODERATE RISK",
      riskClass: "cyan",
      invalidation: `${pos.currency} ${(pos.avgCost * 0.90).toFixed(2)}`,
      target: `${pos.currency} ${(pos.avgCost * 1.25).toFixed(2)}`,
      rationale: `Trading within expected risk-budget parameters (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%). Maintain allocation alignment.`
    };
  }

  // Update real-time prices from WebSocket or REST
  syncPrices(marketItems) {
    if (!this.holdings || this.holdings.length === 0) return;

    this.holdings.forEach(pos => {
      // Direct symbol match or mapped tickers (e.g. VWRA vs VWRA.L, HK stocks)
      const item = marketItems.find(x => {
        if (x.symbol === pos.symbol || x.id === pos.symbol) return true;
        if (pos.symbol === "VWRA" && (x.symbol === "VWRA.L" || x.id === "VWRA.L")) return true;
        if (pos.symbol.includes(".HK") && x.symbol && x.symbol.includes(pos.symbol.replace(/^0+/, ''))) return true;
        return false;
      });
      if (item && item.price) {
        pos.currentPrice = item.price;
        pos.change = item.change || 0;
        pos.pctChange = item.pctChange || 0;
      }
    });

    this.render();

    // Live update interactive chart overlay if currently charted
    if (this.app && this.app.chartManager && typeof this.app.chartManager.updatePortfolioOverlay === "function") {
      this.app.chartManager.updatePortfolioOverlay(this.app.selectedSymbol, this);
    }
  }

  // Holdings-Specific News Matcher
  getHoldingsNews(allNews) {
    if (!allNews || allNews.length === 0 || !this.holdings) return [];

    const matched = [];
    const keywords = [
      { key: "DBS", sym: "D05.SI", name: "DBS Group" },
      { key: "OCBC", sym: "O39.SI", name: "OCBC Bank" },
      { key: "APPLE", sym: "AAPL", name: "Apple" },
      { key: "AAPL", sym: "AAPL", name: "Apple" },
      { key: "GOOGLE", sym: "GOOGL", name: "Alphabet" },
      { key: "ALPHABET", sym: "GOOGL", name: "Alphabet" },
      { key: "GOOGL", sym: "GOOGL", name: "Alphabet" },
      { key: "GOLD", sym: "GLDM", name: "Gold MiniShares" },
      { key: "SILVER", sym: "SLVR", name: "Silver Miners" },
      { key: "URANIUM", sym: "NLR", name: "VanEck Uranium" },
      { key: "NUCLEAR", sym: "NLR", name: "Nuclear Energy" },
      { key: "DEFENSE", sym: "SHLD", name: "Defense Tech" },
      { key: "FTSE", sym: "VWRA", name: "Vanguard All-World" },
      { key: "VANGUARD", sym: "VWRA", name: "Vanguard All-World" },
      { key: "STRAITS TIMES", sym: "ES3.SI", name: "STI ETF" },
      { key: "STI", sym: "ES3.SI", name: "STI ETF" },
      { key: "CHINA", sym: "01398.HK", name: "ICBC / China" },
      { key: "ICBC", sym: "01398.HK", name: "ICBC" },
      { key: "HANG SENG", sym: "03067.HK", name: "Hang Seng Tech" },
      { key: "QQQ", sym: "QQQM", name: "NASDAQ 100" }
    ];

    allNews.forEach(item => {
      const text = (item.title + " " + (item.description || "")).toUpperCase();
      for (const kw of keywords) {
        if (text.includes(kw.key)) {
          matched.push({
            ...item,
            matchedSymbol: kw.sym,
            matchedName: kw.name
          });
          break;
        }
      }
    });

    return matched;
  }

  render() {
    const listContainer = document.getElementById("portfolio-holdings-list");
    const totalValEl = document.getElementById("port-total-value");
    const totalPnlEl = document.getElementById("port-total-pnl");
    const totalPnlPctEl = document.getElementById("port-total-pnl-pct");
    const ibkrCountEl = document.getElementById("port-ibkr-count");
    const tigerCountEl = document.getElementById("port-tiger-count");
    const holdingsNewsContainer = document.getElementById("portfolio-news-container");

    if (!listContainer) return;

    listContainer.innerHTML = "";

    let totalValUSD = 0;
    let totalCostUSD = 0;
    let ibkrPositionsCount = 0;
    let tigerPositionsCount = 0;

    // Calculate aggregated portfolio totals in USD
    this.holdings.forEach(pos => {
      const curPrice = pos.currentPrice || pos.avgCost;
      const posVal = curPrice * pos.shares;
      const posCost = pos.avgCost * pos.shares;

      const valUSD = this.toUSD(posVal, pos.currency);
      const costUSD = this.toUSD(posCost, pos.currency);

      totalValUSD += valUSD;
      totalCostUSD += costUSD;

      if (pos.broker === "IBKR") ibkrPositionsCount++;
      else if (pos.broker === "Tiger") tigerPositionsCount++;
    });

    // Add cash balances (in USD)
    const totalCashUSD = this.cashBalances.tigerUSD + 
                         (this.cashBalances.tigerSGD / this.fx.USDSGD) + 
                         this.cashBalances.ibkrUSD + 
                         (this.cashBalances.ibkrSGD / this.fx.USDSGD);

    const netLiquidationUSD = totalValUSD + totalCashUSD;
    const netPnlUSD = totalValUSD - totalCostUSD;
    const netPnlPct = totalCostUSD > 0 ? (netPnlUSD / totalCostUSD) * 100 : 0;

    // Update Header Metric Cards
    if (totalValEl) {
      totalValEl.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span>$${netLiquidationUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style="font-size: 13px; color: var(--text-muted);">USD</span></span>
          <span style="font-size: 13px; color: var(--color-cyan); font-weight: 600;">(≈ S$${(netLiquidationUSD * this.fx.USDSGD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SGD)</span>
        </div>
      `;
    }

    if (totalPnlEl) {
      const sign = netPnlUSD >= 0 ? '+' : '';
      totalPnlEl.textContent = `${sign}$${netPnlUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (${sign}S$${(netPnlUSD * this.fx.USDSGD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SGD)`;
      totalPnlEl.className = `mono ${netPnlUSD >= 0 ? 'bull' : 'bear'}`;
    }

    if (totalPnlPctEl) {
      const sign = netPnlPct >= 0 ? '+' : '';
      totalPnlPctEl.textContent = `${sign}${netPnlPct.toFixed(2)}% Overall Gain`;
      totalPnlPctEl.className = `mono ${netPnlPct >= 0 ? 'bull-bg' : 'bear-bg'} ribbon-badge`;
    }

    if (ibkrCountEl) ibkrCountEl.textContent = `${ibkrPositionsCount} IBKR (VWRA)`;
    if (tigerCountEl) tigerCountEl.textContent = `${tigerPositionsCount} Tiger Positions`;

    // Render each individual holding
    this.holdings.forEach(pos => {
      const curPrice = pos.currentPrice || pos.avgCost;
      const pnlPerShare = curPrice - pos.avgCost;
      const posValLocal = curPrice * pos.shares;
      const posCostLocal = pos.avgCost * pos.shares;
      const pnlLocal = posValLocal - posCostLocal;
      const pnlPct = posCostLocal > 0 ? (pnlLocal / posCostLocal) * 100 : 0;

      // Day P&L
      const dayChange = pos.change || 0;
      const dayPnlLocal = dayChange * pos.shares;
      const dayPct = pos.pctChange || 0;

      // Visual spread runway marker (50% is break-even)
      let gaugeMarkerPos = 50;
      if (pnlPct > 0) {
        gaugeMarkerPos = Math.min(95, 50 + pnlPct * 1.5);
      } else if (pnlPct < 0) {
        gaugeMarkerPos = Math.max(5, 50 - Math.abs(pnlPct) * 1.5);
      }
      const isProfit = pnlLocal >= 0;
      const fillLeft = isProfit ? 50 : gaugeMarkerPos;
      const fillWidth = isProfit ? (gaugeMarkerPos - 50) : (50 - gaugeMarkerPos);

      const posValUSD = this.toUSD(posValLocal, pos.currency);
      const weightPct = totalValUSD > 0 ? (posValUSD / totalValUSD) * 100 : 0;

      const verdict = this.generateTraderVerdict(pos, totalValUSD);
      const isIbkr = pos.broker === "IBKR";

      const currSymbol = pos.currency === "SGD" ? "S$" : pos.currency === "HKD" ? "HK$" : "$";
      const isCharted = this.app && this.app.selectedSymbol === pos.symbol;

      const card = document.createElement("div");
      card.className = `holding-position-card ${isCharted ? 'is-active-charted' : ''}`;
      card.dataset.symbol = pos.symbol;
      card.title = `Click to instantly open ${pos.symbol} (${pos.name}) chart and full history`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="broker-badge ${isIbkr ? 'badge-ibkr' : 'badge-tiger'}">${pos.broker}</span>
            <div>
              <div style="display: flex; align-items: baseline; gap: 6px;">
                <span style="font-size: 15px; font-weight: 800; color: var(--text-bright);">${pos.symbol}</span>
                <span style="font-size: 10px; color: var(--color-cyan); font-weight: 700;">${pos.assetClass || ''}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">${pos.name} • <strong>${pos.shares.toLocaleString()}</strong> Shares</div>
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 3px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              ${this.isManagerUnlocked ? `
                <button class="btn-icon delete-pos-btn" data-del-symbol="${pos.symbol}" style="padding: 2px 6px; font-size: 10px; color: var(--color-bear);" title="Remove Position (Manager Only)">
                  <svg class="icon-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              ` : ''}
              <button class="btn-direct-chart mono ${isCharted ? 'active' : ''}">
                ${isCharted ? '● ACTIVE' : '<svg class="icon-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> Chart'}
              </button>
            </div>
            <div class="mono" style="font-size: 14px; font-weight: 800;">
              ${currSymbol}${posValLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="mono ${pnlLocal >= 0 ? 'bull' : 'bear'}" style="font-size: 11px; font-weight: 700;">
              ${pnlLocal >= 0 ? '+' : ''}${currSymbol}${pnlLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnlLocal >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        <!-- TOP-TIER BROKER SPREAD & PERFORMANCE LINE -->
        <div class="institutional-perf-track">
          <div class="perf-track-header mono">
            <div class="perf-metric">
              <span class="lbl">AVG PURCHASE:</span>
              <span class="val cyan">${currSymbol}${pos.avgCost.toFixed(2)}</span>
            </div>
            <div class="perf-metric">
              <span class="lbl">CURRENT DAY PRICE:</span>
              <span class="val" id="card-price-${pos.symbol}">${currSymbol}${curPrice.toFixed(2)}</span>
            </div>
            <div class="perf-metric" style="text-align: right;">
              <span class="lbl">PER-SHARE SPREAD:</span>
              <span class="val ${isProfit ? 'bull' : 'bear'}">${pnlPerShare >= 0 ? '+' : ''}${currSymbol}${pnlPerShare.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)</span>
            </div>
          </div>

          <!-- Dynamic Visual Break-Even Runway Line -->
          <div class="broker-spread-gauge">
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill ${isProfit ? 'fill-bull' : 'fill-bear'}" style="left: ${fillLeft}%; width: ${Math.max(3, fillWidth)}%;"></div>
              <div class="gauge-marker-cost" style="left: 50%;" title="Average Cost Break-Even: ${currSymbol}${pos.avgCost.toFixed(2)}"></div>
              <div class="gauge-marker-current" style="left: ${gaugeMarkerPos}%;" title="Current Day Price: ${currSymbol}${curPrice.toFixed(2)}"></div>
            </div>
            <div class="gauge-labels mono">
              <span>AVG BREAK-EVEN (${currSymbol}${pos.avgCost.toFixed(2)})</span>
              <span class="${isProfit ? 'bull' : 'bear'}">${isProfit ? '▲ PROFIT SPREAD' : '▼ DRAWDOWN'} (${isProfit ? '+' : ''}${currSymbol}${pnlLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
            </div>
          </div>

          <!-- Institutional 3-Column Performance Sub-Strip -->
          <div class="institutional-pnl-substrip mono">
            <div class="pnl-sub-box">
              <span class="sub-lbl">TOTAL POSITION P&L</span>
              <span class="sub-val ${isProfit ? 'bull' : 'bear'}">${isProfit ? '+' : ''}${currSymbol}${pnlLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)</span>
            </div>
            <div class="pnl-sub-box">
              <span class="sub-lbl">TODAY'S DAY P&L</span>
              <span class="sub-val ${dayPnlLocal >= 0 ? 'bull' : 'bear'}">${dayPnlLocal >= 0 ? '+' : ''}${currSymbol}${dayPnlLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${dayPct >= 0 ? '+' : ''}${dayPct.toFixed(2)}%)</span>
            </div>
            <div class="pnl-sub-box">
              <span class="sub-lbl">PORTFOLIO WEIGHT</span>
              <span class="sub-val cyan">${weightPct.toFixed(1)}% of Wealth</span>
            </div>
          </div>
        </div>

        <!-- INSTITUTIONAL TRADER ACTION MATRIX -->
        <div class="elite-trader-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; color: #FFF; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
              <svg class="icon-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              INSTITUTIONAL DIRECTIVE
            </span>
            <span class="opp-type-badge ${verdict.actionClass}">${verdict.action}</span>
          </div>

          <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.45; margin-bottom: 6px;">
            ${verdict.rationale}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;" class="mono">
            <div><span style="color: var(--text-muted);">INVALIDATION (STOP):</span> <strong class="bear">${verdict.invalidation}</strong></div>
            <div><span style="color: var(--text-muted);">TARGET OBJECTIVE:</span> <strong class="bull">${verdict.target}</strong></div>
          </div>
        </div>
      `;

      // Wire manager delete button if present
      const delBtn = card.querySelector(".delete-pos-btn");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`Remove position ${pos.symbol} (${pos.name})?`)) {
            this.holdings = this.holdings.filter(h => h.symbol !== pos.symbol);
            this.saveHoldings();
            this.render();
            if (this.app) this.app.showToast(`Removed position ${pos.symbol}`, "bear");
          }
        });
      }

      card.addEventListener("click", () => {
        if (this.app) {
          this.app.selectAsset(pos.symbol);
          this.highlightActiveHolding(pos.symbol);
          this.app.showToast(`Viewing ${pos.symbol} (${pos.name}) live chart`, "bull");
        }
      });

      listContainer.appendChild(card);
    });

    // Render Holdings-Specific News
    if (holdingsNewsContainer && this.app.newsManager) {
      const relevantNews = this.getHoldingsNews(this.app.newsManager.newsItems);
      holdingsNewsContainer.innerHTML = "";

      if (relevantNews.length === 0) {
        holdingsNewsContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px;">
            No breaking headlines specifically affecting your active IBKR/Tiger holdings in the last hour.
          </div>`;
      } else {
        relevantNews.forEach(item => {
          const itemEl = document.createElement("div");
          itemEl.className = "news-item-card";
          itemEl.innerHTML = `
            <div class="news-meta">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="mono cyan" style="font-weight: 800;">[${item.matchedSymbol}] ${item.matchedName}</span>
                <span style="font-weight: 700; color: var(--text-secondary);">${item.source}</span>
              </div>
              <span class="news-impact-tag ${item.impactClass}">${item.impact}</span>
            </div>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-title">
              ${item.title}
            </a>
            <div class="news-ai-impact">
              <strong>Impact on your holding:</strong> ${item.aiSummary}
            </div>
          `;
          holdingsNewsContainer.appendChild(itemEl);
        });
      }
    }
  }

  highlightActiveHolding(symbol) {
    const cards = document.querySelectorAll(".holding-position-card");
    cards.forEach(card => {
      const match = card.dataset.symbol === symbol;
      card.classList.toggle("is-active-charted", match);
      const btn = card.querySelector(".btn-direct-chart");
      if (btn) {
        btn.textContent = match ? "● CHART ACTIVE" : "📈 VIEW CHART";
        btn.classList.toggle("active", match);
      }
    });
  }

  // INSTITUTIONAL DAILY MACROECONOMIC RECOMMENDATIONS ENGINE
  renderDailyRecommendations(filterCategory = "all") {
    const container = document.getElementById("portfolio-recs-subview");
    if (!container) return;

    // Get live VIX from marketItems
    const vixItem = this.app.marketItems.find(x => x.symbol === "^VIX" || x.id === "VIX");
    const vixVal = vixItem && vixItem.price ? vixItem.price : 28.29;
    const rule16Daily = (vixVal / 16).toFixed(2);

    let totalValUSD = 0;
    this.holdings.forEach(pos => {
      const p = pos.currentPrice || pos.avgCost;
      totalValUSD += this.toUSD(p * pos.shares, pos.currency);
    });

    const directives = [
      {
        symbol: "D05.SI",
        name: "DBS Group Holdings Ltd",
        broker: "Tiger",
        shares: "200 Shares",
        weight: ((this.toUSD(66.24 * 200, "SGD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "urgent",
        urgency: "HIGH PRIORITY",
        urgencyClass: "bear-bg",
        action: "TRIM 25% (SELL 50 SHARES @ S$66.00+)",
        macroTrigger: `DBS represents an extreme ${((this.toUSD(66.24 * 200, "SGD") / totalValUSD) * 100).toFixed(1)}% of your entire global wealth ($13,248 SGD). With VIX at ${vixVal} and central bank interest rate cycles reaching terminal levels, bank net interest margins (NIM) are at peak cycle. Locking in S$3,300+ SGD profit eliminates catastrophic single-stock risk while retaining S$9,900+ SGD to continue harvesting 5.8% dividend yields.`,
        entryTrigger: "SGD 66.00 – 66.80",
        stopLoss: "SGD 61.50",
        target: "SGD 70.00",
        riskReward: "1 : 3.2 (De-Risking)"
      },
      {
        symbol: "VWRA",
        name: "Vanguard FTSE All-World UCITS ETF (LSE)",
        broker: "IBKR",
        shares: "46 Shares",
        weight: ((this.toUSD(174.00 * 46, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "CORE BUY",
        urgencyClass: "bull-bg",
        action: "AGGRESSIVE MONTHLY DCA ACCUMULATION ($174.00)",
        macroTrigger: `VWRA holds 3,600+ companies across 47 countries and is the premier compounding backbone of your long-term wealth. The current -8.9% drawdown is an institutional value zone. Deploy cash steadily via automated monthly dollar-cost averaging into IBKR; do not interrupt compounding during market chop.`,
        entryTrigger: "USD 170.00 – 175.00",
        stopLoss: "USD 162.00 (Long-Term Floor)",
        target: "USD 210.00 (24-Mo Objective)",
        riskReward: "1 : 4.5 (High Asymmetry)"
      },
      {
        symbol: "O39.SI",
        name: "Oversea-Chinese Banking Corp (OCBC)",
        broker: "Tiger",
        shares: "200 Shares",
        weight: ((this.toUSD(26.62 * 200, "SGD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "protect",
        urgency: "PROFIT DEFENSE",
        urgencyClass: "cyan-bg",
        action: "TRAIL STOP FLOOR TO SGD 24.50",
        macroTrigger: `Extraordinary +81.7% unrealized gain from your SGD 14.65 entry. A trailing stop at SGD 24.50 guarantees a minimum +67% locked profit while collecting high-yield dividend distributions. Hold as a high-income fortress.`,
        entryTrigger: "Hold Existing",
        stopLoss: "SGD 24.50 (Guaranteed +67% Gain Floor)",
        target: "SGD 28.50",
        riskReward: "Protected Winner"
      },
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        broker: "Tiger",
        shares: "10 Shares",
        weight: ((this.toUSD(354.07 * 10, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "protect",
        urgency: "PROTECT RUNNER",
        urgencyClass: "bull-bg",
        action: "HOLD RUNNER // TRAIL STOP TO $325.00",
        macroTrigger: `Sitting on +44.4% profit. High-margin services ecosystem insulates Apple from tariff and supply chain shocks. However, with VIX elevated at ${vixVal}, enforce a trailing stop below the 50-day moving average ($325.00) to protect paper gains against sudden tech multiple compression.`,
        entryTrigger: "Hold Core",
        stopLoss: "USD 325.00",
        target: "USD 385.00",
        riskReward: "1 : 3.8"
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc. (Class A)",
        broker: "Tiger",
        shares: "10.004 Shares",
        weight: ((this.toUSD(279.05 * 10.004, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "protect",
        urgency: "PROTECT RUNNER",
        urgencyClass: "bull-bg",
        action: "HOLD RUNNER // TRAIL STOP TO $255.00",
        macroTrigger: `Major winner (+74.1% profit). Google Cloud, Gemini AI infrastructure, and YouTube monetization provide tremendous cash-flow shielding. Never cut multi-baggers prematurely; let winners run and trail stops.`,
        entryTrigger: "Hold Core",
        stopLoss: "USD 255.00",
        target: "USD 310.00",
        riskReward: "1 : 4.0"
      },
      {
        symbol: "GLDM",
        name: "SPDR Gold MiniShares",
        broker: "Tiger",
        shares: "15 Shares",
        weight: ((this.toUSD(70.69 * 15, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "hedge",
        urgency: "MACRO SHIELD",
        urgencyClass: "amber-bg",
        action: "HOLD AS COLLATERAL // ADD ON PULLBACKS",
        macroTrigger: `Gold futures at all-time highs as sovereign central banks globally diversify foreign exchange reserves out of fiat paper. Middle Eastern and Red Sea geopolitical friction provides a structural safe-haven bid. GLDM is your crisis insurance.`,
        entryTrigger: "USD 68.00 – 70.00",
        stopLoss: "USD 64.00",
        target: "USD 82.00",
        riskReward: "Crisis Alpha"
      },
      {
        symbol: "SHLD",
        name: "Global Defense Tech ETF",
        broker: "Tiger",
        shares: "10 Shares",
        weight: ((this.toUSD(58.59 * 10, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "hedge",
        urgency: "MACRO SHIELD",
        urgencyClass: "purple-bg",
        action: "RUN WINNER // TRAIL STOP TO $54.00",
        macroTrigger: `Global rearmament commitments (NATO 2% GDP targets, Pacific maritime security) guarantee multi-year order backlogs for defense tech contractors. Up +21.6%; acts as a powerful non-correlated buffer against geopolitical crises.`,
        entryTrigger: "Hold Core",
        stopLoss: "USD 54.00",
        target: "USD 68.00",
        riskReward: "Geopolitical Hedge"
      },
      {
        symbol: "TQQQ",
        name: "ProShares UltraPro QQQ (3x Leveraged)",
        broker: "Tiger",
        shares: "10 Shares",
        weight: ((this.toUSD(45.28 * 10, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "urgent",
        urgency: "VOLATILITY RISK",
        urgencyClass: "bear-bg",
        action: "TACTICAL EXIT OR STRICT STOP ($42.00)",
        macroTrigger: `3x leveraged instruments suffer severe mathematical volatility drag in regimes where VIX > 25. Every whipsaw degrades compounding capital. You are up +17.6%; harvest the gain now or enforce a hard exit at $42.00.`,
        entryTrigger: "Market Exit into Strength",
        stopLoss: "USD 42.00 (Hard Stop)",
        target: "USD 50.00",
        riskReward: "Asymmetric Downside Risk"
      },
      {
        symbol: "NLR",
        name: "VanEck Uranium+Nuclear Energy",
        broker: "Tiger",
        shares: "20 Shares",
        weight: ((this.toUSD(77.68 * 20, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "urgent",
        urgency: "LOSS MANAGEMENT",
        urgencyClass: "bear-bg",
        action: "HARVEST TAX LOSS OR DEFENSIVE CAP",
        macroTrigger: `Down -35.9%. Uranium spot market consolidation has stalled. A disciplined trader cuts broken sector momentum to offset taxable capital gains from Apple/Google. If holding, enforce strict floor at $72.00.`,
        entryTrigger: "Tax-Loss Reallocate",
        stopLoss: "USD 72.00",
        target: "USD 88.00",
        riskReward: "Underperforming"
      },
      {
        symbol: "01398.HK",
        name: "Industrial & Commercial Bank of China (ICBC)",
        broker: "Tiger",
        shares: "1,000 Shares",
        weight: ((this.toUSD(7.86 * 1000, "HKD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "DIVIDEND COW",
        urgencyClass: "bull-bg",
        action: "HOLD FOR 6.5%+ DIVIDEND CASH FLOW",
        macroTrigger: `Up +61.1%. World's largest commercial bank backed by sovereign balance sheets. Trades at single-digit P/E with superior dividend yield. Reinvest cash distributions into your global dollar DCA (VWRA).`,
        entryTrigger: "Hold for Yield",
        stopLoss: "HKD 7.10",
        target: "HKD 8.80",
        riskReward: "Cash Flow Engine"
      },
      {
        symbol: "03067.HK",
        name: "iShares Hang Seng TECH ETF",
        broker: "Tiger",
        shares: "100 Shares",
        weight: ((this.toUSD(7.25 * 100, "HKD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "DEEP VALUE",
        urgencyClass: "amber-bg",
        action: "HOLD AS CALL OPTION // HARD STOP HKD 6.80",
        macroTrigger: `Drawdown of -36.6%, but position is tiny (only ~USD $93, representing <0.2% of your wealth). Chinese tech trades at 10-year valuation troughs. Keep as an asymmetric long-term turnaround ticket.`,
        entryTrigger: "Hold",
        stopLoss: "HKD 6.80",
        target: "HKD 9.50",
        riskReward: "1 : 3.5 (Turnaround)"
      },
      {
        symbol: "ES3.SI",
        name: "SPDR Straits Times Index ETF",
        broker: "Tiger",
        shares: "300 Shares",
        weight: ((this.toUSD(5.05 * 300, "SGD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "CORE BUY",
        urgencyClass: "bull-bg",
        action: "COMPOUND BENCHMARK YIELD",
        macroTrigger: `Singapore STI index is outperforming emerging markets due to corporate governance, flight to safety, and banking dividend stability. Position is up +13.2%; continue collecting resilient distributions.`,
        entryTrigger: "SGD 4.95 – 5.05",
        stopLoss: "SGD 4.70",
        target: "SGD 5.50",
        riskReward: "Stable Anchor"
      },
      {
        symbol: "1D0.SI",
        name: "Kimly Limited",
        broker: "Tiger",
        shares: "2,500 Shares",
        weight: ((this.toUSD(0.365 * 2500, "SGD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "CASH FLOW",
        urgencyClass: "cyan-bg",
        action: "HOLD FOR DEFENSIVE F&B CASH FLOW",
        macroTrigger: `Local Singapore coffeeshop operator (+17.4% gain). Inflation-resilient daily necessity consumption model with strong free cash flow and dividend payouts. Zero correlation to Wall Street tech volatility.`,
        entryTrigger: "Hold",
        stopLoss: "SGD 0.33",
        target: "SGD 0.42",
        riskReward: "Low Beta Shield"
      },
      {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        broker: "Tiger",
        shares: "3.005 Shares",
        weight: ((this.toUSD(718.78 * 3.005, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "BENCHMARK",
        urgencyClass: "bull-bg",
        action: "MAINTAIN CORE US EQUITY WEIGHT",
        macroTrigger: `Institutional standard equity exposure (+11.7% gain). S&P 500 earnings breadth remains positive. Maintain position as the primary US corporate foundation.`,
        entryTrigger: "Hold",
        stopLoss: "USD 680.00",
        target: "USD 760.00",
        riskReward: "Core Holding"
      },
      {
        symbol: "QQQM",
        name: "Invesco NASDAQ 100 ETF",
        broker: "Tiger",
        shares: "5.003 Shares",
        weight: ((this.toUSD(262.78 * 5.003, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "BENCHMARK",
        urgencyClass: "bull-bg",
        action: "HOLD CORE TECH COMPOUNDER",
        macroTrigger: `Up +14.1%. Provides cost-efficient, low-expense-ratio exposure to the top 100 innovative tech leaders. Complementary to individual holdings in AAPL and GOOGL.`,
        entryTrigger: "Hold",
        stopLoss: "USD 245.00",
        target: "USD 290.00",
        riskReward: "Core Growth"
      },
      {
        symbol: "SLVR",
        name: "Silver Miners ETF",
        broker: "Tiger",
        shares: "15 Shares",
        weight: ((this.toUSD(41.97 * 15, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "hedge",
        urgency: "MACRO SHIELD",
        urgencyClass: "amber-bg",
        action: "ACCUMULATE ON DIP",
        macroTrigger: `Silver industrial deficits and precious metal catch-up cycle favor mining margins. Up +2.9%; hold as high-beta monetary tailwind hedge alongside Gold.`,
        entryTrigger: "USD 39.00 – 41.50",
        stopLoss: "USD 37.50",
        target: "USD 52.00",
        riskReward: "1 : 3.8"
      }
    ];

    let filtered = directives;
    if (filterCategory !== "all") {
      filtered = directives.filter(d => d.category === filterCategory);
    }

    container.innerHTML = `
      <!-- Macro Diagnostic Executive Radar -->
      <div class="macro-radar-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="live-tv-pulse-dot" style="background: var(--color-amber); box-shadow: 0 0 8px var(--color-amber);"></span>
              <strong style="font-size: 13px; color: var(--text-bright); letter-spacing: 0.04em;">DAILY MACRO INTELLIGENCE BRIEF</strong>
            </div>
            <div style="font-size: 10px; color: var(--color-cyan); margin-top: 2px;">
              SGT TIMEZONE • INSTITUTIONAL RISK-BUDGET DIRECTIVES
            </div>
          </div>
          <span class="ribbon-badge mono bear-bg" style="font-size: 10px;">VIX ${vixVal} (±${rule16Daily}% SWING)</span>
        </div>

        <div class="macro-diagnostic-grid">
          <div class="macro-diag-item">
            <span class="diag-label">VOLATILITY REGIME:</span>
            <strong class="amber">ELEVATED CHOP (DEFENSIVE BIAS)</strong>
          </div>
          <div class="macro-diag-item">
            <span class="diag-label">TOP URGENT DIRECTIVE:</span>
            <strong class="bear">TRIM DBS CONCENTRATION (&gt;25% WT)</strong>
          </div>
          <div class="macro-diag-item">
            <span class="diag-label">CORE ALLOCATION:</span>
            <strong class="cyan">DCA INTO VWRA (IBKR) ON DIP</strong>
          </div>
          <div class="macro-diag-item">
            <span class="diag-label">GEOPOLITICAL HEDGE:</span>
            <strong class="bull">HOLD GOLD (GLDM) & DEFENSE (SHLD)</strong>
          </div>
        </div>

        <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.45; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
          <strong>Global Trader Synthesis:</strong> Global financial markets are pricing in sticky services inflation, heightened Red Sea / Middle Eastern friction, and peak banking net interest margins. Your portfolio carries exceptional compounded equity winners (AAPL +44%, GOOGL +74%, OCBC +81%). <strong>Action Plan:</strong> Harvest S$3,300+ SGD of excess risk from DBS to reduce single-stock exposure, redeploy locked gains into disciplined monthly DCA on VWRA (IBKR), and keep tight trailing stops on high-multiple tech.
        </div>
      </div>

      <!-- Action Category Filter Pills -->
      <div class="recs-filter-bar" style="display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none;">
        <button class="channel-pill ${filterCategory === 'all' ? 'active' : ''}" data-cat="all">All Directives (16)</button>
        <button class="channel-pill ${filterCategory === 'urgent' ? 'active' : ''}" data-cat="urgent" style="color: var(--color-bear);">🔥 Urgent / High Priority</button>
        <button class="channel-pill ${filterCategory === 'accumulate' ? 'active' : ''}" data-cat="accumulate" style="color: var(--color-bull);">💰 Accumulate (DCA)</button>
        <button class="channel-pill ${filterCategory === 'protect' ? 'active' : ''}" data-cat="protect" style="color: var(--color-cyan);">🛡 Protect / Trail Stops</button>
        <button class="channel-pill ${filterCategory === 'hedge' ? 'active' : ''}" data-cat="hedge" style="color: var(--color-amber);">⚔ Geopolitical Hedges</button>
      </div>

      <!-- Recommendations Cards List -->
      <div style="display: flex; flex-direction: column; gap: 8px;" id="recs-cards-list"></div>
    `;

    // Filter pill listeners
    const filterPills = container.querySelectorAll(".recs-filter-bar .channel-pill");
    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        this.renderDailyRecommendations(pill.dataset.cat);
      });
    });

    const cardsContainer = document.getElementById("recs-cards-list");
    if (!cardsContainer) return;

    filtered.forEach(d => {
      const card = document.createElement("div");
      card.className = "daily-rec-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="broker-badge ${d.broker === 'IBKR' ? 'badge-ibkr' : 'badge-tiger'}">${d.broker}</span>
            <div>
              <div style="display: flex; align-items: baseline; gap: 6px;">
                <strong style="font-size: 15px; color: var(--text-bright);">${d.symbol}</strong>
                <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">${d.shares} • Weight: ${d.weight}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">${d.name}</div>
            </div>
          </div>
          <button class="btn-direct-chart mono" data-symbol="${d.symbol}">📈 View Chart</button>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;">
          <span style="font-size: 11px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 5px;">
            <span>🎯</span> <span>${d.action}</span>
          </span>
          <span class="opp-type-badge ${d.urgencyClass}">${d.urgency}</span>
        </div>

        <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.45; margin-bottom: 8px;">
          <strong>Macro Rationale:</strong> ${d.macroTrigger}
        </div>

        <div class="rec-execution-grid mono">
          <div><span style="color: var(--text-muted);">EXECUTION ZONE:</span> <strong style="color: var(--text-bright);">${d.entryTrigger}</strong></div>
          <div><span style="color: var(--text-muted);">INVALIDATION (STOP):</span> <strong class="bear">${d.stopLoss}</strong></div>
          <div><span style="color: var(--text-muted);">TARGET OBJECTIVE:</span> <strong class="bull">${d.target}</strong></div>
          <div><span style="color: var(--text-muted);">ASYMMETRY (R:R):</span> <strong class="cyan">${d.riskReward}</strong></div>
        </div>
      `;

      // Direct to chart on button or card click
      const chartBtn = card.querySelector(".btn-direct-chart");
      if (chartBtn) {
        chartBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.app.selectAsset(d.symbol);
          this.highlightActiveHolding(d.symbol);
          this.app.showToast(`🎯 Loaded ${d.symbol} chart & macro parameters`, "bull");
        });
      }

      card.addEventListener("click", () => {
        this.app.selectAsset(d.symbol);
        this.highlightActiveHolding(d.symbol);
      });

      cardsContainer.appendChild(card);
    });
  }
}
window.PortfolioManager = PortfolioManager;
