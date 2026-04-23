import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { ColorType, createChart } from 'lightweight-charts';
import { Activity, Wifi, WifiOff } from 'lucide-react';

const TIMEFRAMES = ['1m', '2m', '5m', '15m'];
const AUTH_COOKIE_KEY = 'ff_admin_token';

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

function toWsUrl(apiBase, token) {
  const root = apiBase.replace(/\/api\/v1\/?$/, '');
  const wsRoot = root.startsWith('https://')
    ? root.replace('https://', 'wss://')
    : root.replace('http://', 'ws://');
  return `${wsRoot}/api/v1/prediction/stream?token=${encodeURIComponent(token)}`;
}

function asUnixSeconds(value) {
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000);
}

const LiveChart = () => {
  const [asset] = useState('bitcoin');
  const [timeframe, setTimeframe] = useState('1m');
  const [candles, setCandles] = useState([]);
  const [latestPrice, setLatestPrice] = useState(null);
  const [wsStatus, setWsStatus] = useState('idle');
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const apiBase = useMemo(() => getClientApiBaseUrl(), []);
  const isDark = document.documentElement.classList.contains('dark');

  const loadCandles = useCallback(async () => {
    const authToken = Cookies.get(AUTH_COOKIE_KEY);
    if (!authToken) {
      setError('Admin auth token not found. Please log in again.');
      return;
    }
    setError('');
    try {
      const response = await fetch(
        `${apiBase}/prediction/markets/${asset}/candles?timeframe=${timeframe}&limit=60`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || 'Failed to load candles');
      }
      setCandles(Array.isArray(payload?.candles) ? payload.candles : []);
    } catch (err) {
      setError(err?.message || 'Unable to fetch candle history');
    }
  }, [apiBase, asset, timeframe]);

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
      ws.send(JSON.stringify({ type: 'subscribe', asset, timeframe }));
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
          }
          return;
        }
        if (message.type !== 'priceTick' || message.asset !== asset || !message.candle) return;

        setLatestPrice(Number(message.price));
        const candle = message.candle;
        setCandles((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c) => c.timestamp === candle.timestamp);
          if (idx >= 0) {
            next[idx] = candle;
          } else {
            next.push(candle);
          }
          return next.slice(-100);
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
  }, [apiBase, asset, timeframe, disconnectWebSocket]);

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
  }, [timeframe, loadCandles, connectWebSocket, disconnectWebSocket]);

  const authMissing = !Cookies.get(AUTH_COOKIE_KEY);
  const displayError = authMissing ? 'Admin auth token not found. Please log in again.' : error;

  useEffect(() => {
    if (!chartContainerRef.current) return undefined;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
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
      rightPriceScale: {
        borderColor: isDark ? '#3f3f46' : '#cbd5e1',
      },
      timeScale: {
        borderColor: isDark ? '#3f3f46' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceLineVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#64748b',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isDark, timeframe]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const normalized = candles
      .map((c) => {
        const time = asUnixSeconds(c.timestamp);
        if (time === null) return null;
        return {
          time,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: Number(c.volume ?? 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

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
        color: c.close >= c.open ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
      }))
    );

    if (normalized.length && chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Live BTC Chart</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Backend stream monitor for Flutter implementation reference.
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

        <div className="mt-4 flex gap-2">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700'
                }`}
              >
                {tf}
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
