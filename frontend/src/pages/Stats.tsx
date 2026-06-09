import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface StatBucket {
  student_count: number;
  room_count: number;
  top_subjects: { code: string; name: string; count: number }[];
  year_distribution: { year: string; count: number }[];
}

interface DashboardResponse {
  options: { id: string; label: string }[];
  stats: Record<string, StatBucket>;
}

export const StatsPage: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string>("global");

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentStats = useMemo(() => {
    if (!data || !data.stats[selectedView]) return null;
    return data.stats[selectedView];
  }, [data, selectedView]);

  const { activeYears, yearColors } = useMemo(() => {
    if (!data) return { activeYears: [], yearColors: {} as Record<string, string> };
    const years = Array.from(
      new Set(
        data.options
          .filter(o => o.id !== 'global')
          .flatMap(o => data.stats[o.id]?.year_distribution.map(y => y.year) || [])
      )
    ).sort().reverse();

    const colorsMap: Record<string, string> = {};
    years.forEach((y, idx) => {
      if (idx < 3) {
        colorsMap[y] = idx === 0 ? 'bg-blue-600 shadow-blue-200 dark:shadow-none' :
                      idx === 1 ? 'bg-sky-500 shadow-sky-200 dark:shadow-none' :
                                  'bg-teal-400 shadow-teal-200 dark:shadow-none';
      } else {
        colorsMap[y] = 'bg-slate-300 dark:bg-slate-700';
      }
    });

    return { activeYears: years, yearColors: colorsMap };
  }, [data]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex flex-col items-center text-blue-600 dark:text-blue-400 font-bold animate-pulse gap-2.5">
          <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm uppercase tracking-wider">กำลังโหลดข้อมูลสถิติ...</span>
        </div>
      </div>
    );
  }

  if (!data || !currentStats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 p-8 rounded-2xl shadow-sm dark:shadow-none text-center max-w-sm w-full">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">เกิดข้อผิดพลาดในการโหลดสถิติ</h3>
          <Link to="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline block mt-4">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  const isGlobal = selectedView === 'global';


  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950/20 font-sans pb-24 overflow-y-auto transition-colors">
      {/* FILTER STICKY TOP ROW */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 z-20 shadow-sm dark:shadow-none px-6 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">แผงควบคุมสถิติ (Statistics Dashboard)</h2>
          </div>

          <div className="relative group">
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors w-64 shadow-sm dark:shadow-none"
            >
              {data.options.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-450">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* 1. GLOBAL VIEW CHARTS */}
        {isGlobal && (
          <>
            {/* Volume Chart Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none p-6 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">ปริมาณผู้สอบจำแนกตามรุ่นปี</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">กราฟเปรียบเทียบนักศึกษาที่มีสิทธิ์สอบในแต่ละรอบ</p>
                </div>

                {/* Custom Legends */}
                <div className="flex gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {activeYears.slice(0, 3).map((year) => (
                    <div key={year} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded ${yearColors[year]}`}></span>
                      รหัส {year}
                    </div>
                  ))}
                  {activeYears.length > 3 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700"></span>
                      รหัสอื่นๆ
                    </div>
                  )}
                </div>
              </div>

              <StackedBarChart
                data={data}
                selectedId={selectedView}
                onSelect={setSelectedView}
                yearColors={yearColors}
              />
            </div>

            {/* Matrix Data Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none overflow-hidden transition-all">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">ตารางสรุปข้อมูลนักศึกษาจำแนกตามชั้นปี</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">รอบสอบ (Round)</th>
                      {activeYears.slice(0, 5).map(year => (
                        <th key={year} className="px-4 py-3.5 font-bold text-center text-slate-700 dark:text-slate-300">ปี {year}</th>
                      ))}
                      <th className="px-6 py-3.5 text-right font-black text-blue-600 dark:text-blue-400">รวมทั้งหมด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.options.filter(o => o.id !== 'global').map((round) => {
                      const stats = data.stats[round.id];
                      return (
                        <tr key={round.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{round.label}</td>
                          {activeYears.slice(0, 5).map(year => {
                            const count = stats.year_distribution.find(y => y.year === year)?.count || 0;
                            return (
                              <td key={year} className="px-4 py-4 text-center">
                                {count > 0 ? (
                                  <span className="text-slate-700 dark:text-slate-300 font-bold font-mono">{count.toLocaleString()}</span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">{stats.student_count.toLocaleString()} คน</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 2. SUB VIEW CARDS */}
        {!isGlobal && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Subjects Volume Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none overflow-hidden h-[500px] flex flex-col transition-all">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">วิชาที่มีการจัดสอบสูงสุด (Top Subjects)</h3>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">จำแนกตามจำนวน</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400 dark:text-slate-400 uppercase bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-50 dark:border-slate-850">
                    <tr>
                      <th className="px-4 py-2.5 text-left">อันดับ</th>
                      <th className="px-4 py-2.5 text-left">วิชา (Subject)</th>
                      <th className="px-4 py-2.5 text-right">จำนวนผู้เข้าสอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {currentStats.top_subjects.map((sub, i) => (
                      <tr key={sub.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                        <td className="px-4 py-4 font-black text-slate-300 dark:text-slate-700 w-10 text-center">{i + 1}</td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{sub.name}</div>
                          <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400 inline-block mt-1">{sub.code}</div>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-blue-600 dark:text-blue-400">{sub.count.toLocaleString()} คน</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Counters & Breakdown Sidebar */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none transition-colors">
                <div className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">จำนวนผู้สอบทั้งหมด (Round Total)</div>
                <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{currentStats.student_count.toLocaleString()} <span className="text-lg font-bold text-slate-400 dark:text-slate-400">คน</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none transition-colors">
                <div className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">ห้องสอบที่ใช้จัดสรร</div>
                <div className="text-4xl font-black text-sky-600 dark:text-sky-400">{currentStats.room_count} <span className="text-lg font-bold text-slate-400 dark:text-slate-400">ห้อง</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 shadow-xl dark:shadow-none p-6 transition-colors">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-xs uppercase tracking-wider border-b dark:border-slate-800 pb-2">สัดส่วนผู้สอบจำแนกรายชั้นปี</h3>
                <div className="space-y-2.5">
                  {currentStats.year_distribution.map((item) => (
                    <div key={item.year} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                      <span className="font-bold text-slate-600 dark:text-slate-400">รหัสชั้นปี {item.year}</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{item.count.toLocaleString()} คน</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// Stacked Bar Chart Component (Tailwind-native canvas layout)
const StackedBarChart = ({ data, selectedId, onSelect, yearColors }: { data: DashboardResponse, selectedId: string, onSelect: (id: string) => void, yearColors: Record<string, string> }) => {

  const rounds = useMemo(() => {
    return data.options.filter(opt => opt.id !== 'global').map(opt => {
      const stats = data.stats[opt.id];
      return {
        id: opt.id,
        label: opt.label,
        total: stats.student_count,
        years: stats.year_distribution
      };
    });
  }, [data]);

  const maxVal = Math.max(...rounds.map(r => r.total), 1);

  const getColor = (year: string) => {
    return yearColors[year] || 'bg-slate-300 dark:bg-slate-700';
  };

  return (
    <div className="w-full h-[240px] flex items-end justify-between gap-4 relative mt-2 px-2">
      {/* Background horizontal guidelines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
        <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-800/60 h-0"></div>
        <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-800/60 h-0"></div>
        <div className="w-full border-t border-slate-200 dark:border-slate-800 h-0"></div>
      </div>

      {rounds.map((round) => {
        const heightPercent = (round.total / maxVal) * 100;

        return (
          <button
            key={round.id}
            onClick={() => onSelect(round.id)}
            className="group relative flex-1 flex flex-col justify-end items-center h-full hover:opacity-100 transition-all outline-none cursor-pointer"
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-950 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-xl">
              {round.total.toLocaleString()} คน
            </div>

            {/* Stacked Pillar block */}
            <div
              className="w-full max-w-[45px] rounded-t-lg flex flex-col-reverse overflow-hidden shadow-inner dark:shadow-none group-hover:shadow-md transition-shadow relative bg-slate-100/30 dark:bg-slate-950/40"
              style={{ height: `${Math.max(heightPercent, 3)}%` }}
            >
              {round.years.map((y) => {
                const segmentHeight = (y.count / round.total) * 100;
                return (
                  <div
                    key={y.year}
                    className={`w-full ${getColor(y.year)} border-b border-white/10 dark:border-slate-900/10 hover:brightness-105 transition-all`}
                    style={{ height: `${segmentHeight}%` }}
                    title={`ปี ${y.year}: ${y.count.toLocaleString()} คน`}
                  ></div>
                );
              })}
            </div>

            {/* Shortened Label */}
            <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider truncate w-full text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {round.label.replace(/Exam|Examination|Round/gi, '').trim()}
            </div>
          </button>
        );
      })}
    </div>
  );
};