import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { CandlestickSeries, ColorType, HistogramSeries, createChart } from 'lightweight-charts';
import { Activity, Wifi, WifiOff } from 'lucide-react';

const ASSETS = [
  { value: 'bitcoin', label: 'BTC/USD' },
  { value: 'gold', label: 'XAU/USD' },
  { value: 'silver', label: 'XAG/USD' },
];
const VIEW_OPTIONS = [
  { id: '1s', label: '1s', apiTimeframe: '1s', wsTimeframe: '1s', limit: 320, secondsVisible: true },
  { id: '1m', label: '1m', apiTimeframe: '1m', wsTimeframe: '1m', limit: 300, secondsVisible: false },
  { id: '5m', label: '5m', apiTimeframe: '5m', wsTimeframe: '5m', limit: 220, secondsVisible: false },
  { id: '15m', label: '15m', apiTimeframe: '15m', wsTimeframe: '15m', limit: 180, secondsVisible: false },
];
const AUTH_COOKIE_KEY = 'ff_admin_token';
const INTERVAL_SECONDS = {
  '1s': 1,
  '1m': 60,
  '5m': 300,
  '15m': 900,
};
const DEFAULT_VISIBLE_BARS = {
  '1s': 90,
  '1m': 80,
  '5m': 60,
  '15m': 50,
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
  return `${wsRoot}/api/v1/prediction/stream?token=${encodeURIComponent(token)}`;
}

