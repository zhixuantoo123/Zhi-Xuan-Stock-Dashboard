# PowerShell Lightweight HTTP Server & Market Data Proxy
# Fully compatible with Windows PowerShell 5.1 and PowerShell 7+

param(
    [int]$Port = 3000
)

$ErrorActionPreference = "Continue"

$BaseDir = $PSScriptRoot
if (-not $BaseDir) { $BaseDir = (Get-Location).Path }

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
}

$Cache = @{
    MarketSummary = $null
    MarketSummaryTime = [DateTime]::MinValue
    News = $null
    NewsTime = [DateTime]::MinValue
}

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:${Port}/")
$Listener.Prefixes.Add("http://127.0.0.1:${Port}/")

try {
    $Listener.Start()
    Write-Host "[SERVER] Trading Dashboard Server running on http://localhost:${Port}" -ForegroundColor Green
    Write-Host "[SERVER] Base directory: $BaseDir" -ForegroundColor Cyan
} catch {
    Write-Host "[SERVER] Error starting on port ${Port}: $($_.Exception.Message)" -ForegroundColor Red
    $Port = 3050
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add("http://localhost:${Port}/")
    $Listener.Prefixes.Add("http://127.0.0.1:${Port}/")
    $Listener.Start()
    Write-Host "[SERVER] Switched and running on http://localhost:${Port}" -ForegroundColor Green
}

function Send-JsonResponse($response, $data, [int]$statusCode = 200) {
    $json = $data | ConvertTo-Json -Depth 10 -Compress
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.StatusCode = $statusCode
    $response.ContentType = "application/json; charset=utf-8"
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Gemini-Key")
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}

function Send-RawResponse($response, [string]$content, [string]$contentType = "application/json; charset=utf-8", [int]$statusCode = 200) {
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
    $response.StatusCode = $statusCode
    $response.ContentType = $contentType
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Gemini-Key")
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}

$CoreSymbols = @(
    @{ id = "SP500"; symbol = "^GSPC"; name = "S&P 500"; category = "Indices"; type = "index" },
    @{ id = "NASDAQ"; symbol = "^IXIC"; name = "NASDAQ Composite"; category = "Indices"; type = "index" },
    @{ id = "DOW"; symbol = "^DJI"; name = "Dow Jones Industrial"; category = "Indices"; type = "index" },
    @{ id = "VIX"; symbol = "^VIX"; name = "CBOE Volatility Index (VIX)"; category = "Indices"; type = "volatility" },
    @{ id = "FTSE"; symbol = "^FTSE"; name = "FTSE 100"; category = "Indices"; type = "index" },
    @{ id = "NIKKEI"; symbol = "^N225"; name = "Nikkei 225"; category = "Indices"; type = "index" },
    @{ id = "HSI"; symbol = "^HSI"; name = "Hang Seng Index"; category = "Indices"; type = "index" },
    @{ id = "STI"; symbol = "^STI"; name = "Straits Times Index (STI)"; category = "Indices"; type = "index" },
    @{ id = "BTC"; symbol = "BTC-USD"; binance = "BTCUSDT"; name = "Bitcoin"; category = "Crypto"; type = "crypto" },
    @{ id = "ETH"; symbol = "ETH-USD"; binance = "ETHUSDT"; name = "Ethereum"; category = "Crypto"; type = "crypto" },
    @{ id = "GOLD"; symbol = "GC=F"; name = "Gold Futures"; category = "Commodities"; type = "commodity" },
    @{ id = "SILVER"; symbol = "SI=F"; name = "Silver Futures"; category = "Commodities"; type = "commodity" },
    @{ id = "OIL"; symbol = "CL=F"; name = "Crude Oil WTI"; category = "Commodities"; type = "commodity" }
)

