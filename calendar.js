// Economic Calendar with Singapore Local Time (SGT, UTC+8)
class EconomicCalendar {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById("calendar-events-container");
    this.filter = "all"; // all, high
    this.events = [];
    this.initFilterControls();
    this.initEvents();
    this.startCountdown();
  }

  initFilterControls() {
    const filterBtns = document.querySelectorAll(".cal-filter-btn");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.filter = btn.dataset.impact;
        this.render();
      });
    });
  }

  initEvents() {
    // Current date context: Nov 2026
    const base = new Date();
    const d = base.getDate();
    const m = base.getMonth();
    const y = base.getFullYear();

    this.events = [
      {
        id: "evt-1",
        country: "USA",
        flag: "🇺🇸",
        currency: "USD",
        name: "US Core PCE Price Index (MoM)",
        impact: "high",
        date: new Date(y, m, d, 21, 30), // 21:30 SGT
        actual: "0.3%",
        forecast: "0.2%",
        previous: "0.2%",
        description: "Federal Reserve's preferred gauge of underlying consumer inflation."
      },
      {
        id: "evt-2",
        country: "SGP",
        flag: "🇸🇬",
        currency: "SGD",
        name: "Singapore Core CPI Inflation (YoY)",
        impact: "high",
        date: new Date(y, m, d + 1, 13, 0), // 13:00 SGT
        actual: "--",
        forecast: "2.7%",
        previous: "2.8%",
        description: "Monetary Authority of Singapore (MAS) primary policy indicator."
      },
      {
        id: "evt-3",
        country: "USA",
        flag: "🇺🇸",
        currency: "USD",
        name: "FOMC Rate Decision & Press Conference",
        impact: "high",
        date: new Date(y, m, d + 2, 2, 0), // 02:00 SGT (night)
        actual: "--",
        forecast: "4.75%",
        previous: "4.75%",
        description: "Federal Funds Target Rate decision by Jerome Powell and FOMC."
      },
      {
        id: "evt-4",
        country: "USA",
        flag: "🇺🇸",
        currency: "USD",
        name: "Non-Farm Payrolls (NFP) & Unemployment",
        impact: "high",
        date: new Date(y, m, d + 3, 21, 30), // 21:30 SGT
        actual: "--",
        forecast: "165K",
        previous: "182K",
        description: "Crucial US labor market benchmark driving interest rate expectations."
      },
      {
        id: "evt-5",
        country: "EUR",
        flag: "🇪🇺",
        currency: "EUR",
        name: "ECB Main Refinancing Rate Decision",
        impact: "high",
        date: new Date(y, m, d + 3, 20, 15), // 20:15 SGT
        actual: "--",
        forecast: "3.25%",
        previous: "3.50%",
        description: "European Central Bank monetary policy and deposit facility benchmark."
      },
      {
        id: "evt-6",
        country: "JPN",
        flag: "🇯🇵",
        currency: "JPY",
        name: "Bank of Japan (BoJ) Policy Rate",
        impact: "medium",
        date: new Date(y, m, d + 4, 11, 0), // 11:00 SGT
        actual: "--",
        forecast: "0.50%",
        previous: "0.25%",
        description: "BoJ monetary normalisation trajectory and bond yield control."
      },
      {
        id: "evt-7",
        country: "USA",
        flag: "🇺🇸",
        currency: "USD",
        name: "EIA Crude Oil Inventories Change",
        impact: "medium",
        date: new Date(y, m, d + 1, 23, 30), // 23:30 SGT
        actual: "--",
        forecast: "-1.2M",
        previous: "+2.1M",
        description: "Weekly commercial petroleum stockpile shift impacting WTI prices."
      },
      {
        id: "evt-8",
        country: "CHN",
        flag: "🇨🇳",
        currency: "CNY",
        name: "China Manufacturing PMI (Caixin)",
        impact: "medium",
        date: new Date(y, m, d + 2, 9, 45), // 09:45 SGT
        actual: "--",
        forecast: "50.6",
        previous: "50.3",
        description: "Leading macroeconomic barometer for global commodities and Asia equities."
      }
    ];

    this.render();
  }

  startCountdown() {
    setInterval(() => {
      this.updateCountdownDisplay();
    }, 1000);
    this.updateCountdownDisplay();
  }

  updateCountdownDisplay() {
    const banner = document.getElementById("cal-countdown-text");
    if (!banner) return;

    const now = new Date();
    const upcoming = this.events.find(e => e.date > now && e.impact === "high");

    if (!upcoming) {
      banner.textContent = "No high-impact events remaining today.";
      return;
    }

    const diff = upcoming.date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    banner.textContent = `NEXT: ${upcoming.flag} ${upcoming.name} in ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s (SGT)`;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    let items = this.events;
    if (this.filter === "high") {
      items = items.filter(e => e.impact === "high");
    }

    items.forEach(evt => {
      const card = document.createElement("div");
      card.className = "calendar-event-card";

      // Format date in Singapore Time (SGT UTC+8)
      const options = {
        timeZone: "Asia/Singapore",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      };
      const sgtFormatted = evt.date.toLocaleString("en-SG", options) + " SGT";

      const impactClass = evt.impact === "high" ? "impact-high" : "impact-medium";

      card.innerHTML = `
        <div class="event-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${evt.flag}</span>
            <span class="event-time-sgt mono">${sgtFormatted}</span>
          </div>
          <span class="event-impact-badge ${impactClass}">${evt.impact.toUpperCase()} IMPACT</span>
        </div>
        <div class="event-name">${evt.name}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${evt.description}</div>
        <div class="event-numbers mono">
          <div class="num-col">
            <span class="num-label">ACTUAL</span>
            <span class="num-val ${evt.actual !== '--' ? 'cyan' : ''}">${evt.actual}</span>
          </div>
          <div class="num-col">
            <span class="num-label">FORECAST</span>
            <span class="num-val">${evt.forecast}</span>
          </div>
          <div class="num-col">
            <span class="num-label">PREVIOUS</span>
            <span class="num-val">${evt.previous}</span>
          </div>
        </div>
      `;
      this.container.appendChild(card);
    });
  }
}
window.EconomicCalendar = EconomicCalendar;
