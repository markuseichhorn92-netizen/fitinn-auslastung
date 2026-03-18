'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Typical gym crowd patterns per day (relative, 0–100)
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
  const dayName = DAYS[dayIndex];
  const pattern = PATTERNS[dayName];
  const cap = capacity ?? 115;

  const now = new Date();
  const currentHour = now.getHours();
  const isToday = dayIndex === (now.getDay() + 6) % 7; // JS: 0=Sun, we use 0=Mon

  const data = pattern.map((rel, hour) => {
    const isCurrentHour = isToday && hour === currentHour;
    const value = isCurrentHour ? currentCount : Math.round((rel / 100) * cap);
    return {
      hour,
      label: hour % 3 === 0 ? `${hour}` : '',
      value,
      isNow: isCurrentHour,
    };
  });

  const halfCap = Math.round(cap * 0.5);

  const getColor = (value: number, isNow: boolean) => {
    if (isNow) return '#f97316'; // orange = live
    const pct = value / cap;
    if (pct > 0.7) return '#ef4444';
    if (pct > 0.4) return '#f97316';
    return '#6b7280';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = data[label as number];
      return (
        <div className="bg-gray-800 border border-orange-500/30 rounded-lg px-3 py-2 text-sm">
          <p className="text-gray-400">{label}:00 Uhr</p>
          <p className="font-bold text-white">{payload[0].value} Personen</p>
          {d.isNow && <p className="text-orange-400 text-xs">● Live</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 w-full">
      {/* Header */}
      <h2 className="text-2xl font-black text-white tracking-widest text-center mb-6 uppercase">
        Auslastung
      </h2>

      {/* Day Selector */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={onPrev}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white text-lg font-semibold w-32 text-center">{dayName}</span>
        <button
          onClick={onNext}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Labels */}
        <div className="absolute right-0 top-0 flex flex-col gap-1 text-xs text-gray-400 pr-1">
          <span>max. {cap}</span>
          <span className="mt-3">50%</span>
        </div>

        <ResponsiveContainer width="95%" height={200}>
          <BarChart data={data} barSize={8} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis domain={[0, cap]} hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <ReferenceLine y={cap} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.4} />
            <ReferenceLine y={halfCap} stroke="#9ca3af" strokeDasharray="4 2" strokeOpacity={0.4} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={getColor(entry.value, entry.isNow)} fillOpacity={entry.isNow ? 1 : 0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Jetzt live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-500 inline-block" /> Durchschnitt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Sehr voll
        </span>
      </div>
    </div>
  );
}
