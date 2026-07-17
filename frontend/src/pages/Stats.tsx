// src/pages/Stats.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

// UI Primitives & Icons
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { BarChart3, School, User, ArrowUp, Info, Calendar } from '../components/icons';

interface TimeslotStat {
  time: string;
  count: number;
}

interface RoomStat {
  room: string;
  seat_count: number;
  days_active: number;
  subjects: number;
}

interface DepartmentStat {
  department: string;
  seatings: number;
  subjects: number;
}

interface PeakDayStat {
  date: string;
  count: number;
  students: number;
  rooms: number;
}

interface StatBucket {
  student_count: number;
  room_count: number;
  top_subjects: { code: string; name: string; count: number }[];
  year_distribution: { year: string; count: number }[];
  timeslot_distribution: TimeslotStat[];
  room_utilization: RoomStat[];
  department_breakdown: DepartmentStat[];
  peak_day: PeakDayStat;
  back_to_back_count: number;
  avg_exams_per_student: number;
  total_seatings: number;
}

interface DashboardResponse {
  options: { id: string; label: string }[];
  stats: Record<string, StatBucket>;
}

export const StatsPage: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string>("global");

  // Sort state for the global data table
  const [sortKey, setSortKey] = useState<'label' | 'total'>('label');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentStats = useMemo(() => {
    if (!data || !data.stats[selectedView]) return null;
    return data.stats[selectedView];
  }, [data, selectedView]);

  // Animated counters for the active view
  const activeStudentCount = currentStats?.student_count || 0;
  const activeRoomCount = currentStats?.room_count || 0;
  const activeTotalSeatings = currentStats?.total_seatings || 0;

  const animatedStudentCount = useAnimatedNumber(activeStudentCount);
  const animatedRoomCount = useAnimatedNumber(activeRoomCount);
  const animatedTotalSeatings = useAnimatedNumber(activeTotalSeatings);

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
          idx === 1 ? 'bg-indigo-500 shadow-indigo-200 dark:shadow-none' :
            'bg-cyan-400 shadow-cyan-200 dark:shadow-none';
      } else {
        colorsMap[y] = 'bg-slate-350 dark:bg-slate-700';
      }
    });

    return { activeYears: years, yearColors: colorsMap };
  }, [data]);

  const sortedRounds = useMemo(() => {
    if (!data) return [];
    const list = data.options.filter(o => o.id !== 'global').map(opt => {
      const stats = data.stats[opt.id];
      return {
        id: opt.id,
        label: opt.label,
        total: stats.student_count,
        stats: stats
      };
    });

    const parseRoundID = (id: string) => {
      const parts = id.split('_');
      if (parts.length !== 3) {
        return { year: 0, semester: 0, typeWeight: 0 };
      }
      const year = parseInt(parts[2], 10) || 0;
      const semester = parseInt(parts[1], 10) || 0;
      const typeWeight = parts[0] === 'final' ? 2 : parts[0] === 'mid' ? 1 : 0;
      return { year, semester, typeWeight };
    };

    const compareRounds = (idA: string, idB: string) => {
      const a = parseRoundID(idA);
      const b = parseRoundID(idB);
      if (a.year !== b.year) return a.year - b.year;
      if (a.semester !== b.semester) return a.semester - b.semester;
      if (a.typeWeight !== b.typeWeight) return a.typeWeight - b.typeWeight;
      return idA.localeCompare(idB);
    };

    list.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'label') {
        comparison = compareRounds(a.id, b.id);
      } else {
        comparison = a.total - b.total;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: 'label' | 'total') => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-[#fafbfe]/30 dark:bg-[#050a18]/20 font-sans pb-24 overflow-y-auto">
        {/* Sticky Filter Bar Skeleton */}
        <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/80 sticky top-0 z-20 backdrop-blur-xl px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Skeleton variant="rectangular" width={36} height={36} />
              <div>
                <Skeleton variant="text" width={180} />
                <Skeleton variant="text" width={100} className="mt-1" />
              </div>
            </div>
            <Skeleton variant="rectangular" width={256} height={38} className="w-full sm:w-64" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Hero Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-5 flex items-center gap-4 border border-slate-200/50 dark:border-slate-800/80">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="85%" className="h-6" />
                </div>
              </Card>
            ))}
          </div>

          {/* Highlights Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-4 border border-slate-200/50 dark:border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <Skeleton variant="text" width={20} className="h-6" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Visualization Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4 border border-slate-200/50 dark:border-slate-800/80">
              <div className="space-y-2">
                <Skeleton variant="text" width="40%" className="h-5" />
                <Skeleton variant="text" width="60%" />
              </div>
              <Skeleton variant="rectangular" height={16} />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6 space-y-4 border border-slate-200/50 dark:border-slate-800/80">
              <div className="space-y-2">
                <Skeleton variant="text" width="40%" className="h-5" />
                <Skeleton variant="text" width="60%" />
              </div>
              <Skeleton variant="rectangular" height={16} />
              <div className="flex justify-between">
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="30%" />
              </div>
            </Card>
          </div>

          {/* Bar Chart Skeleton */}
          <Card className="p-6 space-y-4 border border-slate-200/50 dark:border-slate-800/80">
            <Skeleton variant="text" width="30%" className="h-6" />
            <Skeleton variant="rectangular" height={240} />
          </Card>
        </div>
      </div>
    );
  }

  if (!data || !currentStats) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="border border-rose-100 dark:border-rose-950/40 p-8 rounded-2xl text-center max-w-sm w-full">
          <span className="text-4xl mb-3 block select-none">⚠️</span>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1 leading-snug">เกิดข้อผิดพลาดในการโหลดสถิติ</h3>
          <Link to="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline block mt-4 text-xs uppercase tracking-wider">กลับหน้าหลัก</Link>
        </Card>
      </div>
    );
  }

  const isGlobal = selectedView === 'global';

  return (
    <div className="h-full w-full bg-[#FAFBFE] dark:bg-[#0A0F24] font-sans pb-24 overflow-y-auto transition-colors relative">

      {/* 2. FILTER STICKY TOP ROW (Glassmorphic) */}
      <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 z-20 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-4 transition-all duration-300 select-none">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/10 shrink-0 hidden sm:flex">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate">
                แผงควบคุมสถิติ <span className="hidden md:inline">(Statistics Dashboard)</span>
              </h1>
              <p className="text-xxs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                Overview & System Analytics
              </p>
            </div>
          </div>

          <div className="w-36 sm:w-64 shrink-0">
            <Select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              options={data.options.map(opt => ({ value: opt.id, label: opt.label }))}
            />
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 relative z-10 staggered-entrance">

        {/* HERO COUNTER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* Card 1: Students */}
          <Card glass hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/10 dark:shadow-none">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1.5">ผู้สอบทั้งหมด (Students)</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none block">
                {animatedStudentCount.toLocaleString()} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">คน</span>
              </span>
            </div>
          </Card>

          {/* Card 2: Rooms */}
          <Card glass hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10 dark:shadow-none">
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1.5">ห้องสอบที่ใช้ (Rooms)</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none block">
                {animatedRoomCount.toLocaleString()} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ห้อง</span>
              </span>
            </div>
          </Card>

          {/* Card 3: Subjects */}
          <Card glass hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/10 dark:shadow-none">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1.5">วิชาที่สอบ (Subjects)</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none block">
                {currentStats.top_subjects.length} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">วิชา</span>
              </span>
            </div>
          </Card>

          {/* Card 4: Total Seatings */}
          <Card glass hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10 dark:shadow-none">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xxs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1.5">ที่นั่งสอบทั้งหมด (Volume)</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none block">
                {animatedTotalSeatings.toLocaleString()} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ที่นั่ง</span>
              </span>
            </div>
          </Card>
        </div>

        {/* FUN STATS HIGHLIGHT STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Peak Day */}
          {currentStats.peak_day && currentStats.peak_day.date && (
            <Card borderVariant="sky" glass hover className="p-4">
              <div className="flex items-start gap-2.5">
                <div className="text-lg mt-0.5 select-none">🔥</div>
                <div>
                  <span className="text-xxs font-black text-slate-550 dark:text-slate-400 uppercase block tracking-wider mb-0.5">
                    วันสอบหนาแน่นที่สุด (Peak Day)
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                    {new Date(currentStats.peak_day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="text-nano font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                    {currentStats.peak_day.count.toLocaleString()} ที่นั่ง • {currentStats.peak_day.rooms} ห้อง
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Back-to-Back Workload */}
          <Card borderVariant="rose" glass hover className="p-4">
            <div className="flex items-start gap-2.5">
              <div className="text-lg mt-0.5 select-none">⚡</div>
              <div>
                <span className="text-xxs font-black text-slate-550 dark:text-slate-400 uppercase block tracking-wider mb-0.5">
                  สอบ 2 คาบในวันเดียวกัน
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  {currentStats.back_to_back_count.toLocaleString()} คน
                </span>
                <span className="text-nano font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                  ภาระสอบหนาแน่นในหนึ่งวัน
                </span>
              </div>
            </div>
          </Card>

          {/* Room MVP Champion */}
          {currentStats.room_utilization && currentStats.room_utilization.length > 0 && (
            <Card borderVariant="amber" glass hover className="p-4">
              <div className="flex items-start gap-2.5">
                <div className="text-lg mt-0.5 select-none">🏆</div>
                <div>
                  <span className="text-xxs font-black text-slate-555 dark:text-slate-400 uppercase block tracking-wider mb-0.5">
                    ห้องสอบยอดนิยม (MVP Room)
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    {currentStats.room_utilization[0].room}
                  </span>
                  <span className="text-nano font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                    จัด {currentStats.room_utilization[0].seat_count.toLocaleString()} ที่นั่ง • {currentStats.room_utilization[0].days_active} วัน
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Average Load Factor */}
          <Card borderVariant="sky" glass hover className="p-4">
            <div className="flex items-start gap-2.5">
              <div className="text-lg mt-0.5 select-none">📊</div>
              <div>
                <span className="text-xxs font-black text-slate-555 dark:text-slate-400 uppercase block tracking-wider mb-0.5">
                  เฉลี่ยวิชาสอบต่อคน (Avg Load)
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  {currentStats.avg_exams_per_student.toFixed(1)} วิชา / คน
                </span>
                <span className="text-nano font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                  จากยอดที่นั่งจัดสอบสะสม
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ADVANCED DATA VISUALIZATIONS SECTION */}
        {currentStats.department_breakdown && currentStats.department_breakdown.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Department Breakdown Bar */}
            <Card glass className="p-6">
              <div className="mb-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">สัดส่วนตามกลุ่มสาขาวิชา (Department Breakdown)</h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">จำแนกตามรหัสวิชาขึ้นต้น (CP / SC / LI / อื่นๆ)</p>
              </div>

              <div className="space-y-4">
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  {currentStats.department_breakdown.map((dept, idx) => {
                    const percent = (dept.seatings / (currentStats.total_seatings || 1)) * 100;
                    const bgClass = idx === 0 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
                      idx === 1 ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' :
                        idx === 2 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-slate-400';
                    return (
                      <div
                        key={dept.department}
                        className={`h-full ${bgClass} transition-all duration-500 hover:brightness-110`}
                        style={{ width: `${percent}%` }}
                        title={`${dept.department}: ${dept.seatings.toLocaleString()} ที่นั่ง (${percent.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentStats.department_breakdown.map((dept, idx) => {
                    const percent = (dept.seatings / (currentStats.total_seatings || 1)) * 100;
                    const dotClass = idx === 0 ? 'bg-indigo-500' :
                      idx === 1 ? 'bg-cyan-500' :
                        idx === 2 ? 'bg-emerald-500' : 'bg-slate-400';
                    return (
                      <div key={dept.department} className="p-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/40">
                        <div className="flex items-center gap-1.5 mb-1 text-xs font-black text-slate-655 dark:text-slate-350 truncate">
                          <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0`} />
                          <span className="truncate" title={dept.department}>{dept.department}</span>
                        </div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 block font-mono">
                          {percent.toFixed(1)}%
                        </span>
                        <span className="text-xxs font-semibold text-slate-400 dark:text-slate-500 block leading-tight">
                          {dept.seatings.toLocaleString()} ที่นั่ง
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Time Slot Ratio Balance */}
            <Card glass className="p-6">
              <div className="mb-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">สัดส่วนช่วงเวลาจัดสอบ (Time Slot Balance)</h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">เปรียบเทียบความหนาแน่นระหว่างคาบเช้า และคาบบ่าย</p>
              </div>

              <div className="space-y-4">
                {(() => {
                  const amStat = currentStats.timeslot_distribution.find(t => t.time.includes("08.30"));
                  const pmStat = currentStats.timeslot_distribution.find(t => t.time.includes("13.00"));
                  const amCount = amStat ? amStat.count : 0;
                  const pmCount = pmStat ? pmStat.count : 0;
                  const total = (amCount + pmCount) || 1;
                  const amPercent = (amCount / total) * 100;
                  const pmPercent = (pmCount / total) * 100;

                  return (
                    <>
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${amPercent}%` }}
                          title={`เช้า: ${amCount.toLocaleString()} ที่นั่ง (${amPercent.toFixed(1)}%)`}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${pmPercent}%` }}
                          title={`บ่าย: ${pmCount.toLocaleString()} ที่นั่ง (${pmPercent.toFixed(1)}%)`}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 font-bold">🌅</div>
                          <div>
                            <span className="text-xxs font-black text-slate-400 dark:text-slate-500 block leading-none mb-0.5">ช่วงเช้า (08.30)</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                              {amPercent.toFixed(1)}% <span className="text-xs font-bold text-slate-400">({amCount.toLocaleString()} คน)</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <span className="text-xxs font-black text-slate-400 dark:text-slate-500 block leading-none mb-0.5">ช่วงบ่าย (13.00)</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                              {pmPercent.toFixed(1)}% <span className="text-xs font-bold text-slate-400">({pmCount.toLocaleString()} คน)</span>
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 font-bold">🌇</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>
        )}

        {/* ROOM UTILIZATION LISTING */}
        {currentStats.room_utilization && currentStats.room_utilization.length > 0 && (
          <Card glass className="p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                การใช้งานห้องสอบ (Room Utilization)
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                จัดอันดับการเปิดใช้งานห้องสอบตามจำนวนนักศึกษาที่นั่งสอบสะสม
              </p>
            </div>

            <div className="space-y-4">
              {currentStats.room_utilization.slice(0, 6).map((room) => {
                const maxSeats = currentStats.room_utilization[0]?.seat_count || 1;
                const percent = (room.seat_count / maxSeats) * 100;
                return (
                  <div key={room.room} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="w-20 font-black text-xs text-slate-700 dark:text-slate-350 shrink-0">
                      {room.room}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 rounded-full transition-all duration-500 hover:brightness-105"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="w-24 text-right shrink-0">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                          {room.seat_count.toLocaleString()}
                        </span>
                        <span className="text-nano font-bold text-slate-400 dark:text-slate-500 ml-1">
                          ที่นั่ง
                        </span>
                      </div>
                    </div>
                    <div className="text-xxs font-semibold text-slate-455 dark:text-slate-500 sm:w-32 sm:text-right shrink-0">
                      เปิดจัดสอบ {room.days_active} วัน • คุมสอบ {room.subjects} วิชา
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 1. GLOBAL VIEW CHARTS */}
        {isGlobal && (
          <>
            {/* Volume Chart Card */}
            <Card glass className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">ปริมาณผู้สอบจำแนกตามรุ่นปี</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 leading-none">กราฟเปรียบเทียบสิทธิสอบและยอดการคุมห้องสอบในแต่ละปีการศึกษา</p>
                </div>

                {/* Custom Legends */}
                <div className="flex flex-wrap gap-4 text-xs font-black text-slate-455 dark:text-slate-400 leading-none">
                  {activeYears.slice(0, 3).map((year) => (
                    <div key={year} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded ${yearColors[year]}`} />
                      รหัส {year}
                    </div>
                  ))}
                  {activeYears.length > 3 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-350 dark:bg-slate-700" />
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
            </Card>

            {/* Matrix Data Table Card */}
            <Card glass className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 flex justify-between items-center">
                <h3 className="font-black text-slate-455 dark:text-slate-400 text-xs uppercase tracking-wider leading-none">ตารางสรุปข้อมูลนักศึกษาจำแนกตามชั้นปี</h3>
                <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">คลิกหัวตารางเพื่อจัดเรียง</span>
              </div>
              <div className="relative">
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-455 dark:text-slate-500 uppercase bg-slate-50/40 dark:bg-slate-950/40 border-b border-slate-200/40 dark:border-slate-850 select-none">
                      <tr>
                        <th
                          className="px-6 py-3.5 font-black cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors"
                          onClick={() => handleSort('label')}
                        >
                          รอบสอบ (Round) {sortKey === 'label' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                        {activeYears.slice(0, 5).map(year => (
                          <th key={year} className="px-4 py-3.5 font-black text-center">ปี {year}</th>
                        ))}
                        <th
                          className="px-6 py-3.5 text-right font-black cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors text-blue-600 dark:text-blue-400"
                          onClick={() => handleSort('total')}
                        >
                          รวมทั้งหมด {sortKey === 'total' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30 dark:divide-slate-850 font-semibold">
                      {sortedRounds.map((round) => {
                        const stats = round.stats;
                        return (
                          <tr key={round.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                            <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-200">{round.label}</td>
                            {activeYears.slice(0, 5).map(year => {
                              const count = stats.year_distribution.find(y => y.year === year)?.count || 0;
                              return (
                                <td key={year} className="px-4 py-4 text-center">
                                  {count > 0 ? (
                                    <span className="text-slate-700 dark:text-slate-350 font-bold font-mono">{count.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-800 font-mono">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400 font-mono">{round.total.toLocaleString()} คน</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Scroll Indicator Gradient Overlay */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent opacity-100 sm:hidden" />
              </div>
            </Card>
          </>
        )}

        {/* 2. SUB VIEW CARDS */}
        {!isGlobal && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Subjects Volume Card with mini progress bars */}
            <Card glass className="lg:col-span-2 h-[500px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
                <h3 className="font-black text-slate-455 dark:text-slate-400 text-xs uppercase tracking-wider leading-none">วิชาที่มีการจัดสอบสูงสุด (Top Subjects)</h3>
                <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">จำแนกตามจำนวน</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                <table className="w-full text-sm border-collapse">
                  <thead className="text-xs text-slate-455 dark:text-slate-500 uppercase bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-850 select-none">
                    <tr>
                      <th className="px-4 py-2.5 text-center w-14 font-black font-sans">อันดับ</th>
                      <th className="px-4 py-2.5 text-left font-black font-sans">วิชา (Subject)</th>
                      <th className="px-4 py-2.5 text-right font-black font-sans">จำนวนผู้เข้าสอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-850/60 font-semibold">
                    {currentStats.top_subjects.map((sub, i) => {
                      const maxSubCount = currentStats.top_subjects[0]?.count || 1;
                      const barWidth = (sub.count / maxSubCount) * 100;
                      return (
                        <tr key={sub.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                          <td className="px-4 py-4 font-black text-slate-350 dark:text-slate-700 w-14 text-center">{i + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{sub.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 inline-block leading-none">{sub.code}</span>
                              <div className="h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden w-24">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${barWidth}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-black text-blue-600 dark:text-blue-400 font-mono">{sub.count.toLocaleString()} คน</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Summary Counters & Breakdown Sidebar with colored bars */}
            <div className="space-y-4">
              <Card glass className="p-6">
                <h3 className="font-black text-slate-455 dark:text-slate-400 text-xs uppercase tracking-wider mb-4 border-b border-slate-200/40 dark:border-slate-850 pb-2 leading-none">
                  สัดส่วนผู้สอบจำแนกรายชั้นปี
                </h3>
                <div className="space-y-3">
                  {currentStats.year_distribution.map((item) => {
                    const maxYearCount = Math.max(...currentStats.year_distribution.map(y => y.count), 1);
                    const barWidth = (item.count / maxYearCount) * 100;
                    const barColor = yearColors[item.year] || 'bg-slate-350 dark:bg-slate-700';

                    return (
                      <div key={item.year} className="flex flex-col gap-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/60 rounded-2xl">
                        <div className="flex justify-between items-center text-xs font-bold leading-none">
                          <span className="text-slate-500 dark:text-slate-400">รหัสชั้นปี {item.year}</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 font-mono">{item.count.toLocaleString()} คน</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// Stacked Bar Chart Component (Tailwind-native canvas layout with spring scaling)
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
    return yearColors[year] || 'bg-slate-350 dark:bg-slate-700';
  };

  return (
    <div className="w-full h-[240px] flex items-end justify-between gap-4 relative mt-2 px-2">
      {/* Background horizontal guidelines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
        <div className="w-full border-t border-dashed border-slate-200/40 dark:border-slate-800/40 h-0" />
        <div className="w-full border-t border-dashed border-slate-200/40 dark:border-slate-800/40 h-0" />
        <div className="w-full border-t border-dashed border-slate-200/80 dark:border-slate-800 h-0" />
      </div>

      {rounds.map((round) => {
        const heightPercent = (round.total / maxVal) * 100;

        return (
          <button
            key={round.id}
            onClick={() => onSelect(round.id)}
            className="group relative flex-1 flex flex-col justify-end items-center h-full hover:opacity-100 transition-all outline-none cursor-pointer select-none"
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800 dark:bg-slate-950 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-xl">
              {round.total.toLocaleString()} คน
            </div>

            {/* Stacked Pillar block (with entrance spring animation) */}
            <div
              className="w-full max-w-[35px] sm:max-w-[45px] rounded-t-lg flex flex-col-reverse overflow-hidden shadow-inner dark:shadow-none group-hover:shadow-md transition-shadow relative bg-slate-100/30 dark:bg-slate-950/40 animate-grow-up origin-bottom"
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
                  />
                );
              })}
            </div>

            {/* Shortened Label */}
            <div className="mt-3.5 text-nano text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider truncate w-full text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-none">
              {round.label.replace(/Exam|Examination|Round/gi, '').trim()}
            </div>
          </button>
        );
      })}
    </div>
  );
};