while ($Listener.IsListening) {
    $context = $Listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $urlPath = $request.Url.AbsolutePath
    $query = $request.QueryString

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 204
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Gemini-Key")
        $response.OutputStream.Close()
        continue
    }

    try {
        # API: Market Summary
        if ($urlPath -eq "/api/market-summary") {
            $now = [DateTime]::UtcNow
            if ($Cache.MarketSummary -and (($now - $Cache.MarketSummaryTime).TotalSeconds -lt 12)) {
                Send-JsonResponse $response $Cache.MarketSummary
                continue
            }

            $results = @()
            $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }

            foreach ($item in $CoreSymbols) {
                try {
                    $symEncoded = [System.Uri]::EscapeDataString($item.symbol)
                    $apiUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$symEncoded`?interval=1d&range=5d"
                    $data = (Invoke-RestMethod -Uri $apiUrl -Headers $headers -TimeoutSec 4).chart.result[0]
                    $meta = $data.meta

                    $price = [double]$meta.regularMarketPrice
                    $prevClose = if ($meta.chartPreviousClose) { [double]$meta.chartPreviousClose } else { [double]$meta.previousClose }
                    $change = $price - $prevClose
                    $pctChange = if ($prevClose -gt 0) { [math]::Round(($change / $prevClose) * 100, 2) } else { 0 }
                    $high = if ($meta.regularMarketDayHigh) { [double]$meta.regularMarketDayHigh } else { $price }
                    $low = if ($meta.regularMarketDayLow) { [double]$meta.regularMarketDayLow } else { $price }
                    $volume = if ($meta.regularMarketVolume) { [double]$meta.regularMarketVolume } else { 0 }
                    $week52High = if ($meta.fiftyTwoWeekHigh) { [double]$meta.fiftyTwoWeekHigh } else { $high }
                    $week52Low = if ($meta.fiftyTwoWeekLow) { [double]$meta.fiftyTwoWeekLow } else { $low }

                    $quotes = $data.indicators.quote[0].close
                    $sparkline = @()
                    if ($quotes) {
                        foreach ($q in $quotes) {
                            if ($q -ne $null) { $sparkline += [math]::Round([double]$q, 2) }
                        }
                    }

                    $marketState = if ($meta.tradingPeriods) { "OPEN" } else { "REGULAR" }

                    $results += @{
                        id = $item.id
                        symbol = $item.symbol
                        name = $item.name
                        category = $item.category
                        type = $item.type
                        binance = $item.binance
                        price = [math]::Round($price, 2)
                        change = [math]::Round($change, 2)
                        pctChange = $pctChange
                        high = [math]::Round($high, 2)
                        low = [math]::Round($low, 2)
                        week52High = [math]::Round($week52High, 2)
                        week52Low = [math]::Round($week52Low, 2)
                        volume = $volume
                        prevClose = [math]::Round($prevClose, 2)
                        sparkline = $sparkline
                        marketState = $marketState
                        currency = $meta.currency
                        timestamp = $meta.regularMarketTime
                        status = "LIVE"
                    }
                } catch {
                    $results += @{
                        id = $item.id
                        symbol = $item.symbol
                        name = $item.name
                        category = $item.category
                        type = $item.type
                        price = 0
                        status = "UNAVAILABLE"
                        error = $_.Exception.Message
                    }
                }
            }

            $summaryData = @{
                success = $true
                timestamp = [DateTime]::UtcNow.ToString("o")
                data = $results
            }
            $Cache.MarketSummary = $summaryData
            $Cache.MarketSummaryTime = $now
            Send-JsonResponse $response $summaryData
            continue
        }

        # API: Chart Kline/Historical Data
        if ($urlPath -eq "/api/chart") {
            $sym = $query["symbol"]
            if (-not $sym) { $sym = "^GSPC" }
            $interval = $query["interval"]
            if (-not $interval) { $interval = "1d" }
            $range = $query["range"]
            if (-not $range) { $range = "1mo" }
            if ($range -eq "all") { $range = "max" }

            $symEncoded = [System.Uri]::EscapeDataString($sym)
            # Normalize special global and portfolio tickers
            if ($sym -eq "VWRA") { $symEncoded = "VWRA.L" }
            if ($sym -match "^0+(\d+\.HK)$") { $symEncoded = $matches[1] }

            $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            
            # Using native range=max returns full Day 1 inception history without cutting off any start date
            $apiUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$symEncoded`?interval=$interval&range=$range"

            try {
                $raw = (Invoke-WebRequest -Uri $apiUrl -Headers $headers -TimeoutSec 10 -UseBasicParsing).Content
                Send-RawResponse $response $raw "application/json"
            } catch {
                Send-JsonResponse $response @{ error = "Failed to fetch chart: " + $_.Exception.Message } 500
            }
            continue
        }

        # API: Live Stream Video ID Resolver (100% Zero-Login Singapore & Global Broadcasts)
        if ($urlPath -eq "/api/live-id") {
            $ch = $query["channel"]
            if (-not $ch) { $ch = "cna" }
            
            $videoIds = @{
                "cna" = "-PWMxjBgr0k"
                "bloomberg" = "dp8PhLsUcFE"
                "skynews" = "9Auq9mYxFEE"
                "france24" = "h3MuIUNCCzI"
                "dwnews" = "gCNeDWCI0Q0"
                "aljazeera" = "bNyUyrR0PHo"
                "euronews" = "pykpO5kQJ98"
            }
            
            $resolvedId = $videoIds[$ch]
            if (-not $resolvedId) { $resolvedId = "-PWMxjBgr0k" }

            # Attempt live lookup if CNA rotates
            if ($ch -eq "cna") {
                try {
                    $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                    $html = (Invoke-WebRequest -Uri "https://www.youtube.com/@channelnewsasia/live" -Headers $headers -TimeoutSec 3 -UseBasicParsing).Content
                    if ($html -match 'watch\?v=([a-zA-Z0-9_-]{11})') {
                        $resolvedId = $matches[1]
                    }
                } catch {}
            }
            
            Send-JsonResponse $response @{ channel = $ch; videoId = $resolvedId }
            continue
        }

        # API: Global Ticker Search (Find ANY stock, index, ETF, crypto worldwide)
        if ($urlPath -eq "/api/search") {
            $q = $query["q"]
            if (-not $q) {
                Send-JsonResponse $response @{ quotes = @() }
                continue
            }

            $qEncoded = [System.Uri]::EscapeDataString($q)
            $headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            $apiUrl = "https://query1.finance.yahoo.com/v1/finance/search?q=$qEncoded`&quotesCount=8&newsCount=0"

            try {
                $raw = (Invoke-WebRequest -Uri $apiUrl -Headers $headers -TimeoutSec 5 -UseBasicParsing).Content
                Send-RawResponse $response $raw "application/json"
            } catch {
                Send-JsonResponse $response @{ quotes = @(); error = $_.Exception.Message }
            }
            continue
        }

        # API: News Feed (Multi-Source Global & Financial Feeds)
        if ($urlPath -eq "/api/news") {
            $now = [DateTime]::UtcNow
            if ($Cache.News -and (($now - $Cache.NewsTime).TotalSeconds -lt 40)) {
                Send-JsonResponse $response $Cache.News
                continue
            }

            $newsItems = @()
            $rssUrls = @(
                @{ name = "CNBC Markets"; url = "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664"; category = "Equities"; source = "CNBC" },
                @{ name = "CNBC Economy"; url = "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258"; category = "CentralBanks"; source = "CNBC Economy" },
                @{ name = "CNBC World News"; url = "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362"; category = "Geopolitics"; source = "CNBC World" },
                @{ name = "CNBC Tech"; url = "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910"; category = "Equities"; source = "CNBC Tech" },
                @{ name = "CNBC Energy"; url = "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19836768"; category = "Commodities"; source = "CNBC Commodities" },
                @{ name = "CoinTelegraph"; url = "https://cointelegraph.com/rss"; category = "Crypto"; source = "CoinTelegraph" }
            )

            foreach ($feed in $rssUrls) {
                try {
                    $xmlContent = (Invoke-WebRequest -Uri $feed.url -Headers @{ "User-Agent" = "Mozilla/5.0" } -TimeoutSec 4 -UseBasicParsing).Content
                    $xml = [xml]$xmlContent
                    $items = $xml.rss.channel.item
                    if ($items) {
                        $count = 0
                        foreach ($it in $items) {
                            if ($count -ge 10) { break }
                            $newsItems += @{
                                title = [string]$it.title
                                link = [string]$it.link
                                pubDate = [string]$it.pubDate
                                description = [string]$it.description
                                source = [string]$feed.source
                                category = [string]$feed.category
                            }
                            $count++
                        }
                    }
                } catch {
                    # Skip failed feed gracefully
                }
            }

            $newsData = @{
                success = $true
                timestamp = [DateTime]::UtcNow.ToString("o")
                data = $newsItems
            }
            $Cache.News = $newsData
            $Cache.NewsTime = $now
            Send-JsonResponse $response $newsData
            continue
        }

        # Static File Serving
        $reqPath = $urlPath.TrimStart('/')
        if (-not $reqPath -or $reqPath -eq "") { $reqPath = "index.html" }
        $filePath = Join-Path $BaseDir $reqPath

        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        if (-not $fullPath.StartsWith($BaseDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            Send-RawResponse $response "403 Forbidden" "text/plain" 403
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = if ($MimeTypes.ContainsKey($ext)) { $MimeTypes[$ext] } else { "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.StatusCode = 200
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        } else {
            Send-RawResponse $response "404 Not Found: $reqPath" "text/plain" 404
        }
    } catch {
        try {
            Send-JsonResponse $response @{ error = $_.Exception.Message } 500
        } catch {}
    }
}
