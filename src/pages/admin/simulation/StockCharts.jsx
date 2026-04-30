import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { CandlestickSeries, AreaSeries, ColorType, createChart } from 'lightweight-charts';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { US_STOCK_LIST, INDIAN_STOCK_LIST, UK_STOCK_LIST } from '../../../api/simulationApi';

const VIEW_OPTIONS = [
  { id: '1s', label: '1s', apiTimeframe: '1s', wsTimeframe: '1s', limit: 320, secondsVisible: true },
  { id: '1m', label: '1m', apiTimeframe: '1m', wsTimeframe: '1m', limit: 300, secondsVisible: false },
  { id: '5m', label: '5m', apiTimeframe: '5m', wsTimeframe: '5m', limit: 220, secondsVisible: false },
  { id: '15m', label: '15m', apiTimeframe: '15m', wsTimeframe: '15m', limit: 180, secondsVisible: false },
];

const AUTH_COOKIE_KEY = 'ff_admin_token';

const DEFAULT_VISIBLE_BARS = {
  '1s': 80,
  '1m': 80,
  '5m': 80,
  '15m': 80,
};

function getClientApiBaseUrl() {
  const configured = import.meta.env.VITE_CLIENT_API_URL;
  if (configured) return configured.replace(/\/$/, '');

  const adminApi = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';
  if (adminApi.includes('admin-api.')) {
    return adminApi.replace('admin-api.', 'api.');
  }
  if (adminApi.includes(':5002')) {
    return adminApi.replace(':5002', ':5001');
  }
  return adminApi;
}

function getLiveEngineUrl() {
  const configured = import.meta.env.VITE_LIVE_ENGINE_URL;
  if (!configured) {
    console.error('VITE_LIVE_ENGINE_URL is not configured!');
    return null;
  }
  return configured.replace(/\/$/, '');
}

function toWsUrl(apiBase, token) {
  const root = apiBase.replace(/\/api\/v1\/?$/, '');
  const wsRoot = root.startsWith('https://')
    ? root.replace('https://', 'wss://')
    : root.replace('http://', 'ws://');
  return `${wsRoot}/api/v1/simulation/stream?token=${encodeURIComponent(token)}`;
}

