// AI Market Analyst & Quantitative Sentiment Engine
class AIMarketAnalyst {
  constructor(app) {
    this.app = app;
    this.geminiApiKey = localStorage.getItem("gemini_api_key") || "";
    this.initInteractiveUI();
  }

  setApiKey(key) {
    this.geminiApiKey = key.trim();
    localStorage.setItem("gemini_api_key", this.geminiApiKey);
  }

  initInteractiveUI() {
    const askBtn = document.getElementById("ai-ask-submit");
    const input = document.getElementById("ai-ask-input");
    const quickPrompts = document.querySelectorAll(".ai-quick-chip");

    if (askBtn && input) {
      askBtn.addEventListener("click", () => this.handleUserQuery());
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.handleUserQuery();
      });
    }

    if (quickPrompts) {
      quickPrompts.forEach(chip => {
        chip.addEventListener("click", () => {
          if (input) {
            input.value = chip.dataset.prompt;
            this.handleUserQuery();
          }
        });
      });
    }
  }

  // Generate real-time analysis for currently active asset
  analyze(item, chartManager) {
    if (!item) return;

    const data = chartManager ? chartManager.currentData : [];
    const indicators = chartManager ? chartManager.calculatedIndicators : {};
    const keyLevels = indicators.keyLevels || this.estimateKeyLevels(item);

    // 1. Calculate Sentiment & Regime
    const sentiment = this.calculateSentimentScore(item, indicators);
    const regime = this.determineRegime(item, indicators, sentiment.score);

    // Update UI elements
    this.updateSentimentUI(sentiment);
    this.updateRegimeUI(regime);
    this.updateKeyLevelsUI(keyLevels, item);
    this.updateNarrativeUI(item, regime, keyLevels, indicators);
  }

  calculateSentimentScore(item, indicators) {
    let score = 50; // Neutral baseline
    if (!item || !item.pctChange) return { score: 50, label: "NEUTRAL" };

    // Price change impact (-30 to +30)
    score += Math.max(-25, Math.min(25, item.pctChange * 8));

    // RSI impact
    if (indicators && indicators.rsi && indicators.rsi.length > 0) {
      const validRsi = indicators.rsi.filter(x => x !== null);
      if (validRsi.length > 0) {
        const lastRsi = validRsi[validRsi.length - 1];
        score += (lastRsi - 50) * 0.4;
      }
    }

    score = Math.round(Math.max(5, Math.min(95, score)));

    let label = "NEUTRAL CONSOLIDATION";
    let colorClass = "amber";
    if (score >= 75) { label = "EXTREME GREED / OVERBOUGHT"; colorClass = "bull"; }
    else if (score >= 58) { label = "BULLISH OPTIMISM"; colorClass = "bull"; }
    else if (score <= 25) { label = "EXTREME FEAR / CAPITULATION"; colorClass = "bear"; }
    else if (score <= 42) { label = "BEARISH SKEPTICISM"; colorClass = "bear"; }

    return { score, label, colorClass };
  }

  determineRegime(item, indicators, sentimentScore) {
    const change = item.pctChange || 0;
    if (change >= 1.2 && sentimentScore >= 65) {
      return {
        title: "STRONG BULLISH EXPANSION",
        badge: "STRONG BUY / TREND FOLLOWING",
        badgeClass: "bull-bg",
        borderClass: "var(--color-bull)",
        summary: `Aggressive capital inflows propelling ${item.name} into blue-sky or multi-day highs. Buyers defending pullbacks with strong bid absorption.`
      };
    } else if (change > 0.1) {
      return {
        title: "MODERATE BULLISH BIAS",
        badge: "ACCUMULATION ON DIPS",
        badgeClass: "bull-bg",
        borderClass: "var(--color-bull)",
        summary: `Constructive structure with higher lows established. Market digesting recent gains while holding above primary exponential moving averages.`
      };
    } else if (change <= -1.2 && sentimentScore <= 35) {
      return {
        title: "STRONG BEARISH IMPULSE",
        badge: "DEFENSIVE / CAPITAL PRESERVATION",
        badgeClass: "bear-bg",
        borderClass: "var(--color-bear)",
        summary: `Heavy distribution underway. Price breaking session liquidity pools with selling pressure accelerating across lower timeframes.`
      };
    } else if (change < -0.1) {
      return {
        title: "CORRECTIVE RETRACEMENT",
        badge: "TESTING DEMAND ZONE",
        badgeClass: "bear-bg",
        borderClass: "var(--color-bear)",
        summary: `Mild profit-taking and consolidation. Market searching for equilibrium near immediate support clusters.`
      };
    } else {
      return {
        title: "RANGE-BOUND EQUILIBRIUM",
        badge: "MEAN REVERSION / RANGE",
        badgeClass: "amber-bg",
        borderClass: "var(--color-amber)",
        summary: `Balanced order book with muted directional conviction. Price oscillating between defined horizontal boundaries.`
      };
    }
  }

  updateSentimentUI(sentiment) {
    const valElem = document.getElementById("ai-sentiment-score");
    const labelElem = document.getElementById("ai-sentiment-label");
    const pointer = document.getElementById("ai-sentiment-pointer");

    if (valElem) valElem.textContent = sentiment.score;
    if (labelElem) {
      labelElem.textContent = sentiment.label;
      labelElem.className = sentiment.colorClass;
    }
    if (pointer) {
      pointer.style.left = `${sentiment.score}%`;
    }
  }

  updateRegimeUI(regime) {
    const title = document.getElementById("ai-regime-title");
    const desc = document.getElementById("ai-regime-desc");
    const box = document.getElementById("ai-regime-box");

    if (title) title.textContent = regime.title;
    if (desc) desc.textContent = regime.summary;
    if (box) box.style.borderLeftColor = regime.borderClass;
  }

  updateKeyLevelsUI(keyLevels, item) {
    const r2 = document.getElementById("lvl-r2");
    const r1 = document.getElementById("lvl-r1");
    const s1 = document.getElementById("lvl-s1");
    const s2 = document.getElementById("lvl-s2");

    if (!keyLevels) return;

    const format = (v) => v ? '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--';

    if (r2) r2.textContent = format(keyLevels.r2);
    if (r1) r1.textContent = format(keyLevels.r1);
    if (s1) s1.textContent = format(keyLevels.s1);
    if (s2) s2.textContent = format(keyLevels.s2);
  }

  estimateKeyLevels(item) {
    const p = item.price || 100;
    const spread = (item.high && item.low) ? (item.high - item.low) : p * 0.02;
    return {
      r2: p + spread * 1.618,
      r1: item.high || (p + spread * 0.618),
      s1: item.low || (p - spread * 0.618),
      s2: p - spread * 1.618
    };
  }

  updateNarrativeUI(item, regime, keyLevels, indicators) {
    const whatElem = document.getElementById("ai-what-happened");
    const whyElem = document.getElementById("ai-why-moved");
    const watchElem = document.getElementById("ai-what-to-watch");

    const sign = item.pctChange >= 0 ? '+' : '';
    const dirWord = item.pctChange >= 0 ? 'gained' : 'retreated';

    if (whatElem) {
      whatElem.textContent = `${item.name} (${item.symbol}) ${dirWord} ${sign}${item.pctChange}% to trade at $${item.price.toLocaleString()}, registering a 24h trading range between $${item.low.toLocaleString()} and $${item.high.toLocaleString()}.`;
    }

    if (whyElem) {
      whyElem.textContent = `${regime.summary} Technical momentum indicators show sustained activity, with trading desks responding to macroeconomic liquidity expectations and technical order-book imbalances.`;
    }

    if (watchElem && keyLevels) {
      const format = (v) => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      watchElem.textContent = `Immediate breakout ceiling sits at ${format(keyLevels.r1)} (Resistance 1). Critical floor support to monitor is ${format(keyLevels.s1)} (Support 1). A decisive hourly close outside this bracket dictates the next 3-5% directional leg.`;
    }
  }

  async handleUserQuery() {
    const input = document.getElementById("ai-ask-input");
    const chatLog = document.getElementById("ai-chat-output");
    if (!input || !chatLog) return;

    const query = input.value.trim();
    if (!query) return;

    input.value = "";

    // Append user message
    const userMsg = document.createElement("div");
    userMsg.style.cssText = "background: var(--bg-card-hover); padding: 8px 12px; border-radius: 6px; font-size: 11px; color: var(--text-bright); align-self: flex-end; margin-bottom: 6px;";
    userMsg.innerHTML = `<strong>You:</strong> ${query}`;
    chatLog.appendChild(userMsg);

    // Append loading placeholder
    const aiMsg = document.createElement("div");
    aiMsg.style.cssText = "background: var(--bg-card); border-left: 3px solid var(--color-purple); padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 11px; color: var(--text-secondary); margin-bottom: 10px;";
    aiMsg.innerHTML = `<span class="purple" style="font-weight: 700;">AI Analyst:</span> Thinking...`;
    chatLog.appendChild(aiMsg);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Check if Gemini API key exists
    if (this.geminiApiKey) {
      try {
        const prompt = `You are a world-class senior financial analyst and macro trader at a quantitative hedge fund. Provide a concise, highly insightful, professional answer (under 120 words) to this trader question regarding global markets and asset ${this.app.selectedSymbol}:\n"${query}"`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const json = await res.json();
        const text = json.candidates[0].content.parts[0].text;
        aiMsg.innerHTML = `<span class="purple" style="font-weight: 700;">Gemini AI:</span> ${text.replace(/\n/g, '<br>')}`;
        return;
      } catch (e) {
        console.warn("Gemini API call failed, falling back to local analytical engine", e);
      }
    }

    // High-precision algorithmic AI response fallback
    setTimeout(() => {
      const resp = this.generateAnalyticalAnswer(query, this.app.selectedItem);
      aiMsg.innerHTML = `<span class="purple" style="font-weight: 700;">AI Quantitative Engine:</span> ${resp}`;
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 400);
  }

  generateAnalyticalAnswer(query, item) {
    const q = query.toLowerCase();
    const sym = item ? item.symbol : "the market";
    const name = item ? item.name : "Active Asset";
    const price = item ? `$${item.price.toLocaleString()}` : "the current price";
    const change = item ? `${item.pctChange >= 0 ? '+' : ''}${item.pctChange}%` : "0%";

    if (q.includes("buy") || q.includes("invest") || q.includes("entry")) {
      return `For ${name} (${sym}) at ${price} (${change}): Entering long at current levels requires confirmation of support defense. If trading short-term momentum, set invalidation stop-loss just below session low ($${item ? item.low.toLocaleString() : '--'}) to preserve risk-to-reward ratio.`;
    } else if (q.includes("trend") || q.includes("direction")) {
      return `${name} is exhibiting a ${item && item.pctChange >= 0 ? 'bullish expansionary' : 'corrective bearish'} posture on the daily timeframe. Price action is respecting exponential moving average bands, with momentum favoring ${item && item.pctChange >= 0 ? 'continuation higher towards key resistance' : 'further testing of baseline liquidity pools'}.`;
    } else if (q.includes("support") || q.includes("resistance") || q.includes("level")) {
      return `Key technical zones for ${sym}: Immediate resistance stands at $${item ? item.high.toLocaleString() : '--'} with secondary breakout target at Fibonacci 1.618 extension. Floor support sits at $${item ? item.low.toLocaleString() : '--'}.`;
    } else if (q.includes("fed") || q.includes("inflation") || q.includes("interest rate") || q.includes("cpi")) {
      return `Macro backdrop: Central bank interest rate trajectories remain the dominant macro catalyst. Elevated inflation data creates yield curve pressure, impacting tech valuations while gold and commodities act as monetary hedges. Watch the upcoming FOMC statement in SGT time.`;
    } else {
      return `Market analysis for ${name}: Current price is ${price} with a 24-hour delta of ${change}. Order book depth suggests balanced participation between algorithmic liquidity providers and trend followers. Maintain disciplined risk management across all active positions.`;
    }
  }
}
window.AIMarketAnalyst = AIMarketAnalyst;