function parseBackendTimestamp(value) {
  // Backend sends ISO strings without timezone suffix (naive UTC).
  // Treat them as UTC explicitly to avoid browsers reading as local time.
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

function buildSeedOneSecondCandles(lastPrice, nowMs, size = 120) {
  const price = Number(lastPrice);
  if (!Number.isFinite(price)) return [];
  const endMs = Math.floor(nowMs / 1000) * 1000;
  const startMs = endMs - (size - 1) * 1000;
  const seeded = [];
  for (let t = startMs; t <= endMs; t += 1000) {
    seeded.push({
      timestamp: new Date(t).toISOString(),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    });
  }
  return seeded;
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

  // Fill any missing seconds with flat candles (terminal-like continuity).
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

function fillMissingCandles(rows, stepSeconds) {
  if (!rows.length || !Number.isFinite(stepSeconds) || stepSeconds <= 0) return rows;

  // Only fill small gaps. Some feeds can have large time jumps (illiquid ticks),
  // and filling every missing second would create huge arrays and make 1s view look empty/frozen.
  const maxFillBars = stepSeconds === 1 ? 5 : 2;

  const filled = [rows[0]];
  for (let i = 1; i < rows.length; i += 1) {
    const prev = filled[filled.length - 1];
    const current = rows[i];
    const gapBars = Math.floor((current.time - prev.time) / stepSeconds) - 1;
    if (gapBars > maxFillBars) {
      filled.push(current);
      continue;
    }
    let cursor = prev.time + stepSeconds;

    while (cursor < current.time) {
      filled.push({
        time: cursor,
        open: prev.close,
        high: prev.close,
        low: prev.close,
        close: prev.close,
        volume: 0,
      });
      cursor += stepSeconds;
    }

    filled.push(current);
  }

  return filled;
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

const LiveChart = () => {
  const [asset, setAsset] = useState('bitcoin');
  const [viewId, setViewId] = useState('1s');
  const [candles, setCandles] = useState([]);
  const [latestPrice, setLatestPrice] = useState(null);
  const [wsStatus, setWsStatus] = useState('idle');
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const shouldAutoFitRef = useRef(true);

  const apiBase = useMemo(() => getClientApiBaseUrl(), []);
  const liveEngineUrl = useMemo(() => getLiveEngineUrl(), []);
  const isDark = document.documentElement.classList.contains('dark');
  const selectedView = useMemo(
    () => VIEW_OPTIONS.find((item) => item.id === viewId) ?? VIEW_OPTIONS[0],
    [viewId]
  );

  useEffect(() => {
    shouldAutoFitRef.current = true;
  }, [asset, viewId]);

  const loadCandles = useCallback(async () => {
    setError('');
    
    // Check if live engine URL is configured
    if (!liveEngineUrl) {
      setError('Live Engine URL is not configured. Please set VITE_LIVE_ENGINE_URL environment variable.');
      return;
    }
    
    try {
      const response = await fetch(
        `${liveEngineUrl}/api/candles?asset=${asset}&interval=${selectedView.apiTimeframe}&limit=${selectedView.limit}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.detail || 'Failed to load candles');
      }
      
      // live-engine returns array of candles with "time" field
      if (Array.isArray(payload)) {
        // Map "time" to "timestamp" for compatibility
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
  }, [liveEngineUrl, asset, selectedView]);

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
      ws.send(JSON.stringify({ type: 'subscribe', asset, timeframe: selectedView.wsTimeframe }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'error') {
          setError(message.message || 'WebSocket error');
          return;
        }
        if (message.type === 'subscribed') {
          if (typeof message.price === 'number') {
            setLatestPrice(message.price);
            // Don't seed for 1s - we now load historical data from API
          }
          return;
        }
        if (
          message.type !== 'priceTick' ||
          message.asset !== asset ||
          message.timeframe !== selectedView.wsTimeframe
        ) {
          return;
        }

        const price = Number(message.price);
        if (!Number.isFinite(price)) return;
        setLatestPrice(price);

        if (selectedView.id === '1s') {
          // Build terminal-style 1-second candles directly from ticks.
          const tickMs = parseBackendTimestamp(message.asOf) ?? Date.now();
          setCandles((prev) => appendTickToOneSecondCandles(prev, price, tickMs));
          return;
        }

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
        setCandles((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c) => c.timestamp === candle.timestamp);
          if (idx >= 0) {
            next[idx] = candle;
          } else {
            next.push(candle);
          }
          return next.slice(-600);
        });
      } catch {
        // Ignore malformed event payloads.
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
    };
  }, [apiBase, asset, selectedView, disconnectWebSocket]);

  useEffect(() => {
    const authToken = Cookies.get(AUTH_COOKIE_KEY);
    if (!authToken) {
      disconnectWebSocket();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCandles();
    connectWebSocket();

    return () => disconnectWebSocket();
  }, [asset, viewId, loadCandles, connectWebSocket, disconnectWebSocket]);

  const authMissing = !Cookies.get(AUTH_COOKIE_KEY);
  const displayError = authMissing ? 'Admin auth token not found. Please log in again.' : error;

  useEffect(() => {
    if (!chartContainerRef.current) return undefined;

    try {
      const chart = createChart(chartContainerRef.current, {
        autoSize: true,
        localization: {
          // Keep chart labels aligned with user's local system clock.
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
        },
        timeScale: {
          borderColor: isDark ? '#3f3f46' : '#cbd5e1',
          timeVisible: true,
          secondsVisible: selectedView.secondsVisible,
          tickMarkFormatter: (time) =>
            formatLocalFromChartTime(time, selectedView.secondsVisible),
          rightOffset: 2,
          barSpacing: selectedView.id === '1s' ? 18 : 20,
          minBarSpacing: selectedView.id === '1s' ? 12 : 14,
        },
      });

      const candleOptions = {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: true,
        borderColor: isDark ? '#52525b' : '#94a3b8',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceLineVisible: true,
      };
      const volumeOptions = {
        color: '#64748b',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      };

      // Support lightweight-charts v5 (addSeries) and older APIs (addCandlestickSeries/addHistogramSeries).
      const candleSeries =
        typeof chart.addCandlestickSeries === 'function'
          ? chart.addCandlestickSeries(candleOptions)
          : chart.addSeries(CandlestickSeries, candleOptions);
      const volumeSeries =
        typeof chart.addHistogramSeries === 'function'
          ? chart.addHistogramSeries(volumeOptions)
          : chart.addSeries(HistogramSeries, volumeOptions);

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
    } catch (chartError) {
      // Keep UI stable even if chart library init fails.
      console.error('Failed to initialize trading chart', chartError);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isDark, selectedView.id, selectedView.secondsVisible]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

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
        
        return {
          time,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: isFiniteNumber(c.volume) ? Number(c.volume) : 0,
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

    const normalized = fillMissingCandles(deduped, INTERVAL_SECONDS[selectedView.id] ?? 1);

    try {
      candleSeriesRef.current.setData(
        normalized.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      volumeSeriesRef.current.setData(
        normalized.map((c) => ({
          time: c.time,
          value: c.volume,
          color:
            c.close > c.open
              ? 'rgba(34,197,94,0.45)'
              : c.close < c.open
                ? 'rgba(239,68,68,0.45)'
                : 'rgba(100,116,139,0.45)',
        }))
      );
    } catch (updateError) {
      console.error('Chart setData failed', updateError);
      return;
    }

    if (normalized.length && chartRef.current && shouldAutoFitRef.current) {
      const visibleBars = DEFAULT_VISIBLE_BARS[selectedView.id] ?? 60;
      const from = Math.max(0, normalized.length - visibleBars);
      const to = normalized.length + 1;
      chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
      chartRef.current.timeScale().scrollToRealTime();
      shouldAutoFitRef.current = false;
    }
  }, [candles, selectedView.id]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Live Market Chart
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tiingo live feed routed through FastAPI websocket.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {wsStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-500" />
            )}
            <span className="capitalize text-slate-600 dark:text-slate-300">{wsStatus}</span>
            <Activity className="ml-2 h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-900 dark:text-white">
              {latestPrice ? latestPrice.toFixed(2) : '-'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ASSETS.map((item) => (
            <button
              key={item.value}
              onClick={() => setAsset(item.value)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                asset === item.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
              }`}
            >
              {item.label}
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

export default LiveChart;