function parseBackendTimestamp(value) {
  if (typeof value !== 'string') {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const hasTz = /[Zz]|[+-]\d\d:?\d\d$/.test(value);
  const normalized = hasTz ? value : `${value}Z`;
  const ms = new Date(normalized).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function asUnixSeconds(value) {
  const ms = parseBackendTimestamp(value);
  if (ms === null) return null;
  return Math.floor(ms / 1000);
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function appendTickToOneSecondCandles(prev, tickPrice, tickMs) {
  const bucketMs = Math.floor(tickMs / 1000) * 1000;
  const bucketIso = new Date(bucketMs).toISOString();
  const price = Number(tickPrice);
  if (!Number.isFinite(price)) return prev;

  if (!prev.length) {
    return [
      {
        timestamp: bucketIso,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1,
      },
    ];
  }

  const next = [...prev];
  const last = next[next.length - 1];
  const lastMs = parseBackendTimestamp(last.timestamp);
  if (lastMs === null) return prev;

  if (bucketMs === lastMs) {
    next[next.length - 1] = {
      ...last,
      high: Math.max(Number(last.high), price),
      low: Math.min(Number(last.low), price),
      close: price,
      volume: (Number(last.volume) || 0) + 1,
    };
    return next.slice(-600);
  }

  let cursor = lastMs + 1000;
  let prevClose = Number(last.close);
  while (cursor < bucketMs) {
    const flatIso = new Date(cursor).toISOString();
    next.push({
      timestamp: flatIso,
      open: prevClose,
      high: prevClose,
      low: prevClose,
      close: prevClose,
      volume: 0,
    });
    cursor += 1000;
  }

  next.push({
    timestamp: bucketIso,
    open: prevClose,
    high: Math.max(prevClose, price),
    low: Math.min(prevClose, price),
    close: price,
    volume: 1,
  });
  return next.slice(-600);
}

function formatLocalFromChartTime(time, showSeconds = true) {
  if (typeof time !== 'number') return '';
  return new Date(time * 1000).toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
  });
}

const StockCharts = () => {
  const [selectedMarket, setSelectedMarket] = useState('US');
  const [selectedStock, setSelectedStock] = useState(US_STOCK_LIST[0]);
  const [viewId, setViewId] = useState('1s');
  const [candles, setCandles] = useState([]);
  const [latestPrice, setLatestPrice] = useState(null);
  const [wsStatus, setWsStatus] = useState('idle');
  const [marketStatus, setMarketStatus] = useState('unknown');
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const wsRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const shouldAutoFitRef = useRef(true);

  const apiBase = useMemo(() => getClientApiBaseUrl(), []);
  const liveEngineUrl = useMemo(() => getLiveEngineUrl(), []);
  const selectedView = useMemo(
    () => VIEW_OPTIONS.find((item) => item.id === viewId) ?? VIEW_OPTIONS[0],
    [viewId]
  );

  const currentStockList = selectedMarket === 'US' ? US_STOCK_LIST : selectedMarket === 'India' ? INDIAN_STOCK_LIST : UK_STOCK_LIST;

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    shouldAutoFitRef.current = true;
  }, [selectedStock, viewId, selectedMarket]);

  const loadMarketStatus = useCallback(async () => {
    if (!liveEngineUrl) return;
    
    try {
      // Fetch market-specific status based on selected market
      const endpoint = selectedMarket === 'US' ? '/api/stocks/us' : selectedMarket === 'India' ? '/api/stocks/indian' : '/api/stocks/uk';
      const response = await fetch(`${liveEngineUrl}${endpoint}`);
      const data = await response.json();
      
      // API returns { stocks: [...], total: 12, marketStatus: "closed", market: "US" }
      if (data.marketStatus) {
        setMarketStatus(data.marketStatus);
        console.log(`✅ ${selectedMarket} Market Status:`, data.marketStatus);
      }
    } catch (err) {
      console.error('Failed to fetch market status:', err);
    }
  }, [liveEngineUrl, selectedMarket]);

  const loadCandles = useCallback(async () => {
    setError('');
    
    if (!liveEngineUrl) {
      setError('Live Engine URL is not configured. Please set VITE_LIVE_ENGINE_URL environment variable.');
      return;
    }
    
    // Determine asset prefix based on market
    const assetPrefix = selectedMarket === 'US' ? 'stock_' : selectedMarket === 'India' ? 'indian_stock_' : 'uk_stock_';
    const asset = `${assetPrefix}${selectedStock.symbol.toLowerCase()}`;
    
    try {
      const response = await fetch(
        `${liveEngineUrl}/api/candles?asset=${asset}&interval=${selectedView.apiTimeframe}&limit=${selectedView.limit}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.detail || 'Failed to load candles');
      }
      
      if (Array.isArray(payload)) {
        const mappedCandles = payload.map(c => ({
          timestamp: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || 0,
        }));
        setCandles(mappedCandles);
      } else {
        setCandles([]);
      }
    } catch (err) {
      console.error('❌ Error loading candles:', err);
      setError(err?.message || 'Unable to fetch candle history');
    }
  }, [liveEngineUrl, selectedStock, selectedMarket, selectedView]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    const authToken = Cookies.get(AUTH_COOKIE_KEY);
    if (!authToken) {
      setError('Admin auth token not found. Please log in again.');
      setWsStatus('error');
      return;
    }
    
    disconnectWebSocket();
    const wsUrl = toWsUrl(apiBase, authToken);
    setWsStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      // Send subscription message with stock symbol and timeframe
      ws.send(JSON.stringify({ 
        type: 'subscribe', 
        stock: selectedStock.symbol.toLowerCase(),
        timeframe: selectedView.wsTimeframe
      }));
      console.log(`✅ Subscribed to ${selectedStock.symbol.toLowerCase()}:${selectedView.wsTimeframe}`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle welcome message
        if (message.type === 'welcome') {
          console.log('📡 Connected to simulation stream');
          return;
        }
        
        // Handle subscribed confirmation
        if (message.type === 'subscribed') {
          console.log(`✅ Subscribed confirmed for ${message.stock}:${message.timeframe}`);
          if (typeof message.price === 'number') {
            setLatestPrice(message.price);
          }
          return;
        }
        
        // Handle error messages
        if (message.type === 'error') {
          console.error('❌ WebSocket error:', message.message);
          setError(message.message || 'WebSocket error');
          return;
        }
        
        // Handle priceTick messages (real-time updates with candles)
        if (
          message.type !== 'priceTick' ||
          message.stock !== selectedStock.symbol.toLowerCase() ||
          message.timeframe !== selectedView.wsTimeframe
        ) {
          return;
        }

        const price = Number(message.price);
        if (!Number.isFinite(price)) return;
        setLatestPrice(price);

        if (selectedView.id === '1s') {
          // Build 1-second candles from ticks
          const tickMs = parseBackendTimestamp(message.asOf) ?? Date.now();
          setCandles((prev) => appendTickToOneSecondCandles(prev, price, tickMs));
          return;
        }

        // For 1m, 5m, 15m: use aggregated candle from backend
        if (!message.candle) return;
        const candle = message.candle;
        if (
          !isFiniteNumber(candle.open) ||
          !isFiniteNumber(candle.high) ||
          !isFiniteNumber(candle.low) ||
          !isFiniteNumber(candle.close)
        ) {
          return;
        }
        const incomingSec = asUnixSeconds(candle.timestamp);
        if (incomingSec === null) return;
        
        setCandles((prev) => {
          const next = [...prev];
          // Match on bucketed unix seconds
          const idx = next.findIndex((c) => asUnixSeconds(c.timestamp) === incomingSec);
          const merged = {
            timestamp: candle.timestamp,
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
            volume: isFiniteNumber(candle.volume) ? Number(candle.volume) : 0,
          };
          if (idx >= 0) {
            next[idx] = merged;
          } else {
            next.push(merged);
          }
          return next.slice(-600);
        });
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
    };
  }, [apiBase, selectedStock, selectedView, disconnectWebSocket]);

  useEffect(() => {
    const authToken = Cookies.get(AUTH_COOKIE_KEY);
    if (!authToken) {
      disconnectWebSocket();
      return;
    }
    
    loadMarketStatus();
    loadCandles();
    connectWebSocket();

    return () => disconnectWebSocket();
  }, [selectedStock, viewId, selectedMarket, loadMarketStatus, loadCandles, connectWebSocket, disconnectWebSocket]);

  const authMissing = !Cookies.get(AUTH_COOKIE_KEY);
  const displayError = authMissing ? 'Admin auth token not found. Please log in again.' : error;

  useEffect(() => {
    if (!chartContainerRef.current) return undefined;

    try {
      const chart = createChart(chartContainerRef.current, {
        autoSize: true,
        localization: {
          timeFormatter: (time) => formatLocalFromChartTime(time, selectedView.secondsVisible),
        },
        layout: {
          attributionLogo: false,
          background: { type: ColorType.Solid, color: isDark ? '#0a0a0a' : '#ffffff' },
          textColor: isDark ? '#d4d4d8' : '#334155',
        },
        grid: {
          vertLines: { color: isDark ? '#262626' : '#e2e8f0' },
          horzLines: { color: isDark ? '#262626' : '#e2e8f0' },
        },
        crosshair: {
          vertLine: { color: isDark ? '#52525b' : '#94a3b8' },
          horzLine: { color: isDark ? '#52525b' : '#94a3b8' },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
        rightPriceScale: {
          borderColor: isDark ? '#3f3f46' : '#cbd5e1',
          autoScale: true,
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderColor: isDark ? '#3f3f46' : '#cbd5e1',
          timeVisible: true,
          secondsVisible: selectedView.secondsVisible,
          tickMarkFormatter: (time) =>
            formatLocalFromChartTime(time, selectedView.secondsVisible),
          rightOffset: 2,
          barSpacing: selectedView.id === '1s' ? 16 : 18,
          minBarSpacing: selectedView.id === '1s' ? 10 : 12,
        },
      });

      let mainSeries;
      
      if (selectedView.id === '1s') {
        const areaOptions = {
          lineColor: '#22c55e',
          topColor: 'rgba(34, 197, 94, 0.4)',
          bottomColor: 'rgba(34, 197, 94, 0.0)',
          lineWidth: 2,
          priceLineVisible: true,
        };
        mainSeries = typeof chart.addAreaSeries === 'function'
          ? chart.addAreaSeries(areaOptions)
          : chart.addSeries(AreaSeries, areaOptions);
      } else {
        const candleOptions = {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: true,
          borderUpColor: '#16a34a',
          borderDownColor: '#dc2626',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          priceLineVisible: true,
        };

        mainSeries = typeof chart.addCandlestickSeries === 'function'
          ? chart.addCandlestickSeries(candleOptions)
          : chart.addSeries(CandlestickSeries, candleOptions);
      }

      mainSeries.priceScale().applyOptions({
        autoScale: true,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = mainSeries;
    } catch (chartError) {
      console.error('Failed to initialize trading chart', chartError);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [isDark, selectedView.id, selectedView.secondsVisible]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const mapped = candles
      .map((c) => {
        const time = asUnixSeconds(c.timestamp);
        if (time === null) return null;
        if (
          !isFiniteNumber(c.open) ||
          !isFiniteNumber(c.high) ||
          !isFiniteNumber(c.low) ||
          !isFiniteNumber(c.close)
        ) {
          return null;
        }

        if (selectedView.id === '1s') {
          return {
            time,
            value: Number(c.close),
          };
        }

        return {
          time,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    const deduped = [];
    for (const row of mapped) {
      if (deduped.length && deduped[deduped.length - 1].time === row.time) {
        deduped[deduped.length - 1] = row;
      } else {
        deduped.push(row);
      }
    }

    try {
      candleSeriesRef.current.setData(deduped);
    } catch (updateError) {
      console.error('Chart setData failed', updateError);
      return;
    }

    if (deduped.length && chartRef.current && shouldAutoFitRef.current) {
      const visibleBars = DEFAULT_VISIBLE_BARS[selectedView.id] ?? 60;
      const from = Math.max(0, deduped.length - visibleBars);
      const to = deduped.length + 1;
      chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
      chartRef.current.timeScale().scrollToRealTime();
      candleSeriesRef.current.priceScale().applyOptions({ autoScale: true });
      shouldAutoFitRef.current = false;
    }
  }, [candles, selectedView.id]);

  const isMarketClosed = marketStatus === 'closed';

  return (
    <div className="p-4 sm:p-6">
      {isMarketClosed && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {selectedMarket === 'US' ? 'US' : selectedMarket === 'India' ? 'Indian' : 'UK'} Stock Market is Currently Closed
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {selectedMarket === 'US' 
                  ? 'Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday.'
                  : selectedMarket === 'India'
                  ? 'Market hours: 9:15 AM - 3:30 PM IST, Monday-Friday.'
                  : 'Market hours: 8:00 AM - 4:30 PM GMT, Monday-Friday.'
                } Live data will resume when market opens.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Stock Live Charts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time stock prices with candle aggregation via FastAPI backend.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {wsStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-500" />
            )}
            <span className="capitalize text-slate-600 dark:text-slate-300">{wsStatus}</span>
            {isMarketClosed && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Market Closed
              </span>
            )}
            <Activity className="ml-2 h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-900 dark:text-white">
              {latestPrice ? `${latestPrice.toFixed(2)}` : '-'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedMarket('US');
              setSelectedStock(US_STOCK_LIST[0]);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedMarket === 'US'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
            }`}
          >
            🇺🇸 US Market
          </button>
          <button
            onClick={() => {
              setSelectedMarket('India');
              setSelectedStock(INDIAN_STOCK_LIST[0]);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedMarket === 'India'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
            }`}
          >
            🇮🇳 Indian Market
          </button>
          <button
            onClick={() => {
              setSelectedMarket('UK');
              setSelectedStock(UK_STOCK_LIST[0]);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedMarket === 'UK'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
            }`}
          >
            🇬🇧 UK Market
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {currentStockList.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => setSelectedStock(stock)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                selectedStock.symbol === stock.symbol
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
              }`}
            >
              {stock.symbol}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setViewId(option.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                viewId === option.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {displayError ? <p className="mt-3 text-sm text-rose-500">{displayError}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="h-[320px] sm:h-[420px]">
          <div ref={chartContainerRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
};

export default StockCharts;
