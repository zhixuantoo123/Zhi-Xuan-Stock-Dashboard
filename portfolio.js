// Portfolio Management & Elite Global Trader Decision Engine
// Fully loaded with verified holdings from Tiger Brokers (Account 50280676) and IBKR (Account U18729869)
class PortfolioManager {
  constructor(app) {
    this.app = app;
    this.storageKey = "user_holdings_v5";
    try {
      localStorage.removeItem("user_holdings_v4");
      localStorage.removeItem("user_holdings_v3");
      localStorage.removeItem("verified_portfolio_holdings");
    } catch(e) {}

    // Base FX Rates relative to 1 SGD (Base Currency)
    this.fxRates = {
      SGD: 1.0000,
      USD: 0.7749,
      HKD: 6.0736,
      CNH: 5.1618,
      AUD: 1.1671,
      NZD: 1.4157
    };

    // Legacy FX mapping compatibility
    this.fx = {
      USDSGD: 1 / 0.7749,
      USDHKD: 6.0736 / 0.7749
    };

    this.currencies = [
      { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$", rateDesc: "1 SGD = 1.0000 SGD" },
      { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$", rateDesc: "1 SGD = 0.7749 USD" },
      { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$", rateDesc: "1 SGD = 6.0736 HKD" },
      { code: "CNH", name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥", rateDesc: "1 SGD = 5.1618 CNH" },
      { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$", rateDesc: "1 SGD = 1.1671 AUD" },
      { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿", symbol: "NZ$", rateDesc: "1 SGD = 1.4157 NZD" }
    ];

    this.displayCurrency = localStorage.getItem("portfolio_currency") || "SGD";
    this.isMasked = localStorage.getItem("portfolio_privacy_masked") === "true";
    this.currentCountryFilter = "All"; // "All" | "US" | "HK" | "SG"
    this.searchFilter = "";
    this.currentPnlSubtab = "securities"; // "securities" | "funds"

    this.holdings = this.loadHoldings();
    // Guaranteed enforcement of 48 shares and $190.64 average cost for VWRA across any client session
    if (this.holdings) {
      const vwra = this.holdings.find(h => h.symbol === "VWRA" || h.id === "ibkr-vwra");
      if (vwra) {
        vwra.shares = 48;
        vwra.avgCost = 190.64;
        vwra.broker = "IBKR & Tiger";
      }
    }
    this.cashBalances = {
      tigerUSD: 181.29,
      tigerSGD: 172.00,
      ibkrUSD: 66.43,
      ibkrSGD: 60.55
    };

    this.container = document.getElementById("portfolio-view-container");
    this.initUI();
    this.initCurrencySelector();
    this.updatePrivacyUI();
    this.render();
    this.fetchLiveFxRates();
  }

  loadHoldings() {
    // Exact holdings extracted from statements as of Nov 25, 2026
    const verifiedHoldings = [
      // --- INTERACTIVE BROKERS (IBKR) & TIGER BROKERS (TRWBUKETF) ---
      {
        id: "ibkr-vwra",
        symbol: "VWRA",
        rawSymbol: "VWRA",
        name: "Vanguard FTSE All-World UCITS ETF (LSE)",
        broker: "IBKR & Tiger",
        shares: 48,
        avgCost: 190.64,
        currentPrice: 174.00,
        change: 1.15,
        pctChange: 0.66,
        currency: "USD",
        market: "US", // Segmented as US / Global ETF
        assetClass: "Equity Index ETF",
        totalPnl: 974.56,
        unrealizedPnl: 440.25,
        realizedPnl: 534.31,
        notes: "Core long-term diversified global wealth engine (Irish Domiciled, Accumulating). 48 shares total: 46 on IBKR + 2 added on Tiger UK on Nov 27, 2026 @ $180.01."
      },

      // --- TIGER BROKERS (TigerTrade - 50280676) ---
      // SINGAPORE (SGX) - Verified SG Statement Total: +6,671.35 SGD (Realized: 0.00 SGD)
      {
        id: "tiger-es3",
        symbol: "ES3.SI",
        rawSymbol: "ES3",
        name: "SS SPDR STI ETF",
        broker: "Tiger",
        shares: 300,
        avgCost: 4.46,
        currentPrice: 5.064,
        change: 0.040,
        pctChange: 0.80,
        currency: "SGD",
        market: "SG",
        assetClass: "Singapore Equity Index",
        totalPnl: 234.78,
        unrealizedPnl: 181.38,
        realizedPnl: 0.00,
        notes: "Domestic benchmark exposure with resilient dividend yield."
      },
      {
        id: "tiger-d05",
        symbol: "D05.SI",
        rawSymbol: "D05",
        name: "DBS",
        broker: "Tiger",
        shares: 200,
        avgCost: 52.66,
        currentPrice: 66.24,
        change: 0.82,
        pctChange: 1.25,
        currency: "SGD",
        market: "SG",
        assetClass: "Financials / Banking",
        totalPnl: 3440.52,
        unrealizedPnl: 2642.52,
        realizedPnl: 0.00,
        notes: "Mega-cap dividend leader. Recent quarterly dividend paid SGD 162.00."
      },
      {
        id: "tiger-1d0",
        symbol: "1D0.SI",
        rawSymbol: "1D0",
        name: "Kimly",
        broker: "Tiger",
        shares: 2500,
        avgCost: 0.311,
        currentPrice: 0.365,
        change: 0.005,
        pctChange: 1.39,
        currency: "SGD",
        market: "SG",
        assetClass: "Consumer Discretionary",
        totalPnl: 197.49,
        unrealizedPnl: 122.49,
        realizedPnl: 0.00,
        notes: "Cash-flow positive local coffee shop operator (+17.4% gain)."
      },
      {
        id: "tiger-o39",
        symbol: "O39.SI",
        rawSymbol: "O39",
        name: "OCBC Bank",
        broker: "Tiger",
        shares: 200,
        avgCost: 14.65,
        currentPrice: 26.62,
        change: 0.35,
        pctChange: 1.33,
        currency: "SGD",
        market: "SG",
        assetClass: "Financials / Banking",
        totalPnl: 2798.56,
        unrealizedPnl: 2392.56,
        realizedPnl: 0.00,
        notes: "High-yield compounding stalwart (+81.7% unrealized gain)."
      },

      // HONG KONG (HKEX) - Verified HK Statement Total: +3,183.28 HKD (Realized: 0.00 HKD)
      {
        id: "tiger-03067",
        symbol: "03067.HK",
        rawSymbol: "03067",
        name: "ISHARESHSTECH",
        broker: "Tiger",
        shares: 100,
        avgCost: 11.44,
        currentPrice: 7.68,
        change: -0.12,
        pctChange: -1.54,
        currency: "HKD",
        market: "HK",
        assetClass: "China Tech Growth ETF",
        totalPnl: -364.13,
        unrealizedPnl: -376.13,
        realizedPnl: 0.00,
        notes: "Hang Seng Tech ETF tracking China innovation leaders."
      },
      {
        id: "tiger-01398",
        symbol: "01398.HK",
        rawSymbol: "01398",
        name: "ICBC",
        broker: "Tiger",
        shares: 1000,
        avgCost: 4.84,
        currentPrice: 7.61,
        change: 0.08,
        pctChange: 1.06,
        currency: "HKD",
        market: "HK",
        assetClass: "Chinese Banking / State-Owned",
        totalPnl: 3547.41,
        unrealizedPnl: 2770.57,
        realizedPnl: 0.00,
        notes: "High-dividend state enterprise yielding generous payout (+58.6% gain)."
      },

      // US STOCKS & ETFS (Tiger) - Verified US Statement Total: +3,434.65 USD (Realized: +534.31 USD)
      {
        id: "tiger-aapl",
        symbol: "AAPL",
        rawSymbol: "AAPL",
        name: "Apple Inc.",
        broker: "Tiger",
        shares: 10,
        avgCost: 245.14,
        currentPrice: 354.07,
        change: 3.20,
        pctChange: 0.91,
        currency: "USD",
        market: "US",
        assetClass: "Mega-Cap Tech",
        totalPnl: 1089.30,
        unrealizedPnl: 1089.30,
        realizedPnl: 0.00,
        notes: "Capital compounding juggernaut (+44.4% unrealized gain)."
      },
      {
        id: "tiger-googl",
        symbol: "GOOGL",
        rawSymbol: "GOOGL",
        name: "Alphabet Inc. (Class A)",
        broker: "Tiger",
        shares: 10.0044,
        avgCost: 160.28,
        currentPrice: 279.05,
        change: 2.15,
        pctChange: 0.78,
        currency: "USD",
        market: "US",
        assetClass: "Mega-Cap Tech / Cloud / AI",
        totalPnl: 1188.22,
        unrealizedPnl: 1188.22,
        realizedPnl: 0.00,
        notes: "Outperformer (+74.1% unrealized gain). Strong cloud and search moat."
      },
      {
        id: "tiger-spy",
        symbol: "SPY",
        rawSymbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        broker: "Tiger",
        shares: 3.00519,
        avgCost: 643.57,
        currentPrice: 718.78,
        change: -4.50,
        pctChange: -0.62,
        currency: "USD",
        market: "US",
        assetClass: "US Broad Market ETF",
        totalPnl: 226.02,
        unrealizedPnl: 226.02,
        realizedPnl: 0.00,
        notes: "Baseline institutional equity standard (+11.7% gain)."
      },
      {
        id: "tiger-qqqm",
        symbol: "QQQM",
        rawSymbol: "QQQM",
        name: "Invesco NASDAQ 100 ETF",
        broker: "Tiger",
        shares: 5.00355,
        avgCost: 230.33,
        currentPrice: 262.78,
        change: -2.80,
        pctChange: -1.05,
        currency: "USD",
        market: "US",
        assetClass: "Tech Growth ETF",
        totalPnl: 162.37,
        unrealizedPnl: 162.37,
        realizedPnl: 0.00,
        notes: "Core tech exposure (+14.1% gain)."
      },
      {
        id: "tiger-gldm",
        symbol: "GLDM",
        rawSymbol: "GLDM",
        name: "SPDR Gold MiniShares Trust",
        broker: "Tiger",
        shares: 20,
        avgCost: 62.23,
        currentPrice: 70.26,
        change: 0.85,
        pctChange: 1.22,
        currency: "USD",
        market: "US",
        assetClass: "Precious Metals",
        totalPnl: 160.60,
        unrealizedPnl: 160.60,
        realizedPnl: 0.00,
        notes: "Sovereign currency hedge and geopolitical insurance (+12.9% gain)."
      },
      {
        id: "tiger-shld",
        symbol: "SHLD",
        rawSymbol: "SHLD",
        name: "Global X Defense Tech ETF",
        broker: "Tiger",
        shares: 10,
        avgCost: 53.09,
        currentPrice: 57.72,
        change: 0.45,
        pctChange: 0.79,
        currency: "USD",
        market: "US",
        assetClass: "Aerospace & Defense",
        totalPnl: 46.30,
        unrealizedPnl: 46.30,
        realizedPnl: 0.00,
        notes: "Structural beneficiary of rising global defense expenditures (+8.7% gain)."
      },
      {
        id: "tiger-slvr",
        symbol: "SLVR",
        rawSymbol: "SLVR",
        name: "Sprott Silver Miners & Physical Silver",
        broker: "Tiger",
        shares: 20,
        avgCost: 43.61,
        currentPrice: 36.07,
        change: -0.65,
        pctChange: -1.77,
        currency: "USD",
        market: "US",
        assetClass: "Precious Metals / Industrial",
        totalPnl: -150.80,
        unrealizedPnl: -150.80,
        realizedPnl: 0.00,
        notes: "Correction phase (-17.3% drawdown). Volatile high-beta commodity asset."
      },
      {
        id: "tiger-nlr",
        symbol: "NLR",
        rawSymbol: "NLR",
        name: "VanEck Uranium and Nuclear Energy ETF",
        broker: "Tiger",
        shares: 4,
        avgCost: 139.75,
        currentPrice: 77.93,
        change: 0.90,
        pctChange: 1.17,
        currency: "USD",
        market: "US",
        assetClass: "Clean Energy / Nuclear",
        totalPnl: -247.28,
        unrealizedPnl: -247.28,
        realizedPnl: 0.00,
        notes: "Clean energy theme position."
      },
      {
        id: "tiger-tqqq",
        symbol: "TQQQ",
        rawSymbol: "TQQQ",
        name: "ProShares UltraPro QQQ (3x Leveraged)",
        broker: "Tiger",
        shares: 4,
        avgCost: 49.85,
        currentPrice: 46.19,
        change: -1.40,
        pctChange: -2.94,
        currency: "USD",
        market: "US",
        assetClass: "3x Daily Leverage ETF",
        totalPnl: -14.64,
        unrealizedPnl: -14.64,
        realizedPnl: 0.00,
        notes: "Tactical trading instrument."
      }
    ];

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
      if (editToolbar) {
        editToolbar.classList.add("is-unlocked");
        editToolbar.style.display = "block";
      }
      if (authBtn) {
        authBtn.innerHTML = "🔓 Manager Mode";
        authBtn.classList.add("unlocked");
      }
    } else {
      this.isManagerUnlocked = false;
      if (editToolbar) {
        editToolbar.classList.remove("is-unlocked");
        editToolbar.style.display = "none";
      }
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

    // Portfolio 4-Way Subview Switcher (Holdings, Allocation & Risk, Dividends, Directives)
    const subtabs = [
      { id: "btn-port-tab-holdings", viewId: "portfolio-holdings-subview", name: "holdings" },
      { id: "btn-port-tab-analytics", viewId: "portfolio-analytics-subview", name: "analytics", render: () => this.renderAnalytics() },
      { id: "btn-port-tab-dividends", viewId: "portfolio-dividends-subview", name: "dividends", render: () => this.renderDividends() },
      { id: "btn-port-tab-recs", viewId: "portfolio-recs-subview", name: "recommendations", render: () => this.renderDailyRecommendations() }
    ];

    subtabs.forEach(tab => {
      const btn = document.getElementById(tab.id);
      if (btn) {
        btn.addEventListener("click", () => {
          subtabs.forEach(t => {
            const b = document.getElementById(t.id);
            const v = document.getElementById(t.viewId);
            if (b) b.classList.toggle("active", t.name === tab.name);
            if (v) v.style.display = t.name === tab.name ? "flex" : "none";
          });
          this.currentSubview = tab.name;
          if (tab.render) tab.render();
        });
      }
    });

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
    // Guaranteed enforcement of 48 shares and $190.64 average cost for VWRA across any client session
    if (this.holdings) {
      const vwra = this.holdings.find(h => h.symbol === "VWRA" || h.id === "ibkr-vwra");
      if (vwra) {
        vwra.shares = 48;
        vwra.avgCost = 190.64;
        vwra.broker = "IBKR & Tiger";
      }
    }
          this.render();
          this.app.showToast("Holdings reloaded from statements", "bull");
        }
      });
    }
    if (importBtn && fileInput) {
      importBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => this.handleCSVUpload(e));
    }

    // Privacy Masking Toggle
    const privacyBtn = document.getElementById("btn-portfolio-privacy");
    if (privacyBtn) {
      privacyBtn.addEventListener("click", () => this.togglePrivacy());
    }

    // Stock P&L Country Segmentation Pills (All, US, HK, SG)
    const countryPills = document.querySelectorAll(".country-pill");
    countryPills.forEach(pill => {
      pill.addEventListener("click", () => {
        countryPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentCountryFilter = pill.dataset.country || "All";
        this.render();
      });
    });

    // Stock P&L Search Box
    const searchInput = document.getElementById("pnl-stock-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchFilter = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    // Stock P&L Securities vs Funds Subtab
    const pnlTabs = document.querySelectorAll(".pnl-type-tab");
    pnlTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        pnlTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentPnlSubtab = tab.dataset.type || "securities";
        this.render();
      });
    });
  }

  unlockPortfolio() {
    this.isManagerUnlocked = true;
    sessionStorage.setItem("portfolio_manager_unlocked", "true");
    const editToolbar = document.getElementById("manager-edit-toolbar");
    const authBtn = document.getElementById("btn-manager-auth");
    if (editToolbar) {
      editToolbar.classList.add("is-unlocked");
      editToolbar.style.display = "block";
    }
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
    if (editToolbar) {
      editToolbar.classList.remove("is-unlocked");
      editToolbar.style.display = "none";
    }
    if (authBtn) {
      authBtn.innerHTML = '<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1.5 1.5L16 7l-2-2-4 4-2-2-4 4 2 2-3 3 1.5 1.5L6 17l2 2 4-4-2-2 4-4 1.5 1.5 1.5-1.5z"></path></svg> <span>Manager Login</span>';
      authBtn.classList.remove("unlocked");
    }
    this.render();
    if (this.app) this.app.showToast("Portfolio locked to View-Only mode", "bull");
  }

  // Interactive Multi-Currency Selector Dropdown
  initCurrencySelector() {
    const btn = document.getElementById("btn-currency-selector");
    const menu = document.getElementById("currency-dropdown-menu");
    if (!btn || !menu) return;

    this.renderCurrencyDropdown();

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  renderCurrencyDropdown() {
    const menu = document.getElementById("currency-dropdown-menu");
    const activeFlag = document.getElementById("curr-active-flag");
    const activeCode = document.getElementById("curr-active-code");
    if (!menu) return;

    const activeCurr = this.currencies.find(c => c.code === this.displayCurrency) || this.currencies[0];
    if (activeFlag) activeFlag.textContent = activeCurr.flag;
    if (activeCode) activeCode.textContent = activeCurr.code;

    menu.innerHTML = this.currencies.map(c => {
      const isSel = c.code === this.displayCurrency;
      return `
        <div class="curr-dropdown-row ${isSel ? 'active' : ''}" data-code="${c.code}">
          <div class="curr-dropdown-left">
            <span class="curr-dropdown-flag">${c.flag}</span>
            <div class="curr-dropdown-meta">
              <span class="curr-dropdown-code mono">${c.code}</span>
              <span class="curr-dropdown-desc">${c.rateDesc}</span>
            </div>
          </div>
          <span class="curr-dropdown-check">${isSel ? '✓' : ''}</span>
        </div>
      `;
    }).join("");

    menu.querySelectorAll(".curr-dropdown-row").forEach(row => {
      row.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = row.dataset.code;
        if (code && this.currencies.some(c => c.code === code)) {
          this.setCurrency(code);
          menu.classList.remove("open");
          const btn = document.getElementById("btn-currency-selector");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  setCurrency(code) {
    this.displayCurrency = code;
    localStorage.setItem("portfolio_currency", code);
    this.renderCurrencyDropdown();
    this.render();
    if (this.app) {
      this.app.showToast(`Portfolio converted to ${code}`, "cyan");
    }
  }

  // Privacy Masking (••••••)
  togglePrivacy() {
    this.isMasked = !this.isMasked;
    localStorage.setItem("portfolio_privacy_masked", this.isMasked ? "true" : "false");
    this.updatePrivacyUI();
    this.render();
    if (this.app) {
      this.app.showToast(this.isMasked ? "Portfolio privacy mode enabled (Balances masked)" : "Portfolio balances revealed", "bull");
    }
  }

  updatePrivacyUI() {
    const openIcon = document.getElementById("privacy-icon-open");
    const closedIcon = document.getElementById("privacy-icon-closed");
    const btn = document.getElementById("btn-portfolio-privacy");
    if (openIcon && closedIcon) {
      openIcon.style.display = this.isMasked ? "none" : "block";
      closedIcon.style.display = this.isMasked ? "block" : "none";
    }
    if (btn) {
      btn.classList.toggle("active", this.isMasked);
      btn.title = this.isMasked ? "Private Mode Active (Click to Reveal Balances)" : "Click to Mask Private Balances (••••••)";
    }
  }

  // Base converter: from holding currency to SGD base
  async fetchLiveFxRates() {
    const CACHE_KEY = "live_fx_rates_sgd_cache";
    const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, rates } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && rates) {
          this.applyFxRates(rates);
          return;
        }
      }
    } catch (e) {
      console.warn("Error reading FX cache:", e);
    }

    try {
      // Primary: Open ER API free tier (no API key required)
      const res = await fetch("https://open.er-api.com/v6/latest/SGD");
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const rates = {
            SGD: 1.0,
            USD: Number(data.rates.USD) || 0.7749,
            HKD: Number(data.rates.HKD) || 6.0736,
            CNH: Number(data.rates.CNH || data.rates.CNY) || 5.1618,
            AUD: Number(data.rates.AUD) || 1.1671,
            NZD: Number(data.rates.NZD) || 1.4157
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates }));
          this.applyFxRates(rates);
          return;
        }
      }
    } catch (err) {
      console.warn("Primary FX fetch failed, trying fallback:", err);
    }

    try {
      // Fallback: Frankfurter free API
      const res = await fetch("https://api.frankfurter.app/latest?from=SGD");
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const rates = {
            SGD: 1.0,
            USD: Number(data.rates.USD) || this.fxRates.USD,
            HKD: Number(data.rates.HKD) || this.fxRates.HKD,
            CNH: Number(data.rates.CNH || data.rates.CNY) || this.fxRates.CNH,
            AUD: Number(data.rates.AUD) || this.fxRates.AUD,
            NZD: Number(data.rates.NZD) || this.fxRates.NZD
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates }));
          this.applyFxRates(rates);
        }
      }
    } catch (fallbackErr) {
      console.warn("Fallback FX fetch failed, retaining defaults:", fallbackErr);
    }
  }

  applyFxRates(rates) {
    if (!rates) return;
    Object.assign(this.fxRates, rates);
    this.fx = {
      USDSGD: 1 / (this.fxRates.USD || 0.7749),
      USDHKD: (this.fxRates.HKD || 6.0736) / (this.fxRates.USD || 0.7749)
    };
    this.currencies.forEach(c => {
      const r = this.fxRates[c.code];
      if (r !== undefined) {
        c.rateDesc = `1 SGD = ${Number(r).toFixed(4)} ${c.code}`;
      }
    });
    this.renderCurrencyDropdown();
    this.render();
  }

  // Base converter: from holding currency to SGD base
  toSGD(val, currency) {
    if (!val) return 0;
    const c = (currency || "USD").toUpperCase();
    if (c === "SGD") return val;
    const rate = this.fxRates[c];
    if (rate && rate > 0) return val / rate;
    if (c === "USD") return val / 0.7749;
    if (c === "HKD") return val / 6.0736;
    if (c === "CNH") return val / 5.1618;
    return val;
  }

  // Base converter: from SGD base to target currency
  fromSGD(valSGD, targetCurrency) {
    if (!valSGD) return 0;
    const t = (targetCurrency || this.displayCurrency || "SGD").toUpperCase();
    if (t === "SGD") return valSGD;
    const rate = this.fxRates[t] || 1;
    return valSGD * rate;
  }

  // Convert to USD (for backward compatibility)
  toUSD(val, currency) {
    const inSGD = this.toSGD(val, currency);
    return inSGD * this.fxRates.USD;
  }

  // Convert directly between any two currencies
  convertCurrency(val, fromCurrency, toCurrency) {
    const inSGD = this.toSGD(val, fromCurrency);
    return this.fromSGD(inSGD, toCurrency);
  }

  getCurrencySymbol(code = this.displayCurrency) {
    const found = this.currencies.find(c => c.code === code);
    return found ? found.symbol : "$";
  }

  formatVal(num, code = this.displayCurrency, showSign = false) {
    if (this.isMasked) return "••••••";
    const sym = this.getCurrencySymbol(code);
    const abs = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sign = num < 0 ? '-' : (showSign && num > 0 ? '+' : '');
    return `${sign}${sym}${abs}`;
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

    // 3. SPECIFIC RULE: CORE ALL-WORLD BACKBONE (VWRA on IBKR & Tiger)
    if (pos.symbol === "VWRA") {
      return {
        action: "ACCUMULATE ON DIP (DCA)",
        actionClass: "cyan",
        risk: "VERY LOW (GLOBAL DIVERSIFICATION)",
        riskClass: "cyan",
        invalidation: "USD 162.00",
        target: "USD 210.00",
        rationale: `VWRA holds over 3,600 companies across 47 nations and forms the bedrock of your long-term wealth. You hold 48 shares total across IBKR & Tiger at an improved average price of $190.64 USD. Continue disciplined periodic dollar-cost averaging; do not panic sell.`
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

  // Dynamic Segmented Country P&L Summary (Matched to Verified Broker Statements)
  renderCountryPnlSummary(filteredHoldings) {
    const container = document.getElementById("country-pnl-summary-card");
    if (!container) return;

    const country = this.currentCountryFilter;
    let curr = "SGD";
    let currSymbol = "S$";
    let totalPnl = 0;
    let realizedPnl = 0;
    let dailyPnl = 0;
    let dailyPnlPct = 0;

    if (country === "US") {
      curr = "USD";
      currSymbol = "$";
      // Exact verified statement totals from user screenshot
      totalPnl = 3434.65;
      realizedPnl = 534.31;
    } else if (country === "HK") {
      curr = "HKD";
      currSymbol = "HK$";
      // Exact verified statement totals from user screenshot
      totalPnl = 3183.28;
      realizedPnl = 0.00;
    } else if (country === "SG") {
      curr = "SGD";
      currSymbol = "S$";
      // Exact verified statement totals for active SG stocks (without closed ESG)
      totalPnl = 6671.35;
      realizedPnl = 0.00;
    } else {
      // "All": aggregated in current display currency
      curr = this.displayCurrency;
      currSymbol = this.getCurrencySymbol(curr);
      const totalPnlSGD = 6671.35 + this.toSGD(3183.28, "HKD") + this.toSGD(3434.65, "USD");
      const realizedSGD = this.toSGD(534.31, "USD");
      totalPnl = this.fromSGD(totalPnlSGD, curr);
      realizedPnl = this.fromSGD(realizedSGD, curr);
    }

    // Compute live daily P&L for the selected country segment
    let dayPnlLocalTotal = 0;
    let baseValLocalTotal = 0;
    filteredHoldings.forEach(pos => {
      const dayChg = pos.change || 0;
      const curPrice = pos.currentPrice || pos.avgCost;
      const posDayPnl = dayChg * (pos.shares || 0);

      if (country === "All") {
        dayPnlLocalTotal += this.fromSGD(this.toSGD(posDayPnl, pos.currency), curr);
        baseValLocalTotal += this.fromSGD(this.toSGD((curPrice - dayChg) * (pos.shares || 0), pos.currency), curr);
      } else {
        dayPnlLocalTotal += posDayPnl;
        baseValLocalTotal += (curPrice - dayChg) * (pos.shares || 0);
      }
    });

    dailyPnl = dayPnlLocalTotal;
    dailyPnlPct = baseValLocalTotal > 0 ? (dailyPnl / baseValLocalTotal) * 100 : 0.85;

    const signTotal = totalPnl >= 0 ? '+' : '';
    const signRealized = realizedPnl >= 0 ? '+' : '';
    const signDaily = dailyPnl >= 0 ? '+' : '';

    const dispTotal = this.isMasked ? '••••••' : `${signTotal}${currSymbol}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dispRealized = this.isMasked ? '••••••' : `${realizedPnl === 0 ? '0.00' : `${signRealized}${currSymbol}${Math.abs(realizedPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}`;
    const dispDaily = this.isMasked ? '••••••' : `${signDaily}${currSymbol}${Math.abs(dailyPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${signDaily}${dailyPnlPct.toFixed(2)}%)`;

    container.innerHTML = `
      <div class="pnl-summary-row">
        <div style="display: flex; gap: 6px; align-items: baseline;">
          <span class="pnl-summary-label">Total P&L(${curr})</span>
          <span class="mono pnl-summary-val ${totalPnl >= 0 ? 'bull' : 'bear'}">${dispTotal}</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: baseline;">
          <span class="pnl-summary-label">Total Stocks P&L</span>
          <span class="mono pnl-summary-val ${totalPnl >= 0 ? 'bull' : 'bear'}">${dispTotal}</span>
        </div>
      </div>
      <div class="pnl-summary-row">
        <div style="display: flex; gap: 6px; align-items: baseline;">
          <span class="pnl-summary-label">Total Realized P&L(${curr})</span>
          <span class="mono pnl-summary-val ${realizedPnl > 0 ? 'bull' : ''}">${dispRealized}</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: baseline;">
          <span class="pnl-summary-label">Total Stocks Realized P&L</span>
          <span class="mono pnl-summary-val ${realizedPnl > 0 ? 'bull' : ''}">${dispRealized}</span>
        </div>
      </div>
      <div class="pnl-summary-row" style="padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08);">
        <span class="pnl-summary-label" style="font-weight: 700; color: var(--color-cyan);">Today's Daily P&L (${curr}):</span>
        <span class="mono pnl-summary-val ${dailyPnl >= 0 ? 'bull' : 'bear'}" style="font-size: 13px;">${dispDaily}</span>
      </div>
    `;
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

    let totalHoldingsValSGD = 0;
    let totalHoldingsCostSGD = 0;
    let totalDayPnlSGD = 0;
    let ibkrPositionsCount = 0;
    let tigerPositionsCount = 0;

    // Calculate aggregated portfolio totals in base SGD
    this.holdings.forEach(pos => {
      const curPrice = pos.currentPrice || pos.avgCost;
      const posValLocal = curPrice * pos.shares;
      const posCostLocal = pos.avgCost * pos.shares;
      const dayPnlLocal = (pos.change || 0) * pos.shares;

      const posValSGD = this.toSGD(posValLocal, pos.currency);
      const posCostSGD = this.toSGD(posCostLocal, pos.currency);
      const dayPnlSGD = this.toSGD(dayPnlLocal, pos.currency);

      totalHoldingsValSGD += posValSGD;
      totalHoldingsCostSGD += posCostSGD;
      totalDayPnlSGD += dayPnlSGD;

      if (pos.broker.includes("IBKR")) ibkrPositionsCount++;
      else if (pos.broker === "Tiger") tigerPositionsCount++;
    });

    // Add cash balances (converted to SGD base)
    const totalCashSGD = this.cashBalances.tigerSGD + 
                         this.cashBalances.ibkrSGD + 
                         this.toSGD(this.cashBalances.tigerUSD + this.cashBalances.ibkrUSD, "USD");

    const totalAssetsSGD = totalHoldingsValSGD + totalCashSGD;
    const totalCostSGD = totalHoldingsCostSGD + totalCashSGD;
    const netPnlSGD = totalHoldingsValSGD - totalHoldingsCostSGD;
    const netPnlPct = totalHoldingsCostSGD > 0 ? (netPnlSGD / totalCostSGD) * 100 : 0;

    // Daily P&L calculations
    const dailyPnlSGD = totalDayPnlSGD;
    const prevAssetsSGD = totalAssetsSGD - dailyPnlSGD;
    const dailyPnlPct = prevAssetsSGD > 0 ? (dailyPnlSGD / prevAssetsSGD) * 100 : 0;

    // Convert to currently selected display currency
    const totalAssetsDisp = this.fromSGD(totalAssetsSGD, this.displayCurrency);
    const dailyPnlDisp = this.fromSGD(dailyPnlSGD, this.displayCurrency);
    const netPnlDisp = this.fromSGD(netPnlSGD, this.displayCurrency);

    // 1. UPDATE PERSISTENT SUMMARY BAR
    const summaryTotalEl = document.getElementById("summary-total-assets");
    const summaryPnlEl = document.getElementById("summary-daily-pnl");
    if (summaryTotalEl) {
      summaryTotalEl.textContent = this.formatVal(totalAssetsDisp, this.displayCurrency);
    }
    if (summaryPnlEl) {
      if (this.isMasked) {
        summaryPnlEl.textContent = "••••••";
        summaryPnlEl.className = "summary-pnl mono";
      } else {
        const sign = dailyPnlDisp >= 0 ? '+' : '';
        summaryPnlEl.textContent = `${sign}${this.formatVal(dailyPnlDisp, this.displayCurrency)} (${sign}${dailyPnlPct.toFixed(2)}%)`;
        summaryPnlEl.className = `summary-pnl mono ${dailyPnlDisp >= 0 ? 'bull' : 'bear'}`;
      }
    }

    // 2. UPDATE HEADER METRIC CARDS
    if (totalValEl) {
      if (this.isMasked) {
        totalValEl.innerHTML = `<span class="mono" style="font-size: 22px; font-weight: 800; color: var(--text-bright);">••••••</span>`;
      } else {
        const secondaryCode = this.displayCurrency === "SGD" ? "USD" : "SGD";
        const secondaryVal = this.displayCurrency === "SGD" ? this.fromSGD(totalAssetsSGD, "USD") : totalAssetsSGD;

        totalValEl.innerHTML = `
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span>${this.formatVal(totalAssetsDisp, this.displayCurrency)} <span style="font-size: 13px; color: var(--text-muted);">${this.displayCurrency}</span></span>
            <span style="font-size: 13px; color: var(--color-cyan); font-weight: 600;">(≈ ${this.formatVal(secondaryVal, secondaryCode)} ${secondaryCode})</span>
          </div>
        `;
      }
    }

    if (totalPnlEl) {
      if (this.isMasked) {
        totalPnlEl.textContent = "••••••";
      } else {
        const sign = netPnlDisp >= 0 ? '+' : '';
        totalPnlEl.textContent = `${sign}${this.formatVal(netPnlDisp, this.displayCurrency)} ${this.displayCurrency}`;
        totalPnlEl.className = `mono ${netPnlDisp >= 0 ? 'bull' : 'bear'}`;
      }
    }

    if (totalPnlPctEl) {
      if (this.isMasked) {
        totalPnlPctEl.textContent = "••••••";
      } else {
        const sign = netPnlPct >= 0 ? '+' : '';
        totalPnlPctEl.textContent = `${sign}${netPnlPct.toFixed(2)}% Overall Gain`;
        totalPnlPctEl.className = `mono ${netPnlPct >= 0 ? 'bull-bg' : 'bear-bg'} ribbon-badge`;
      }
    }

    if (ibkrCountEl) ibkrCountEl.textContent = `${ibkrPositionsCount} IBKR (VWRA)`;
    if (tigerCountEl) tigerCountEl.textContent = `${tigerPositionsCount} Tiger Positions`;

    // Filter holdings by Country segmentation (All, US, HK, SG) and search query
    let filteredHoldings = this.holdings;
    if (this.currentCountryFilter === "US") {
      filteredHoldings = filteredHoldings.filter(p => p.market === "US" || p.market === "GLOBAL_ETF" || p.market === "COMMODITY" || p.market === "LEVERAGED" || p.currency === "USD");
    } else if (this.currentCountryFilter === "HK") {
      filteredHoldings = filteredHoldings.filter(p => p.market === "HK" || p.currency === "HKD");
    } else if (this.currentCountryFilter === "SG") {
      filteredHoldings = filteredHoldings.filter(p => p.market === "SG" || p.currency === "SGD");
    }

    if (this.searchFilter) {
      const q = this.searchFilter.toLowerCase();
      filteredHoldings = filteredHoldings.filter(p => 
        (p.symbol && p.symbol.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.rawSymbol && p.rawSymbol.toLowerCase().includes(q))
      );
    }

    // Render Segmented Country P&L Summary Cards (Tiger Statement Verified)
    this.renderCountryPnlSummary(filteredHoldings);

    if (filteredHoldings.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; background: rgba(0,0,0,0.2); border-radius: 6px;">
          No stocks found matching country [${this.currentCountryFilter}] and query "${this.searchFilter}".
        </div>
      `;
      return;
    }

    // Render each individual holding
    filteredHoldings.forEach(pos => {
      const curPrice = pos.currentPrice || pos.avgCost;
      const pnlPerShare = curPrice - pos.avgCost;
      const posValLocal = curPrice * pos.shares;
      const posCostLocal = pos.avgCost * pos.shares;
      const pnlLocal = posValLocal - posCostLocal;
      const pnlPct = posCostLocal > 0 ? (pnlLocal / posCostLocal) * 100 : 0;

      // Day P&L
      const dayChange = pos.change || 0;
      const dayPnlLocal = dayChange * (pos.shares || 0);
      const dayPct = pos.pctChange || (curPrice > 0 && dayChange ? (dayChange / (curPrice - dayChange)) * 100 : 0);

      // Statement P&L figures
      const posTotalPnl = pos.totalPnl !== undefined ? pos.totalPnl : pnlLocal;
      const posRealizedPnl = pos.realizedPnl !== undefined ? pos.realizedPnl : 0;
      const posUnrealizedPnl = pos.unrealizedPnl !== undefined ? pos.unrealizedPnl : pnlLocal;

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
      const posValSGD = this.toSGD(posValLocal, pos.currency);
      const totalPortfolioUSD = this.fromSGD(totalAssetsSGD, "USD");
      const weightPct = totalAssetsSGD > 0 ? (posValSGD / totalAssetsSGD) * 100 : 0;

      const verdict = this.generateTraderVerdict(pos, totalPortfolioUSD);
      const isIbkr = pos.broker.includes("IBKR");

      const currSymbol = pos.currency === "SGD" ? "S$" : pos.currency === "HKD" ? "HK$" : "$";
      const isCharted = this.app && this.app.selectedSymbol === pos.symbol;

      const isSG = pos.market === "SG" || pos.currency === "SGD";
      const isHK = pos.market === "HK" || pos.currency === "HKD";
      const regionClass = isSG ? "region-tag-sg" : isHK ? "region-tag-hk" : "region-tag-us";
      const regionText = isSG ? "SG" : isHK ? "HK" : "US";

      const signDay = dayPnlLocal >= 0 ? '+' : '';
      const dispDayPnl = this.isMasked ? '••••••' : `${signDay}${currSymbol}${Math.abs(dayPnlLocal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${signDay}${dayPct.toFixed(2)}%)`;
      const signTotal = posTotalPnl >= 0 ? '+' : '';
      const dispTotalPnl = this.isMasked ? '••••••' : `${signTotal}${currSymbol}${Math.abs(posTotalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const card = document.createElement("div");
      card.className = `holding-position-card ${isCharted ? 'is-active-charted' : ''}`;
      card.dataset.symbol = pos.symbol;
      card.title = `Click to instantly open ${pos.symbol} (${pos.name}) chart and full history`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <div style="display: flex; flex-direction: column; gap: 3px; align-items: center; margin-top: 2px;">
              <span class="${regionClass}">${regionText}</span>
              <span class="broker-badge ${isIbkr ? 'badge-ibkr' : 'badge-tiger'}">${pos.broker}</span>
            </div>
            <div>
              <div style="display: flex; align-items: baseline; gap: 6px;">
                <span style="font-size: 15px; font-weight: 800; color: var(--text-bright);">${pos.rawSymbol || pos.symbol}</span>
                <span style="font-size: 10px; color: var(--color-cyan); font-weight: 700;">${pos.assetClass || ''}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">${pos.name} • <strong>${pos.shares.toLocaleString()}</strong> Shares</div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 5px; flex-wrap: wrap;">
                <div class="holding-daily-pnl-badge ${dayPnlLocal >= 0 ? 'bull-bg' : 'bear-bg'} mono">
                  <span>TODAY:</span>
                  <strong>${dispDayPnl}</strong>
                </div>
                ${posRealizedPnl > 0 ? `
                  <span class="mono" style="font-size: 10px; color: #FBBF24; background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3); padding: 1px 6px; border-radius: 3px;">
                    REALIZED: +${currSymbol}${posRealizedPnl.toFixed(2)}
                  </span>
                ` : ''}
              </div>
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
              ${this.isMasked ? '••••••' : `${currSymbol}${posValLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div class="mono ${posTotalPnl >= 0 ? 'bull' : 'bear'}" style="font-size: 11px; font-weight: 700;">
              Total: ${dispTotalPnl}
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
              <span class="sub-val ${posTotalPnl >= 0 ? 'bull' : 'bear'}">${this.isMasked ? '••••••' : `${dispTotalPnl} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`}</span>
            </div>
            <div class="pnl-sub-box">
              <span class="sub-lbl">TODAY'S DAY P&L</span>
              <span class="sub-val ${dayPnlLocal >= 0 ? 'bull' : 'bear'}">${this.isMasked ? '••••••' : `${dispDayPnl}`}</span>
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

      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (window.innerWidth < 768) {
          card.classList.toggle("is-expanded");
        } else {
          if (this.app) {
            this.app.selectAsset(pos.symbol);
            this.highlightActiveHolding(pos.symbol);
            this.app.showToast(`Viewing ${pos.symbol} (${pos.name}) live chart`, "bull");
          }
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

  // SUBVIEW 2: ASSET ALLOCATION & INSTITUTIONAL RISK TELEMETRY
  renderAnalytics() {
    const container = document.getElementById("portfolio-analytics-subview");
    if (!container) return;

    let totalValSGD = 0;
    const geoMap = { US: 0, SG: 0, HK: 0, Global: 0 };
    const secMap = {
      "Financials & Banking": 0,
      "Mega-Cap Tech & AI": 0,
      "Broad Index ETFs": 0,
      "Consumer & Others": 0
    };

    this.holdings.forEach(pos => {
      const curPrice = pos.currentPrice || pos.avgCost;
      const valLocal = curPrice * pos.shares;
      const valSGD = this.toSGD(valLocal, pos.currency);
      totalValSGD += valSGD;

      // Geography
      if (pos.market === "US") geoMap.US += valSGD;
      else if (pos.market === "SG") geoMap.SG += valSGD;
      else if (pos.market === "HK") geoMap.HK += valSGD;
      else geoMap.Global += valSGD;

      // Sector
      if (["D05.SI", "O39.SI", "01398.HK"].includes(pos.symbol)) {
        secMap["Financials & Banking"] += valSGD;
      } else if (["AAPL", "GOOGL", "MSFT", "NVDA", "AMZN", "TSLA", "03067.HK"].includes(pos.symbol)) {
        secMap["Mega-Cap Tech & AI"] += valSGD;
      } else if (["VWRA", "VWRA.L", "ES3.SI", "SPY", "QQQ", "TQQQ"].includes(pos.symbol) || pos.symbol.startsWith("VWRA")) {
        secMap["Broad Index ETFs"] += valSGD;
      } else {
        secMap["Consumer & Others"] += valSGD;
      }
    });

    const getPct = (val) => totalValSGD > 0 ? ((val / totalValSGD) * 100).toFixed(1) : "0.0";

    container.innerHTML = `
      <!-- Institutional Risk Telemetry Grid -->
      <div class="portfolio-metric-card" style="margin-bottom: 2px;">
        <div style="font-size: 11px; font-weight: 800; color: var(--color-cyan); text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <span>Institutional Risk Telemetry</span>
          <span class="mono" style="font-size: 9px; color: var(--text-muted);">BENCHMARK: S&P 500</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">PORTFOLIO BETA</div>
            <div class="mono" style="font-size: 16px; font-weight: 800; color: #FFF; margin-top: 2px;">1.08 <span style="font-size: 10px; color: var(--color-bull); font-weight: 600;">(Balanced)</span></div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Dividend anchors offset US tech beta</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">SHARPE RATIO (EST)</div>
            <div class="mono" style="font-size: 16px; font-weight: 800; color: var(--color-cyan); margin-top: 2px;">1.64 <span style="font-size: 10px; color: var(--color-bull); font-weight: 600;">(Optimal)</span></div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Excess return above risk-free rate</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">DIVIDEND CASH YIELD</div>
            <div class="mono" style="font-size: 16px; font-weight: 800; color: #00F090; margin-top: 2px;">2.85% <span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">(~S$763/yr)</span></div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Recurring cash flow from SGX & HKEX</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">UNALLOCATED CASH</div>
            <div class="mono" style="font-size: 13px; font-weight: 800; color: #FFF; margin-top: 4px;">S$353.29 <span style="color: var(--text-muted); font-size: 9px;">SGD</span> + $247.72 <span style="color: var(--text-muted); font-size: 9px;">USD</span></div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Dry powder across Tiger & IBKR</div>
          </div>
        </div>
      </div>

      <!-- Geographic Allocation Breakdown -->
      <div class="portfolio-metric-card">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-bright); text-transform: uppercase; margin-bottom: 8px;">
          Geographic Exposure Breakdown
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🇺🇸 United States (Wall Street)</span>
              <span class="mono" style="font-weight: 700;">S$${geoMap.US.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${getPct(geoMap.US)}%)</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(geoMap.US)}%; height: 100%; background: #00D2FF; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🇸🇬 Singapore (SGX Blue-Chips)</span>
              <span class="mono" style="font-weight: 700;">S$${geoMap.SG.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${getPct(geoMap.SG)}%)</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(geoMap.SG)}%; height: 100%; background: #00F090; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🌐 Global / Ireland (IBKR All-World)</span>
              <span class="mono" style="font-weight: 700;">S$${geoMap.Global.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${getPct(geoMap.Global)}%)</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(geoMap.Global)}%; height: 100%; background: #A855F7; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🇭🇰 Hong Kong (HKEX Dividend & Tech)</span>
              <span class="mono" style="font-weight: 700;">S$${geoMap.HK.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${getPct(geoMap.HK)}%)</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(geoMap.HK)}%; height: 100%; background: #FFB800; border-radius: 3px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sector Allocation Breakdown -->
      <div class="portfolio-metric-card">
        <div style="font-size: 11px; font-weight: 800; color: var(--text-bright); text-transform: uppercase; margin-bottom: 8px;">
          Sector Diversification
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🏛️ Banking & High-Yield Financials</span>
              <span class="mono" style="font-weight: 700;">${getPct(secMap["Financials & Banking"])}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(secMap["Financials & Banking"])}%; height: 100%; background: #00F090; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>🚀 Mega-Cap Tech & AI Compounders</span>
              <span class="mono" style="font-weight: 700;">${getPct(secMap["Mega-Cap Tech & AI"])}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(secMap["Mega-Cap Tech & AI"])}%; height: 100%; background: #00D2FF; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>📈 Broad Market Index & Thematic ETFs</span>
              <span class="mono" style="font-weight: 700;">${getPct(secMap["Broad Index ETFs"])}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(secMap["Broad Index ETFs"])}%; height: 100%; background: #A855F7; border-radius: 3px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span>☕ Local Consumer & F&B Stalwarts</span>
              <span class="mono" style="font-weight: 700;">${getPct(secMap["Consumer & Others"])}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
              <div style="width: ${getPct(secMap["Consumer & Others"])}%; height: 100%; background: #FFB800; border-radius: 3px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // SUBVIEW 3: PROJECTED DIVIDEND CASH FLOW & CALENDAR
  renderDividends() {
    const container = document.getElementById("portfolio-dividends-subview");
    if (!container) return;

    container.innerHTML = `
      <!-- Dividend Hero Metric -->
      <div class="portfolio-metric-card" style="background: linear-gradient(135deg, rgba(0, 240, 144, 0.08) 0%, rgba(0, 210, 255, 0.05) 100%); border: 1px solid rgba(0, 240, 144, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 11px; font-weight: 800; color: #00F090; text-transform: uppercase;">Projected Annual Dividend Income</span>
          <span class="ribbon-badge mono bull-bg">2.85% BLENDED YIELD</span>
        </div>
        <div class="mono" style="font-size: 24px; font-weight: 800; color: #FFF; margin-top: 4px;">
          S$763.00 <span style="font-size: 14px; color: var(--color-cyan);">SGD / yr</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
          ≈ <strong class="mono" style="color: #FFF;">S$63.58 SGD / month</strong> recurring passive cash flow across SGX & HKEX holdings
        </div>
      </div>

      <!-- Dividend Streams Matrix -->
      <div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin: 4px 0 2px;">
        Active Dividend Payers Schedule
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <!-- DBS -->
        <div class="daily-rec-card" style="padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="region-badge mono" style="background: rgba(0, 240, 144, 0.15); color: #00F090; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 800;">SG</span>
              <span style="font-weight: 800; font-size: 13px; color: #FFF;">DBS Group (D05.SI)</span>
            </div>
            <span class="mono" style="font-size: 13px; font-weight: 800; color: #00F090;">+S$432.00 SGD / yr</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-top: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 4px;">
            <div><span style="color: var(--text-muted);">Payout Cadence:</span> <strong>Quarterly (S$108.00 / qtr)</strong></div>
            <div><span style="color: var(--text-muted);">Rate per Share:</span> <strong class="mono">S$2.16 / yr</strong></div>
            <div><span style="color: var(--text-muted);">Shares Owned:</span> <strong class="mono">200 Shares</strong></div>
            <div><span style="color: var(--text-muted);">Yield on Cost:</span> <strong class="mono cyan">4.10%</strong></div>
          </div>
        </div>

        <!-- OCBC -->
        <div class="daily-rec-card" style="padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="region-badge mono" style="background: rgba(0, 240, 144, 0.15); color: #00F090; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 800;">SG</span>
              <span style="font-weight: 800; font-size: 13px; color: #FFF;">OCBC Bank (O39.SI)</span>
            </div>
            <span class="mono" style="font-size: 13px; font-weight: 800; color: #00F090;">+S$176.00 SGD / yr</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-top: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 4px;">
            <div><span style="color: var(--text-muted);">Payout Cadence:</span> <strong>Semi-Annual (S$88.00 / dist)</strong></div>
            <div><span style="color: var(--text-muted);">Rate per Share:</span> <strong class="mono">S$0.88 / yr</strong></div>
            <div><span style="color: var(--text-muted);">Shares Owned:</span> <strong class="mono">200 Shares</strong></div>
            <div><span style="color: var(--text-muted);">Yield on Cost:</span> <strong class="mono cyan">6.01%</strong></div>
          </div>
        </div>

        <!-- ES3 -->
        <div class="daily-rec-card" style="padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="region-badge mono" style="background: rgba(0, 240, 144, 0.15); color: #00F090; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 800;">SG</span>
              <span style="font-weight: 800; font-size: 13px; color: #FFF;">SS SPDR STI ETF (ES3.SI)</span>
            </div>
            <span class="mono" style="font-size: 13px; font-weight: 800; color: #00F090;">+S$63.00 SGD / yr</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-top: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 4px;">
            <div><span style="color: var(--text-muted);">Payout Cadence:</span> <strong>Semi-Annual (S$31.50 / dist)</strong></div>
            <div><span style="color: var(--text-muted);">Rate per Share:</span> <strong class="mono">S$0.21 / yr</strong></div>
            <div><span style="color: var(--text-muted);">Shares Owned:</span> <strong class="mono">300 Shares</strong></div>
            <div><span style="color: var(--text-muted);">Yield on Cost:</span> <strong class="mono cyan">4.71%</strong></div>
          </div>
        </div>

        <!-- ICBC -->
        <div class="daily-rec-card" style="padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="region-badge mono" style="background: rgba(255, 184, 0, 0.15); color: #FFB800; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 800;">HK</span>
              <span style="font-weight: 800; font-size: 13px; color: #FFF;">ICBC (01398.HK)</span>
            </div>
            <span class="mono" style="font-size: 13px; font-weight: 800; color: #FFB800;">+HK$330.00 (~S$54.50) / yr</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-top: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 4px;">
            <div><span style="color: var(--text-muted);">Payout Cadence:</span> <strong>Annual Summer Dividend</strong></div>
            <div><span style="color: var(--text-muted);">Rate per Share:</span> <strong class="mono">HK$0.33 / yr</strong></div>
            <div><span style="color: var(--text-muted);">Shares Owned:</span> <strong class="mono">1,000 Shares</strong></div>
            <div><span style="color: var(--text-muted);">Dividend Yield:</span> <strong class="mono cyan">6.82%</strong></div>
          </div>
        </div>

        <!-- Kimly -->
        <div class="daily-rec-card" style="padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="region-badge mono" style="background: rgba(0, 240, 144, 0.15); color: #00F090; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 800;">SG</span>
              <span style="font-weight: 800; font-size: 13px; color: #FFF;">Kimly Limited (1D0.SI)</span>
            </div>
            <span class="mono" style="font-size: 13px; font-weight: 800; color: #00F090;">+S$37.50 SGD / yr</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; margin-top: 6px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 4px;">
            <div><span style="color: var(--text-muted);">Payout Cadence:</span> <strong>Semi-Annual</strong></div>
            <div><span style="color: var(--text-muted);">Rate per Share:</span> <strong class="mono">S$0.015 / yr</strong></div>
            <div><span style="color: var(--text-muted);">Shares Owned:</span> <strong class="mono">2,500 Shares</strong></div>
            <div><span style="color: var(--text-muted);">Dividend Yield:</span> <strong class="mono cyan">4.82%</strong></div>
          </div>
        </div>

        <!-- VWRA Note -->
        <div style="padding: 10px; border-radius: 6px; background: rgba(168, 85, 247, 0.08); border: 1px dashed rgba(168, 85, 247, 0.3); font-size: 11px; line-height: 1.45; color: var(--text-secondary);">
          <strong style="color: #A855F7;">💡 VWRA Accumulating Structure:</strong> Vanguard FTSE All-World (100 Shares) automatically reinvests dividends directly into NAV, eliminating distribution leakage and tax drag.
        </div>
      </div>
    `;
  }

  // INSTITUTIONAL DAILY MACROECONOMIC RECOMMENDATIONS ENGINE
  renderDailyRecommendations(filterCategory = "all") {
    const container = document.getElementById("portfolio-recs-subview");
    if (!container) return;

    // Get live VIX from marketItems
    const vixItem = this.app && this.app.marketItems ? this.app.marketItems.find(x => x.symbol === "^VIX" || x.id === "VIX") : null;
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
        name: "Vanguard FTSE All-World UCITS ETF (LSE / Tiger UK)",
        broker: "IBKR (46) + Tiger (2)",
        shares: "48 Shares Total",
        weight: ((this.toUSD(174.00 * 48, "USD") / totalValUSD) * 100).toFixed(1) + "%",
        category: "accumulate",
        urgency: "CORE BUY",
        urgencyClass: "bull-bg",
        action: "✓ DCA EXECUTED (+2 SHARES ON NOV 27) // CONTINUE MONTHLY DISCIPLINE",
        macroTrigger: `Holds 3,600+ companies across 47 nations. Latest trade confirmed on Tiger UK (Nov 27, 2026): Bought 2 shares @ $180.01 ($360.02 USD). Total holding is now 48 shares (46 on IBKR + 2 on Tiger) with a new weighted average cost of $190.64. Continue periodic dollar-cost averaging to compound global long-term wealth.`,
        entryTrigger: "USD 170.00 – 180.00",
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
            <strong class="cyan">DCA INTO VWRA (IBKR & TIGER)</strong>
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
