import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SeatMap } from '../components/SeatMap';
import type { ExamResult, RoomConfigMap } from '../types';

interface RoundOption {
  id: string;
  label: string;
}

const PALETTE = [
  { bg: 'bg-blue-100 dark:bg-blue-950/45', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/45', text: 'text-emerald-900 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  { bg: 'bg-amber-100 dark:bg-amber-950/45', text: 'text-amber-900 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  { bg: 'bg-purple-100 dark:bg-purple-950/45', text: 'text-purple-900 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' },
  { bg: 'bg-rose-100 dark:bg-rose-950/45', text: 'text-rose-900 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/45', text: 'text-cyan-900 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-800' },
  { bg: 'bg-lime-100 dark:bg-lime-950/45', text: 'text-lime-900 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-800' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/45', text: 'text-fuchsia-900 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-800' },
];

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
    const map: Record<string, { color: typeof PALETTE[0], name: string }> = {};
    const entries = Object.values(occupiedSeats);
    const uniqueSubjects = Array.from(new Set(entries.map(d => d.subject))).sort();

    uniqueSubjects.forEach((subj, index) => {
      const representative = entries.find(e => e.subject === subj);
      const name = representative?.subject_name || "";
      map[subj] = {
        color: PALETTE[index % PALETTE.length],
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
  const pct = totalSeatsCount > 0 ? Math.round((occupiedCount / totalSeatsCount) * 100) : 0;
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950 text-sm overflow-hidden select-none transition-colors">

      {/* TOP DASHBOARD NAVIGATION BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-850 px-6 py-4 z-20 shadow-sm dark:shadow-none shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Left Side: Room info title & pill badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight tracking-tight">
            สำรวจห้องสอบ
          </h1>
          {room && (
            <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-300">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                {currentRoundLabel}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 font-mono">
                ห้อง: {room}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Autocomplete Search Input */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-72" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                className="w-full bg-slate-55/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800 dark:text-slate-100"
                placeholder="ค้นหารหัส นศ. ในห้องนี้"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                disabled={!round}
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setShowResults(false); }}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors cursor-pointer animate-in fade-in"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Search Dropdown */}
            {showResults && (
              <div className="absolute top-full mt-2 right-0 left-0 bg-white dark:bg-slate-900 rounded-xl shadow-2xl dark:shadow-none border border-slate-200/50 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {isSearching ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2.5 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">กำลังค้นหา...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                      พบผลการค้นหา {searchResults.length} รายการ
                    </div>
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-850/60 cursor-pointer group transition-colors last:border-0"
                        onClick={() => selectSearchResult(res)}
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{getSubjectName(res)}</span>
                          <span className="shrink-0 text-[9px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 group-hover:border-blue-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {res.room}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>{res.date}</span>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                            <span>{res.time}</span>
                          </div>
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 rounded">
                            ที่นั่ง {res.seat}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <span className="text-xs font-bold text-slate-500">ไม่พบข้อมูลที่นั่ง</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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

        {/* Left Sidebar Panel (Filters & Analytics) */}
        <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] md:max-w-none md:static md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80 flex flex-col shrink-0 z-40 md:z-10 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 md:bg-transparent">
            <h2 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              ตัวกรอง & รายละเอียด
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

            {/* Filters Selectors */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                ข้อมูลการเลือก
              </h3>

              {/* Round Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-400 mb-1.5 tracking-wider">รอบสอบ (Round)</label>
                <div className="relative">
                  <select
                    value={round}
                    onChange={e => handleFilterChange(setRound, e.target.value)}
                    className="w-full appearance-none border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {optRounds.length === 0 && <option>Loading...</option>}
                    {optRounds.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Date Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-400 mb-1.5 tracking-wider">วันที่ (Date)</label>
                <div className="relative">
                  <select
                    value={date}
                    onChange={e => handleFilterChange(setDate, e.target.value)}
                    className="w-full appearance-none border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {optDates.length === 0 && <option value="">Select Round</option>}
                    {optDates.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Time Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-400 mb-1.5 tracking-wider">เวลา (Time)</label>
                <div className="relative">
                  <select
                    value={time}
                    onChange={e => handleFilterChange(setTime, e.target.value)}
                    className="w-full appearance-none border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  >
                    {optTimes.length > 0 ? optTimes.map(t => <option key={t} value={t}>{t}</option>) : <option>--:--</option>}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Room Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-400 mb-1.5 tracking-wider">ห้องสอบ (Room)</label>
                <div className="relative">
                  <select
                    value={room}
                    onChange={e => handleFilterChange(setRoom, e.target.value)}
                    className="w-full appearance-none border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  >
                    {optRooms.length > 0 ? optRooms.map(r => <option key={r} value={r}>{r}</option>) : <option>None</option>}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Occupancy Analytics (Circular SVG Widget) */}
            {currentConfig && room && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  อัตราการครองที่นั่ง
                </h3>
                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
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
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{pct}%</span>
                      <span className="text-[7px] uppercase font-bold text-slate-400 dark:text-slate-400 mt-0.5 leading-none">เต็ม</span>
                    </div>
                  </div>

                  {/* Summary counts */}
                  <div className="flex-1 space-y-1 text-xs min-w-0 font-sans">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                      <span>ความจุ:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">{totalSeatsCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                      <span>ใช้งาน:</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{occupiedCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium border-t border-dashed border-slate-200 dark:border-slate-800 pt-1 mt-1">
                      <span>ว่าง:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{totalSeatsCount - occupiedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orphaned/Missing Seats Warning Alert Widget */}
            {orphanedSeats.length > 0 && (
              <div className="space-y-3 bg-red-50 dark:bg-red-900/30 border border-red-200/60 dark:border-red-900/40 rounded-2xl p-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 text-red-800 dark:text-red-400 font-extrabold text-[10px] uppercase tracking-wide">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>ที่นั่งตกหล่น/ไม่มีในผัง ({orphanedSeats.length})</span>
                </div>
                <p className="text-[10.5px] text-red-700 dark:text-red-400 leading-normal font-medium font-sans">
                  พบข้อมูลที่นั่งที่ระบุในตารางสอบ แต่มองไม่เห็นในโครงสร้างผังห้องสอบปัจจุบัน:
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {orphanedSeats.map((student) => (
                    <button
                      key={student.student_id}
                      onClick={() => setSelectedSeat(student)}
                      className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800 hover:shadow-sm rounded-xl text-left transition-all text-xs cursor-pointer"
                    >
                      <div className="flex flex-col leading-tight min-w-0 pr-2">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-xs">{student.student_id}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-400 truncate max-w-[125px] font-semibold mt-0.5">{getSubjectName(student)}</span>
                      </div>
                      <span className="font-mono text-red-600 dark:text-red-500 font-extrabold bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/60 px-2 py-0.5 rounded-lg shrink-0 text-[10px]">
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
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                    วิชาที่จัดสอบ ({Object.keys(subjectMap).length})
                  </h3>
                  {highlightedSubject && (
                    <button
                      onClick={() => setHighlightedSubject(undefined)}
                      className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline transition-colors leading-none cursor-pointer"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(subjectMap).map(([subj, info]) => {
                    const isHighlighted = highlightedSubject === subj;
                    const count = scheduleData.filter(s => s.subject === subj).length;
                    return (
                      <button
                        key={subj}
                        onClick={() => setHighlightedSubject(isHighlighted ? undefined : subj)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${isHighlighted
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80 ring-2 ring-blue-500/10 scale-[1.02] shadow-sm'
                          : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-lg shrink-0 ${info.color.bg} ${info.color.border} border`} />
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-xs">{subj}</span>
                            {info.name && <span className="text-[9px] text-slate-400 dark:text-slate-400 truncate max-w-[130px] font-medium mt-0.5">{info.name}</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full shadow-xl dark:shadow-none text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 transition-all z-20 cursor-pointer"
            title="Open Filters Drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          {currentConfig && room ? (
            <SeatMap
              config={currentConfig}
              occupied={occupiedSeats}
              targetSeat={selectedSeat?.seat}
              onSeatClick={(seatId, data) => setSelectedSeat(data || null)}
              highlightedSubject={highlightedSubject}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 flex-col gap-3 p-6 text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-md dark:shadow-none animate-bounce">🗺️</div>
              <div>
                <p className="font-extrabold text-slate-700 dark:text-slate-300 text-base leading-none">โปรดเลือกห้องสอบ</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs leading-relaxed mt-2.5">เลือกรายละเอียดรอบสอบ วัน เวลา และห้องสอบจากแผงควบคุมด้านซ้าย เพื่อจำลองผังที่นั่งในห้องสอบ</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Backdrop for Seat Details Panel */}
        {selectedSeat && (
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setSelectedSeat(null)}
          />
        )}

        {/* Responsive Drawer Sidebar / Bottom Sheet (Student details) */}
        <div className={`fixed md:absolute z-40 md:z-20
          bottom-0 left-0 right-0 rounded-t-3xl max-h-[55vh] md:max-h-none border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/80
          md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-80 md:rounded-none
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl dark:shadow-none flex flex-col
          transition-transform duration-300 ease-in-out
          ${selectedSeat ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
        `}>

          {/* Drag handle decoration for mobile sheet */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-3 shrink-0 md:hidden" />

          {/* Details Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              รายละเอียดการสอบ
            </h3>
            <button
              onClick={() => setSelectedSeat(null)}
              className="text-slate-400 hover:text-rose-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Details Body */}
          {selectedSeat && (
            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">

              {/* Orphaned Seat Warning */}
              {!validSeatIds.has(selectedSeat.seat) && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wide">
                    <span>⚠️ไม่พบตำแหน่งที่นั่งบนผังที่นั่ง</span>
                  </div>
                  <div className="text-amber-900 dark:text-amber-300 font-medium text-xs leading-relaxed">
                    ที่นั่งหมายเลข <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/40 px-1 rounded">{selectedSeat.seat}</span> ไม่แสดงบนแผนผังที่นั่ง
                  </div>
                </div>
              )}

                  {/* Warnings / Notes */}
                  {selectedSeat.note && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col gap-1.5 animate-pulse">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wide">
                        <span>⚠️ Note / หมายเหตุ</span>
                      </div>
                      <div className="text-amber-900 dark:text-amber-300 font-semibold text-xs leading-relaxed">
                        {selectedSeat.note}
                      </div>
                    </div>
                  )}

                  {/* Seat Number */}
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">หมายเลขที่นั่ง</span>
                    <div className={`text-5.5xl font-black tracking-tighter ${selectedSeat.note ? 'text-amber-500 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {selectedSeat.seat || "-"}
                    </div>
                  </div>

                  {/* Student ID Card */}
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100/70 dark:border-blue-900/40 rounded-2xl p-4 text-center relative overflow-hidden group shadow-inner dark:shadow-none">
                    <div className="relative z-10">
                      <span className="text-[9px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-1.5 block">รหัสนักศึกษา</span>
                      <a
                        href={`/?id=${selectedSeat.student_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-mono font-black text-blue-900 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-400 hover:underline underline-offset-4 flex items-center justify-center gap-1.5"
                        title="Click to view full schedule"
                      >
                        {selectedSeat.student_id}
                        <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Subject Details */}
                  <div className="space-y-4 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-6">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">รายวิชา</span>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">{getSubjectName(selectedSeat)}</h4>
                      <span className="font-mono text-slate-400 dark:text-slate-400 block mt-1 font-semibold">{selectedSeat.subject}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850 pt-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1 block">กลุ่มเรียน</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{selectedSeat.section || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1 block">ใบรายชื่อแผ่นที่</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{selectedSeat.sheet || "-"}</span>
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