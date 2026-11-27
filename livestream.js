// World Monitor & Singapore Financial Television Control Room
// Permanent 24/7 Channel Embed Architecture (100% Zero-Login, Viewable in Singapore)
class LivestreamManager {
  constructor(app) {
    this.app = app;
    this.currentChannel = "cna"; // Default to Channel NewsAsia Singapore!
    this.secondaryChannel = "bloomberg";
    this.mode = "single"; // "single" | "dual"
    this.isPipActive = false;

    // Verified permanent 24/7 Channel IDs viewable in Singapore with zero login required
    this.channels = {
      cna: {
        id: "cna",
        name: "CNA (Channel NewsAsia)",
        badge: "SINGAPORE // 24/7 LIVE ASIA",
        channelId: "UC83jt4dlz1Gjl58fzQrrKZg",
        youtubeLiveUrl: "https://www.youtube.com/channel/UC83jt4dlz1Gjl58fzQrrKZg/live",
        directUrl: "https://www.channelnewsasia.com/watch",
        desc: "Singapore's premier English-language 24/7 news channel broadcasting comprehensive Asian and global market intelligence, MAS policy, SGX trading sessions, and breaking world events."
      },
      bloomberg: {
        id: "bloomberg",
        name: "Bloomberg Television",
        badge: "USA // GLOBAL FINANCE",
        channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
        fallbackChannelId: "UCUMZ7gohGI9HcU9VNsr2FJQ",
        youtubeLiveUrl: "https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live",
        directUrl: "https://www.bloomberg.com/live",
        desc: "24/7 institutional global market broadcast covering Wall Street, Asian stock exchanges, bond yields, currency movements, and Federal Reserve commentary."
      },
      skynews: {
        id: "skynews",
        name: "Sky News Live",
        badge: "UK // 24/7 WORLD NEWS",
        channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
        videoId: "XyNpGu7mm8o", // Verified active 24/7 official live broadcast
        fallbackVideoId: "9Auq9mYxFEE",
        youtubeLiveUrl: "https://www.youtube.com/watch?v=XyNpGu7mm8o",
        directUrl: "https://news.sky.com/watch-live",
        desc: "London-based 24/7 international breaking news network tracking European macro, global geopolitical conflicts, and world financial developments."
      },
      france24: {
        id: "france24",
        name: "France 24 English",
        badge: "FRANCE // GLOBAL NEWS",
        channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
        youtubeLiveUrl: "https://www.youtube.com/channel/UCQfwfsi5VrQ8yKZ-UWmAEFg/live",
        directUrl: "https://www.france24.com/en/live",
        desc: "International French & European news broadcasting in English 24/7 with comprehensive coverage of global diplomacy, commodities, and European market trends."
      },
      dwnews: {
        id: "dwnews",
        name: "DW News (Deutsche Welle)",
        badge: "GERMANY // GLOBAL MACRO",
        channelId: "UCknLrEdhRCp1aegoMqRaCZg",
        youtubeLiveUrl: "https://www.youtube.com/channel/UCknLrEdhRCp1aegoMqRaCZg/live",
        directUrl: "https://www.dw.com/en/live-tv/s-100825",
        desc: "Berlin-based international broadcaster delivering comprehensive macroeconomic analysis, diplomatic negotiations, and supply chain tracking."
      },
      aljazeera: {
        id: "aljazeera",
        name: "Al Jazeera English",
        badge: "MIDDLE EAST // ENERGY",
        channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
        youtubeLiveUrl: "https://www.youtube.com/channel/UCNye-wNBqNL5ZzHSJj3l8Bg/live",
        directUrl: "https://www.aljazeera.com/live",
        desc: "World news wire with premier real-time coverage of Middle Eastern geopolitics, Red Sea shipping routes, and OPEC+ crude oil markets."
      }
    };

    this.initUI();
  }

