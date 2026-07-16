// src/pages/RoomExplorer.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeatMap } from '../components/room/SeatMap';
import type { ExamResult, RoomConfigMap } from '../types';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { SEAT_PALETTE } from '../lib/constants';

// UI Primitives & Icons
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Search,
  Clock,
  School,
  User,
  MapPin,
  Info,
  AlertTriangle,
  ChevronDown,
  Trash2,
  ExternalLink,
  ChevronRight
} from '../components/icons';

interface RoundOption {
  id: string;
  label: string;
}

export const RoomExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [optRounds, setOptRounds] = useState<RoundOption[]>([]);
  const [optDates, setOptDates] = useState<string[]>([]);
  const [optTimes, setOptTimes] = useState<string[]>([]);
  const [optRooms, setOptRooms] = useState<string[]>([]);

  const [round, setRound] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [room, setRoom] = useState<string>("");

  const [scheduleData, setScheduleData] = useState<ExamResult[]>([]);
  const [configs, setConfigs] = useState<RoomConfigMap>({});
  const [selectedSeat, setSelectedSeat] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExamResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [fromSearchResult, setFromSearchResult] = useState(false);

  // Highlight and responsive drawer states
  const [highlightedSubject, setHighlightedSubject] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Close search popup on outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Initial configuration fetch
  const hasRun = useRef<boolean>(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    fetch('/api/room')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch rooms");
        return res.json();
      })
      .then(setConfigs)
      .catch(console.error);

    fetch('/api/rounds')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch rounds");
        return res.json();
      })
      .then((data: RoundOption[]) => {
        const validRounds = Array.isArray(data) ? data : [];
        setOptRounds(validRounds);
        if (validRounds.length > 0) {
          const urlRound = searchParams.get('round');
          const isValidRound = validRounds.some(r => r.id === urlRound);
          if (urlRound && isValidRound) {
            setRound(urlRound);
          } else {
            setRound(validRounds[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  // 2. Round -> Dates Cascade
  useEffect(() => {
    if (!round) { setOptDates([]); return; }
    if (fromSearchResult) return;

    fetch(`/api/options?type=dates&round=${encodeURIComponent(round)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch dates");
        return res.json();
      })
      .then(data => {
        const validDates = Array.isArray(data) ? data : [];
        setOptDates(validDates);
        const urlDate = searchParams.get('date');
        if (urlDate && validDates.includes(urlDate)) {
          setDate(urlDate);
        } else if (validDates.length > 0) {
          setDate(validDates[0]);
        } else {
          setDate("");
        }
      })
      .catch(() => {
        setOptDates([]);
        setDate("");
      });
  }, [round]);

  // 3. Date -> Times Cascade
  useEffect(() => {
    if (!round || !date) { setOptTimes([]); return; }
    if (fromSearchResult) return;

    fetch(`/api/options?type=times&round=${round}&date=${encodeURIComponent(date)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch times");
        return res.json();
      })
      .then(data => {
        const validTimes = Array.isArray(data) ? data : [];
        setOptTimes(validTimes);
        const urlTime = searchParams.get('time');
        if (urlTime && validTimes.includes(urlTime)) {
          setTime(urlTime);
        } else if (validTimes.length > 0) {
          setTime(validTimes[0]);
        } else {
          setTime("");
        }
      })
      .catch(() => {
        setOptTimes([]);
        setTime("");
      });
  }, [date, round]);

  // 4. Time -> Rooms Cascade
  useEffect(() => {
    if (!round || !date || !time) { setOptRooms([]); return; }
    if (fromSearchResult) return;

    fetch(`/api/options?type=rooms&round=${round}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch rooms");
        return res.json();
      })
      .then(data => {
        const validRooms = Array.isArray(data) ? data : [];
        setOptRooms(validRooms);
        const urlRoom = searchParams.get('room');
        if (urlRoom && validRooms.includes(urlRoom)) {
          setRoom(urlRoom);
        } else if (validRooms.length > 0) {
          setRoom(validRooms[0]);
        } else {
          setRoom("");
        }
      })
      .catch(() => {
        setOptRooms([]);
        setRoom("");
      });
  }, [time, date, round]);

  // 5. Query roster results
  useEffect(() => {
    if (!round || !room || !date || !time) {
      setScheduleData([]);
      return;
    }

    setLoading(true);
    setFromSearchResult(false);

    const params = new URLSearchParams({ round, room, date, time });
    fetch(`/api/explore?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch explore data");
        return res.json();
      })
      .then((data: ExamResult[]) => {
        const validData = Array.isArray(data) ? data : [];
        setScheduleData(validData);

        const urlSeat = searchParams.get('seat');
        const isUrlSync =
          searchParams.get('round') === round &&
          searchParams.get('date') === date &&
          searchParams.get('time') === time &&
          searchParams.get('room') === room;

        if (urlSeat && isUrlSync && validData.length > 0) {
          const found = validData.find(s => s.seat === urlSeat);
          if (found) setSelectedSeat(found);
        }
      })
      .catch(() => setScheduleData([]))
      .finally(() => {
        setLoading(false);
        setIsReady(true);
      });
  }, [round, room, date, time]);

  // 6. Sync parameters to URL path
  useEffect(() => {
    if (!isReady) return;

    const params: Record<string, string> = {};
    if (round) params.round = round;
    if (date) params.date = date;
    if (time) params.time = time;
    if (room) params.room = room;
    if (selectedSeat?.seat) params.seat = selectedSeat.seat;

    setSearchParams(params, { replace: true });
  }, [round, date, time, room, selectedSeat, setSearchParams, isReady]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setSelectedSeat(null);
    setHighlightedSubject(undefined);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !round) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowResults(true);

    try {
      const res = await fetch(`/api/exam?id=${encodeURIComponent(searchQuery)}&round=${encodeURIComponent(round)}`);
      if (res.status === 404) {
        setSearchResults([]);
        return;
      }
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data || []);
    } catch (e) {
      console.error("Search failed", e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (exam: ExamResult) => {
    if (exam.room === "จัดสอบนอกตาราง") return;
    setFromSearchResult(true);

    setRound(round);
    setDate(exam.date);
    setTime(exam.time);
    setRoom(exam.room);
    setSelectedSeat(exam);
    setShowResults(false);
    setSearchQuery("");
    setHighlightedSubject(undefined);

    setSearchParams({
      round: round || "",
      date: exam.date,
      time: exam.time,
      room: exam.room,
      seat: exam.seat,
    }, { replace: true });
  };

  const currentConfig = useMemo(() => {
    if (!room || !configs) return null;
    if (configs[room]) return configs[room];
    for (const pattern of Object.keys(configs)) {
      try {
        if (new RegExp(pattern, 'i').test(room)) return configs[pattern];
      } catch { }
    }
    return null;
  }, [room, configs]);

  const totalSeatsCount = useMemo(() => {
    if (!currentConfig) return 0;
    let count = 0;
    currentConfig.layout.forEach((block) => {
      if (block.type !== 'column') return;
      block.items.forEach((item) => {
        if (item.type !== 'seats') return;
        if (item.manual) {
          count += item.manual.length;
        } else if (item.count) {
          count += item.count;
        }
      });
    });
    return count;
  }, [currentConfig]);

  const occupiedSeats = useMemo(() => {
    const map: Record<string, ExamResult> = {};
    scheduleData.forEach((item) => { map[item.seat] = item; });
    return map;
  }, [scheduleData]);

  const validSeatIds = useMemo(() => {
    const set = new Set<string>();
    if (!currentConfig) return set;

    const globalCounters: Record<string, number> = {};
    currentConfig.layout.forEach((block) => {
      if (block.type !== 'column') return;
      block.items.forEach((item) => {
        if (item.type !== 'seats') return;
        if (item.manual) {
          item.manual.forEach((num) => {
            set.add(`${item.char}${num}`);
          });
        } else {
          const start = item.start ?? (globalCounters[item.char] || 1);
          const count = item.count || 0;
          const step = item.step ?? (item.inverse ? -1 : 1);
          let current = start;
          for (let i = 0; i < count; i++) {
            set.add(`${item.char}${current}`);
            current += step;
          }
          globalCounters[item.char] = current;
        }
      });
    });
    return set;
  }, [currentConfig]);

  const orphanedSeats = useMemo(() => {
    if (!currentConfig || scheduleData.length === 0) return [];
    return scheduleData.filter((student) => !validSeatIds.has(student.seat));
  }, [scheduleData, validSeatIds, currentConfig]);

  const subjectMap = useMemo(() => {
    const map: Record<string, { color: typeof SEAT_PALETTE[0], name: string }> = {};
    const entries = Object.values(occupiedSeats);
    const uniqueSubjects = Array.from(new Set(entries.map(d => d.subject))).sort();

    uniqueSubjects.forEach((subj, index) => {
      const representative = entries.find(e => e.subject === subj);
      const name = representative?.subject_name || "";
      map[subj] = {
        color: SEAT_PALETTE[index % SEAT_PALETTE.length],
        name: name
      };
    });
    return map;
  }, [occupiedSeats]);

  const currentRoundLabel = useMemo(() => {
    return optRounds.find(r => r.id === round)?.label || round;
  }, [optRounds, round]);

  const getSubjectName = (exam: ExamResult) => exam.subject_name || exam.subject;
  const occupiedCount = scheduleData.length;

  // Occupancy Ring details
  const pct = totalSeatsCount > 0 ? Math.round((occupiedCount / totalSeatsCount) * 100) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  // Animated counters
  const animatedPct = useAnimatedNumber(pct);
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 text-sm overflow-hidden select-none transition-colors">

      {/* TOP DASHBOARD NAVIGATION BAR (Glassmorphic & Compact on Mobile) */}
      <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 z-20 backdrop-blur-xl px-4 sm:px-6 pt-2.5 sm:pt-4 pb-1 sm:pb-2 xl:pb-4 transition-all duration-300 select-none shrink-0">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">

          {/* Title Block */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/10 shrink-0 hidden sm:flex">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2 truncate">
                สำรวจห้องสอบ
                {room && (
                  <Badge variant="blue" size="sm" className="font-extrabold font-mono">
                    {room}
                  </Badge>
                )}
              </h1>
              <p className="text-xxs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
              </p>
            </div>
          </div>

          {/* Filters Toolbar Row */}
          <div className={`flex-1 flex flex-wrap items-center gap-3 w-full justify-start xl:justify-end transition-all duration-300 ${isFiltersOpen ? 'opacity-100 max-h-[500px] visible' : 'opacity-0 max-h-0 overflow-hidden invisible xl:flex xl:opacity-100 xl:max-h-none xl:visible'
            }`}>
            {/* Round select */}
            <div className="w-full sm:w-44">
              <Select
                value={round}
                onChange={e => handleFilterChange(setRound, e.target.value)}
                className="w-full select-xs"
              >
                {optRounds.length === 0 && <option>Loading...</option>}
                {optRounds.map(r => <option key={r.id} value={r.id}>{r.label.replace('Exam ', '')}</option>)}
              </Select>
            </div>

            {/* Date and Time selectors group */}
            <div className="w-full flex gap-3 sm:w-auto">
              {/* Date select */}
              <div className="flex-1 sm:w-36 sm:flex-none">
                <Select
                  value={date}
                  onChange={e => handleFilterChange(setDate, e.target.value)}
                  disabled={optDates.length === 0}
                >
                  {optDates.length === 0 && <option value="">Select Date</option>}
                  {optDates.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>

              {/* Time select */}
              <div className="flex-1 sm:w-32 sm:flex-none">
                <Select
                  value={time}
                  onChange={e => handleFilterChange(setTime, e.target.value)}
                  disabled={optTimes.length === 0}
                >
                  {optTimes.length > 0 ? optTimes.map(t => <option key={t} value={t}>{t}</option>) : <option>--:--</option>}
                </Select>
              </div>
            </div>

            {/* Room select */}
            <div className="w-full sm:w-32">
              <Select
                value={room}
                onChange={e => handleFilterChange(setRoom, e.target.value)}
                disabled={optRooms.length === 0}
              >
                {optRooms.length > 0 ? optRooms.map(r => <option key={r} value={r}>{r}</option>) : <option>None</option>}
              </Select>
            </div>

            {/* Divider */}
            <span className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></span>

            {/* Autocomplete Search input */}
            <div className="relative w-full sm:w-56" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative group">
                <Input
                  type="text"
                  placeholder="ค้นหารหัส นศ. ในห้องสอบนี้"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={!round}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="py-2.5 text-xs font-mono"
                />

                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setShowResults(false); }}
                      className="p-1 rounded-full text-slate-400 hover:bg-slate-200/50 hover:text-slate-655 transition-colors cursor-pointer animate-in fade-in"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </form>

              {/* Search Dropdown popup */}
              {showResults && (
                <Card className="absolute top-full mt-2 right-0 left-0 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isSearching ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 leading-none">กำลังค้นหา...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-[260px] overflow-y-auto">
                      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 text-xxs font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest leading-none">
                        พบผลการค้นหา {searchResults.length} รายการ
                      </div>
                      {searchResults.map((res, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/40 cursor-pointer group transition-colors last:border-0"
                          onClick={() => selectSearchResult(res)}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">{getSubjectName(res)}</span>
                            <Badge variant="slate" size="sm" className="font-extrabold font-mono shrink-0">
                              {res.room}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-none">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span>{res.date}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <span>{res.time}</span>
                            </div>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-1.5 rounded">
                              ที่นั่ง {res.seat}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
                      <span className="text-2xl select-none">🔍</span>
                      <span className="text-xs font-bold text-slate-500">ไม่พบข้อมูลที่นั่ง</span>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Pull-Down / Collapse Handle Bar */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="xl:hidden w-full flex items-center justify-center py-1 mt-2 border-t border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-950/30 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-all duration-200 cursor-pointer outline-none"
          aria-label={isFiltersOpen ? "Collapse filters" : "Expand filters"}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      {/* MAP CANVAS & SIDEBARS */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile Sidebar Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar Panel (Redesigned: Analytics and legend list only) */}
        <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] md:max-w-none md:static md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/80 flex flex-col shrink-0 z-40 md:z-10 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 md:bg-transparent shrink-0">
            <h2 className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center gap-1.5 leading-none">
              <School className="w-4 h-4 text-blue-600" />
              อัตราการใช้ห้องสอบ
            </h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Room Occupancy Analytics (Circular SVG Widget) */}
            {currentConfig && room ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/20 dark:border-slate-800/80 rounded-2xl p-4">
                  {/* SVG Circular Progress */}
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                        strokeWidth="5"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="stroke-blue-600 fill-none transition-all duration-700 ease-out"
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{animatedPct}%</span>
                      <span className="text-nano uppercase font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 leading-none">เต็ม</span>
                    </div>
                  </div>

                  {/* Summary counts */}
                  <div className="flex-1 space-y-1.5 text-xs min-w-0 font-sans leading-none">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                      <span>ความจุ:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-250 font-mono">{totalSeatsCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                      <span>ใช้งาน:</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{occupiedCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 mt-1">
                      <span>ว่าง:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{totalSeatsCount - occupiedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-3 text-slate-400 text-xxs italic bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
                ยังไม่ได้เลือกห้องสอบ
              </div>
            )}

            {/* Orphaned/Missing Seats Warning Alert Widget */}
            {orphanedSeats.length > 0 && (
              <div className="space-y-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-900/40 rounded-2xl p-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-400 font-black text-xxs uppercase tracking-wide leading-none">
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                  <span>ที่นั่งไม่มีในผัง ({orphanedSeats.length})</span>
                </div>
                <p className="text-xxs text-rose-700 dark:text-rose-455 leading-normal font-semibold font-sans">
                  พบข้อมูลที่นั่งในตารางสอบ แต่มองไม่เห็นในผังห้องสอบปัจจุบัน:
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {orphanedSeats.map((student) => (
                    <button
                      key={student.student_id}
                      onClick={() => setSelectedSeat(student)}
                      className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-rose-100/50 dark:border-rose-900/30 hover:border-rose-350 dark:hover:border-rose-800 hover:shadow-sm rounded-xl text-left transition-all text-xxs cursor-pointer outline-none active:scale-[0.98]"
                    >
                      <div className="flex flex-col leading-tight min-w-0 pr-2">
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono text-xxs">{student.student_id}</span>
                        <span className="text-xxs text-slate-400 dark:text-slate-500 truncate max-w-[110px] font-semibold mt-0.5">{getSubjectName(student)}</span>
                      </div>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 px-1.5 py-0.5 rounded-lg shrink-0 text-xxs">
                        ที่นั่ง {student.seat}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Subject Color Legend */}
            {Object.keys(subjectMap).length !== 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-1.5 shrink-0">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                    วิชาที่จัดสอบ ({Object.keys(subjectMap).length})
                  </h3>
                  {highlightedSubject && (
                    <button
                      onClick={() => setHighlightedSubject(undefined)}
                      className="text-xxs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline transition-colors leading-none cursor-pointer outline-none"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(subjectMap).map(([subj, info]) => {
                    const isHighlighted = highlightedSubject === subj;
                    const count = scheduleData.filter(s => s.subject === subj).length;
                    return (
                      <button
                        key={subj}
                        onClick={() => setHighlightedSubject(isHighlighted ? undefined : subj)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer outline-none ${isHighlighted
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/80 ring-2 ring-blue-500/10 scale-[1.01] shadow-sm'
                          : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-150/50 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-lg shrink-0 ${info.color.bg} ${info.color.border} border`} />
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono text-xs">{subj}</span>
                            {info.name && <span className="text-xxs text-slate-400 dark:text-slate-500 truncate max-w-[110px] font-semibold mt-0.5">{info.name}</span>}
                          </div>
                        </div>
                        <span className={`text-xxs font-black px-2 py-0.5 rounded-full shrink-0 ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-455'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Visual Seating Map viewport */}
        <div className="flex-1 relative h-full bg-slate-100/30 dark:bg-slate-950/20 flex flex-col z-0">

          {/* Floating Mobile Sidebar Trigger Button */}
          {!isMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-full shadow-xl text-slate-655 dark:text-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all z-20 cursor-pointer"
              title="Open Sidebar Drawer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {currentConfig && room ? (
            <SeatMap
              config={currentConfig}
              occupied={occupiedSeats}
              targetSeat={selectedSeat?.seat}
              onSeatClick={(seatId, data) => setSelectedSeat(data || null)}
              highlightedSubject={highlightedSubject}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 flex-col gap-3.5 p-6 text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-md dark:shadow-none animate-bounce">🗺️</div>
              <div>
                <p className="font-black text-slate-700 dark:text-slate-350 text-base leading-none">โปรดเลือกห้องสอบ</p>
                <p className="text-xs text-slate-455 dark:text-slate-500 max-w-xs leading-relaxed mt-2.5 font-semibold">เลือกรายละเอียดรอบสอบ วัน เวลา และห้องสอบจากแถบด้านบน เพื่อจำลองผังที่นั่งในห้องสอบ</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Backdrop for Student Details Sheet */}
        {selectedSeat && (
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setSelectedSeat(null)}
          />
        )}

        {/* Responsive Drawer Bottom Sheet / Desktop Details Panel (Sleek slides) */}
        <div className={`fixed md:absolute z-40 md:z-20
          bottom-0 left-0 right-0 rounded-t-3xl max-h-[55vh] md:max-h-none border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/80
          md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-72 md:rounded-none
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl dark:shadow-none flex flex-col
          transition-transform duration-300 ease-in-out
          ${selectedSeat ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
        `}>

          {/* Drag handle for mobile */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-850 rounded-full mx-auto my-3 shrink-0 md:hidden" />

          {/* Details Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <h3 className="font-black text-slate-750 dark:text-slate-350 text-xs uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <User className="w-4 h-4 text-blue-600" />
              รายละเอียดการสอบ
            </h3>
            <button
              onClick={() => setSelectedSeat(null)}
              className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Details Body */}
          {selectedSeat && (
            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">

              {/* Warnings / Notes */}
              {!validSeatIds.has(selectedSeat.seat) && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wide leading-none">
                    <Info className="w-3.5 h-3.5" />
                    <span>ไม่พบตำแหน่งที่นั่งบนผัง</span>
                  </div>
                  <div className="text-amber-900 dark:text-amber-300 font-semibold text-xs leading-relaxed">
                    ที่นั่งหมายเลข <span className="font-mono font-bold text-amber-600 dark:text-amber-450 bg-amber-100/50 dark:bg-amber-950/40 px-1 rounded">{selectedSeat.seat}</span> ไม่แสดงบนแผนผังที่นั่ง
                  </div>
                </div>
              )}

              {selectedSeat.note && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wide leading-none">
                    <Info className="w-3.5 h-3.5" />
                    <span>หมายเหตุ</span>
                  </div>
                  <div className="text-amber-900 dark:text-amber-300 font-semibold text-xs leading-relaxed">
                    {selectedSeat.note}
                  </div>
                </div>
              )}

              {/* Seat Number */}
              <div className="text-center">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">หมายเลขที่นั่ง</span>
                <div className={`text-5xl font-black tracking-tighter ${selectedSeat.note ? 'text-amber-500 dark:text-amber-400' : 'text-blue-600 dark:text-blue-450'}`}>
                  {selectedSeat.seat || "-"}
                </div>
              </div>

              {/* Student ID Card */}
              <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl p-4 text-center relative overflow-hidden shadow-inner dark:shadow-none">
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1.5 block leading-none">รหัสนักศึกษา</span>
                <a
                  href={`/?id=${selectedSeat.student_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-mono font-black text-blue-900 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-4 flex items-center justify-center gap-1.5"
                  title="ดูตารางสอบทั้งหมดของ นศ. รายนี้"
                >
                  {selectedSeat.student_id}
                  <ExternalLink className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
                </a>
              </div>

              {/* Subject Details */}
              <div className="space-y-4 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-5">
                <div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block leading-none">รายวิชา</span>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">{getSubjectName(selectedSeat)}</h4>
                  <span className="font-mono text-slate-400 dark:text-slate-500 block mt-1 font-semibold">{selectedSeat.subject}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850 pt-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">กลุ่มเรียน</span>
                    <span className="font-black text-slate-700 dark:text-slate-300">{selectedSeat.section || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block leading-none">แผ่นใบเซ็นชื่อ</span>
                    <span className="font-black text-slate-700 dark:text-slate-300 font-mono">{selectedSeat.sheet || "-"}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};