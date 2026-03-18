'use client';

import { useState } from 'react';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Typical relative occupancy per hour (0–100), 24 values
const PATTERNS: Record<string, number[]> = {
  Montag:     [2,1,1,1,2,8,22,30,28,18,14,20,26,18,15,20,30,45,50,40,30,20,10,3],
  Dienstag:   [2,1,1,1,2,8,20,28,26,17,13,18,24,17,14,18,28,42,48,38,28,18,9,3],
  Mittwoch:   [2,1,1,1,2,7,18,25,22,15,12,16,22,16,13,16,25,40,46,36,26,16,8,2],
  Donnerstag: [2,1,1,1,2,8,20,28,26,17,13,18,24,17,14,18,28,42,48,38,28,18,9,3],
  Freitag:    [2,1,1,1,2,8,22,30,28,20,16,22,28,20,16,22,32,44,48,36,24,14,6,2],
  Samstag:    [1,1,1,1,1,2,5,18,35,45,48,42,36,30,24,20,16,12,8,5,3,2,1,1],
  Sonntag:    [1,1,1,1,1,2,4,12,25,35,38,34,28,22,18,14,10,8,5,3,2,1,1,1],
};

interface Props {
  currentCount: number;
  capacity: number | null;
  dayIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function UtilizationChart({ currentCount, capacity, dayIndex, onPrev, onNext }: Props) {
  const [tooltip, setTooltip] = useState<{ hour: number; value: number } | null>(null);
  const dayName = DAYS[dayIndex];
  const pattern = PATTERNS[dayName];
  const cap = capacity ?? 115;

  const now = new Date();
  const currentHour = now.getHours();
  const isToday = dayIndex === (now.getDay() + 6) % 7;

  const bars = pattern.map((rel, hour) => {
    const isNow = isToday && hour === currentHour;
    const value = isNow ? currentCount : Math.round((rel / 100) * cap);
    const heightPct = Math.min(100, (value / cap) * 100);
    let color = '#4b5563'; // gray
    if (isNow) color = '#f97316'; // orange live
    else if (heightPct > 70) color = '#ef4444';
    else if (heightPct > 40) color = '#f97316';
    return { hour, value, heightPct, isNow, color };
  });

  const CHART_H = 140;

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 w-full">
      {/* Title */}
      <h2 className="text-xl font-black text-white tracking-widest text-center mb-5 uppercase">
        Auslastung
      </h2>

      {/* Day Selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={onPrev}
          aria-label="Vorheriger Tag"
          className="w-9 h-9 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white font-semibold w-28 text-center">{dayName}</span>
        <button
          onClick={onNext}
          aria-label="Nächster Tag"
          className="w-9 h-9 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        {/* Reference labels */}
        <div className="absolute right-0 top-0 text-right pr-0.5" style={{ height: CHART_H }}>
          <span className="text-gray-500 text-[10px] leading-none block">max.{cap}</span>
          <span className="text-gray-600 text-[10px] leading-none block" style={{ marginTop: CHART_H * 0.5 - 14 }}>50%</span>
        </div>

        <div className="overflow-x-auto pb-1">
          <svg
            viewBox={`0 0 ${24 * 12} ${CHART_H + 20}`}
            className="w-full"
            style={{ minWidth: 280, maxHeight: 180 }}
          >
            {/* 50% line */}
            <line
              x1="0" y1={CHART_H * 0.5}
              x2={24 * 12} y2={CHART_H * 0.5}
              stroke="#4b5563" strokeWidth="0.5" strokeDasharray="3 2"
            />
            {/* 100% line */}
            <line
              x1="0" y1="2"
              x2={24 * 12} y2="2"
              stroke="#6b7280" strokeWidth="0.5" strokeDasharray="3 2"
            />

            {bars.map(({ hour, value, heightPct, isNow, color }) => {
              const barW = 9;
              const gap = 3;
              const x = hour * 12 + gap / 2;
              const barH = Math.max(2, (heightPct / 100) * (CHART_H - 4));
              const y = CHART_H - barH;

              return (
                <g key={hour}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="2"
                    fill={color}
                    fillOpacity={isNow ? 1 : 0.8}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setTooltip({ hour, value })}
                    onMouseLeave={() => setTooltip(null)}
                    onTouchStart={() => setTooltip({ hour, value })}
                  />
                  {/* NOW indicator dot */}
                  {isNow && (
                    <circle cx={x + barW / 2} cy={y - 5} r="3" fill="#f97316" />
                  )}
                  {/* Hour labels every 3h */}
                  {hour % 3 === 0 && (
                    <text
                      x={x + barW / 2}
                      y={CHART_H + 14}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="9"
                    >
                      {hour}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 border border-orange-500/40 rounded-lg px-3 py-1.5 text-sm pointer-events-none z-10">
            <span className="text-gray-400">{tooltip.hour}:00 Uhr — </span>
            <span className="text-white font-bold">{tooltip.value} Pers.</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Jetzt live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-500 inline-block" /> Ø Durchschnitt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Sehr voll
        </span>
      </div>
    </div>
  );
}
