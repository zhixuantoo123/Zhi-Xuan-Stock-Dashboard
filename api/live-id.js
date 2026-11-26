module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const ch = (req.query && req.query.channel) || 'cna';
  const videoIds = {
    cna: "-PWMxjBgr0k",
    bloomberg: "dp8PhLsUcFE",
    skynews: "9Auq9mYxFEE",
    france24: "h3MuIUNCCzI",
    dwnews: "gCNeDWCI0Q0",
    aljazeera: "bNyUyrR0PHo",
    euronews: "pykpO5kQJ98"
  };

  const resolvedId = videoIds[ch] || "-PWMxjBgr0k";
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ channel: ch, videoId: resolvedId }));
};

