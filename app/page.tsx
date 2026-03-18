'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const UtilizationChart = dynamic(() => import('@/components/UtilizationChart'), { ssr: false });

interface UtilData {
  count: number;
  capacity: number | null;
  timestamp: string;
}

function getStatusInfo(count: number, capacity: number | null) {
  const cap = capacity ?? 115;
  const pct = count / cap;
  if (pct < 0.25) return { label: 'Wenig los', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', dot: 'bg-green-400' };
  if (pct < 0.5)  return { label: 'Gut besucht', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', dot: 'bg-orange-400' };
  if (pct < 0.75) return { label: 'Voll', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', dot: 'bg-red-400' };
  return { label: 'Sehr voll', color: 'text-red-500', bg: 'bg-red-600/20 border-red-600/30', dot: 'bg-red-500' };
}

export default function Home() {
  const [data, setData] = useState<UtilData | null>(null);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dayIndex, setDayIndex] = useState(() => {
    const d = new Date().getDay();
    return (d + 6) % 7; // 0=Mon, 6=Sun
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/utilization', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setError(false);
      const now = new Date();
      setLastUpdate(`${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 90_000); // every 90s
    return () => clearInterval(interval);
  }, [fetchData]);

  const status = data ? getStatusInfo(data.count, data.capacity) : null;
  const cap = data?.capacity ?? 115;

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-black text-white tracking-wider text-lg">FIT-INN TRIER</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 gap-6 max-w-2xl mx-auto w-full">

        {/* Live Count Card */}
        {error ? (
          <div className="w-full bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-center">
            <p className="text-red-400">⚠️ Verbindung zu Magicline unterbrochen</p>
          </div>
        ) : data ? (
          <div className={`w-full border rounded-2xl p-6 text-center ${status?.bg}`}>
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Aktuell im Studio</p>
            <div className="flex items-end justify-center gap-3 mb-3">
              <span className="text-7xl font-black text-white tabular-nums">{data.count}</span>
              <span className="text-2xl text-gray-500 mb-3 font-light">/ {cap}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, (data.count / cap) * 100)}%`,
                  background: 'linear-gradient(90deg, #f97316, #ef4444)',
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status?.dot} animate-pulse`} />
              <span className={`font-semibold text-lg ${status?.color}`}>{status?.label}</span>
            </div>

            <p className="text-gray-600 text-xs mt-3">Zuletzt aktualisiert: {lastUpdate}</p>
          </div>
        ) : (
          <div className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Chart */}
        <UtilizationChart
          currentCount={data?.count ?? 0}
          capacity={data?.capacity ?? null}
          dayIndex={dayIndex}
          onPrev={() => setDayIndex(d => (d + 6) % 7)}
          onNext={() => setDayIndex(d => (d + 1) % 7)}
        />

        {/* Refresh Button */}
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-400 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Jetzt aktualisieren
        </button>
      </div>

      <footer className="text-center text-gray-700 text-xs py-4 border-t border-gray-800">
        FIT-INN Trier • Laurentius-Zeller-Str. 13 • Echtzeit via Magicline
      </footer>
    </main>
  );
}
