import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { STOCK_LIST } from '../../../api/simulationApi';

function getLiveEngineUrl() {
  const configured = import.meta.env.VITE_LIVE_ENGINE_URL;
  if (!configured) {
    console.error('VITE_LIVE_ENGINE_URL is not configured!');
    return null;
  }
  return configured.replace(/\/$/, '');
}

function toWsUrl(liveEngineUrl, asset) {
  const root = liveEngineUrl.replace(/\/api\/v1\/?$/, '');
  const wsRoot = root.startsWith('https://')
    ? root.replace('https://', 'wss://')
    : root.replace('http://', 'ws://');
  return `${wsRoot}/api/ws/stream?asset=${asset}`;
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

// Single stock chart component
const StockChart = ({ symbol, name }) => {
  const [price, setPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [wsStatus, setWsStatus] = useState('idle');
  const [marketStatus, setMarketStatus] = useState('unknown');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const pricesRef = useRef([]);

  const liveEngineUrl = useMemo(() => getLiveEngineUrl(), []);
  const isDark = document.documentElement.classList.contains('dark');
  const asset = `stock_${symbol.toLowerCase()}`;

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!liveEngineUrl) {
      setWsStatus('error');
      return;
    }

    disconnectWebSocket();
    const wsUrl = toWsUrl(liveEngineUrl, asset);
    setWsStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Update market status if provided
        if (data.marketStatus) {
          setMarketStatus(data.marketStatus);
        }
        
        if (data.type === 'tick' && typeof data.price === 'number') {
          const newPrice = data.price;
          setPrice((prevPrice) => {
            if (prevPrice !== null) {
              setPriceChange(newPrice - prevPrice);
            }
            return newPrice;
          });

          // Add to price history for chart
          const timestamp = asUnixSeconds(data.timestamp || new Date().toISOString());
          if (timestamp !== null) {
            pricesRef.current.push({ time: timestamp, value: newPrice });
            // Keep only last 100 points
            if (pricesRef.current.length > 100) {
              pricesRef.current.shift();
            }

            // Update chart
            if (seriesRef.current) {
              seriesRef.current.setData(pricesRef.current);
            }
          }
        }
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
  }, [liveEngineUrl, asset, disconnectWebSocket]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return undefined;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        attributionLogo: false,
        background: { type: ColorType.Solid, color: isDark ? '#0a0a0a' : '#ffffff' },
        textColor: isDark ? '#d4d4d8' : '#334155',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? '#262626' : '#e2e8f0' },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaOptions = {
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.3)',
      bottomColor: 'rgba(34, 197, 94, 0.0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    };

    // Use fallback pattern for API compatibility (same as LiveChart.jsx)
    const series = typeof chart.addAreaSeries === 'function'
      ? chart.addAreaSeries(areaOptions)
      : chart.addSeries(AreaSeries, areaOptions);

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [isDark]);

  // Connect WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]);

  const statusColor = wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500';
  const priceChangeColor = priceChange >= 0 ? 'text-green-500' : 'text-red-500';
  const PriceIcon = priceChange >= 0 ? TrendingUp : TrendingDown;
  const isMarketClosed = marketStatus === 'closed';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{symbol}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isMarketClosed && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Market Closed
            </span>
          )}
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
        </div>
      </div>

      <div className="mb-3">
        {price !== null ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${price.toFixed(2)}
            </span>
            {priceChange !== 0 && (
              <span className={`flex items-center gap-1 text-sm font-medium ${priceChangeColor}`}>
                <PriceIcon className="h-3 w-3" />
                {Math.abs(priceChange).toFixed(2)}
              </span>
            )}
          </div>
        ) : (
          <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">--</div>
        )}
      </div>

      <div className="h-24">
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
};

const StockCharts = () => {
  const liveEngineUrl = useMemo(() => getLiveEngineUrl(), []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-indigo-500" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Stock Live Charts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time stock prices for simulation trading
            </p>
          </div>
        </div>

        {!liveEngineUrl && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            Live Engine URL is not configured. Please set VITE_LIVE_ENGINE_URL environment variable.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {STOCK_LIST.map((stock) => (
          <StockChart key={stock.symbol} symbol={stock.symbol} name={stock.name} />
        ))}
      </div>
    </div>
  );
};

export default StockCharts;