  initUI() {
    // Header Live TV button
    const headerBtn = document.getElementById("btn-toggle-livestream");
    if (headerBtn) {
      headerBtn.addEventListener("click", () => this.toggleHubView());
    }

    // Channel pills
    const pills = document.querySelectorAll(".channel-pill");
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        const chKey = pill.dataset.channel;
        if (chKey && this.channels[chKey]) {
          this.selectChannel(chKey);
        }
      });
    });

    // View mode toggles (Single & Dual only)
    const singleBtn = document.getElementById("btn-stream-single");
    const dualBtn = document.getElementById("btn-stream-dual");

    if (singleBtn) singleBtn.addEventListener("click", () => this.setMode("single"));
    if (dualBtn) dualBtn.addEventListener("click", () => this.setMode("dual"));

    // News tab quick-toggle livestream banner
    const newsExpandBtn = document.getElementById("btn-news-tv-toggle");
    if (newsExpandBtn) {
      newsExpandBtn.addEventListener("click", () => this.toggleNewsTvBanner());
    }
  }

  toggleHubView() {
    const liveTab = document.querySelector(`.hub-tab[data-view="view-livestream"]`);
    if (liveTab) {
      liveTab.click();
    }
  }

  selectChannel(channelKey) {
    if (!this.channels[channelKey]) return;
    this.currentChannel = channelKey;

    // Update active pill
    const pills = document.querySelectorAll(".channel-pill");
    pills.forEach(p => p.classList.toggle("active", p.dataset.channel === channelKey));

    this.render();
  }

  setMode(mode) {
    this.mode = mode;

    const singleBtn = document.getElementById("btn-stream-single");
    const dualBtn = document.getElementById("btn-stream-dual");
    if (singleBtn) singleBtn.classList.toggle("active", mode === "single");
    if (dualBtn) dualBtn.classList.toggle("active", mode === "dual");

    const stage = document.getElementById("livestream-player-stage");
    const p2Wrapper = document.getElementById("player-wrapper-2");

    if (mode === "dual") {
      if (stage) stage.classList.add("dual-mode");
      if (p2Wrapper) p2Wrapper.style.display = "flex";
      const ch2 = this.channels[this.secondaryChannel];
      this.loadChannelIframe("stream-iframe-2", ch2);
      const title2 = document.getElementById("stream-title-2");
      if (title2) title2.textContent = ch2.name.toUpperCase();
    } else {
      if (stage) stage.classList.remove("dual-mode");
      if (p2Wrapper) {
        p2Wrapper.style.display = "none";
        this.unloadIframe("stream-iframe-2");
      }
    }

    this.render();
  }



  toggleNewsTvBanner() {
    const banner = document.getElementById("news-tv-embedded-container");
    const toggleBtn = document.getElementById("btn-news-tv-toggle");
    if (!banner) return;

    const isHidden = banner.style.display === "none" || !banner.style.display;
    if (isHidden) {
      banner.style.display = "block";
      const ch = this.channels[this.currentChannel];
      banner.innerHTML = `
        <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-subtle);">
          <iframe src="https://www.youtube.com/embed/live_stream?channel=${ch.channelId}&autoplay=1&mute=1&playsinline=1&controls=1&rel=0" 
                  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen style="position: absolute; top:0; left:0; width:100%; height:100%; border:none;">
          </iframe>
        </div>
      `;
      if (toggleBtn) toggleBtn.textContent = "Hide TV";
    } else {
      banner.style.display = "none";
      banner.innerHTML = "";
      if (toggleBtn) toggleBtn.textContent = "Watch Live TV";
    }
  }

  loadChannelIframe(iframeId, ch) {
    const iframe = document.getElementById(iframeId);
    if (!iframe || !ch) return;
    
    // Support permanent 24/7 video stream ID or channel-level live embed
    const url = ch.videoId
      ? `https://www.youtube.com/embed/${ch.videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0`
      : `https://www.youtube.com/embed/live_stream?channel=${ch.channelId}&autoplay=1&mute=1&playsinline=1&controls=1&rel=0`;

    if (iframe.src !== url) {
      iframe.src = url;
    }
  }

  unloadIframe(iframeId) {
    const iframe = document.getElementById(iframeId);
    if (iframe) iframe.src = "";
  }

  render() {
    const ch1 = this.channels[this.currentChannel];
    if (!ch1) return;

    // Load active permanent live stream
    this.loadChannelIframe("stream-iframe-1", ch1);

    // Update overlay title
    const title1 = document.getElementById("stream-title-1");
    if (title1) title1.textContent = ch1.name.toUpperCase();

    // Update intel card
    const nameEl = document.getElementById("intel-channel-name");
    const descEl = document.getElementById("intel-channel-desc");
    const linkEl = document.getElementById("intel-channel-link");
    if (nameEl) nameEl.textContent = `${ch1.name} (${ch1.badge})`;
    if (descEl) descEl.textContent = ch1.desc;
    if (linkEl) {
      linkEl.href = ch1.directUrl || ch1.youtubeLiveUrl;
      linkEl.textContent = `Open Official Feed ↗`;
    }
  }
}

window.LivestreamManager = LivestreamManager;
