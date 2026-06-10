import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ExamResult, RoomConfigMap } from '../types';
import { ExamCard } from '../components/ExamCard';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { SearchHistoryDropdown, type SearchHistoryItem } from '../components/SearchHistoryDropdown';

interface RoundOption {
  id: string;
  label: string;
}

export const StudentSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [results, setResults] = useState<ExamResult[] | null>(null);
  const [configMap, setConfigMap] = useState<RoomConfigMap>({});
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stats dashboard state
  const [statsData, setStatsData] = useState<any>(null);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Search history state
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('student_search_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // History management helpers
  const saveToHistory = useCallback((id: string, roundId: string) => {
    setHistory((prev) => {
      const roundLabel = rounds.find(r => r.id === roundId)?.label || roundId;
      // Remove duplicates
      const filtered = prev.filter(item => !(item.studentId === id && item.roundId === roundId));
      const updated = [{ studentId: id, roundId, roundLabel }, ...filtered];
      localStorage.setItem('student_search_history', JSON.stringify(updated));
      return updated;
    });
  }, [rounds]);

  const removeFromHistory = useCallback((id: string, roundId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter(item => !(item.studentId === id && item.roundId === roundId));
      localStorage.setItem('student_search_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllHistory = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('student_search_history');
  }, []);

  // Dropdown click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
  const performSearch = useCallback(async (id: string, roundId: string) => {
    if (id.length < 5 || !roundId) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(`/api/exam?id=${id}&round=${roundId}`);
      if (res.status === 404) {
        setResults([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data.");

      const rawData = await res.json();
      setResults(rawData);
      // Save to history on successful search results
      saveToHistory(id, roundId);

      const uniqueRooms = [...new Set(rawData.map((exam: { room: any; }) => exam.room))].filter(Boolean);

      if (uniqueRooms.length > 0) {
        const roomsParam = uniqueRooms.join(',');
        fetch(`/api/room?room=${roomsParam}`)
          .then(res => res.ok ? res.json() : {})
          .then(data => setConfigMap(data))
          .catch(() => console.warn("Could not load config"));
      }
    } catch (err: any) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }, [saveToHistory]);

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSelectedRound(item.roundId);
    setStudentId(item.studentId);
    performSearch(item.studentId, item.roundId);
    setSearchParams({ id: item.studentId });
    setShowHistory(false);
  };

  const handleJumpToExplorer = (exam: ExamResult) => {
    const params = new URLSearchParams({
      round: selectedRound,
      date: exam.date,
      time: exam.time,
      room: exam.room,
      seat: exam.seat
    });
    navigate(`/explorer?${params.toString()}`);
  };

  const hasRun = useRef<boolean>(false);
  // Fetch Config, Rounds, & Stats
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Fetch Rounds
    fetch('/api/rounds')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch rounds");
        return res.json();
      })
      .then((data: RoundOption[]) => {
        const validRounds = Array.isArray(data) ? data : [];
        if (validRounds.length > 0) {
          setRounds(validRounds);
          const defaultRoundId = validRounds[0].id;
          setSelectedRound(defaultRoundId);

          const urlId = searchParams.get('id');
          if (urlId) {
            setStudentId(urlId);
            performSearch(urlId, defaultRoundId);
          }
        }
      })
      .catch((err) => console.warn("Could not load rounds", err));

    // Fetch Stats
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then(setStatsData)
      .catch((err) => console.warn("Could not load stats", err));
  }, [searchParams, performSearch]);

  const handleDownloadICal = () => {
    if (!studentId) return;
    const cleanId = studentId.replace(/-/g, '');
    window.open(`/api/calendar/${cleanId}.ics`, '_blank');
  };

  const handleSubscribeCalendar = () => {
    if (!studentId) return;
    const cleanId = studentId.replace(/-/g, '');
    const host = window.location.host;
    const webcalUrl = `webcal://${host}/api/calendar/${cleanId}.ics`;
    window.location.href = webcalUrl;
  };

  const handleCopyFeed = () => {
    if (!studentId) return;
    const cleanId = studentId.replace(/-/g, '');
    const url = `${window.location.protocol}//${window.location.host}/api/calendar/${cleanId}.ics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2000);
    });
  };

  const handleManualSearch = () => {
    performSearch(studentId, selectedRound);
    setSearchParams({ id: studentId });
    setShowHistory(false);
  };

  const handleViewMap = (room: string) => {
    const targetId = `room-${room.toLowerCase()}`;
    window.open(`/room#${targetId}`, '_blank', 'noopener,noreferrer');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9) + '-' + val.slice(9, 10);
    setStudentId(val);
  };

  // Get current stats for the selected round
  const currentRoundStats = useMemo(() => {
    if (!statsData || !selectedRound || !statsData.stats[selectedRound]) return null;
    return statsData.stats[selectedRound];
  }, [statsData, selectedRound]);

  const totalHeadcount = currentRoundStats?.student_count || 0;
  const totalRooms = currentRoundStats?.room_count || 0;
  const topSubjects = currentRoundStats?.top_subjects?.slice(0, 3) || [];
  const cohorts = currentRoundStats?.year_distribution?.slice(0, 4) || [];

  return (
    <div
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 flex flex-col items-center pt-8 md:pt-14 px-6 pb-20 relative z-10 transition-colors"
    >
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* HERO TITLE */}
        <div className="text-center mb-8 md:mb-12 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-none mb-3">
            ค้นหาที่นั่งสอบ
          </h1>
          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
            วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
          </p>
        </div>

        {/* SEARCH CONTAINER (Glassmorphic) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 shadow-xl dark:shadow-none rounded-2xl p-6 md:p-8 w-full max-w-lg mb-8 md:mb-12 transition-all">
          {/* Round Selector */}
          <div className="mb-5">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              รอบการสอบ (Exam Round)
            </label>
            <div className="relative">
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="block appearance-none w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-4 py-2.5 pr-8 rounded-xl shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-all"
                disabled={rounds.length === 0}
              >
                {rounds.length === 0 ? (
                  <option>Loading rounds...</option>
                ) : (
                  rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Student ID input */}
          <div className="mb-6 relative" ref={historyRef}>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              รหัสนักศึกษา (Student ID)
            </label>
            <input
              type="text"
              placeholder="653380123-4"
              value={studentId}
              onChange={handleInput}
              onFocus={() => setShowHistory(true)}
              onClick={() => setShowHistory(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              maxLength={11}
              className="shadow-sm appearance-none border border-slate-200 dark:border-slate-700 rounded-xl w-full py-3 px-4 text-slate-800 dark:text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-xl tracking-widest transition-all bg-white dark:bg-slate-800"
            />

            {showHistory && (
              <SearchHistoryDropdown
                history={history}
                onSelect={handleHistoryClick}
                onRemove={removeFromHistory}
                onClearAll={clearAllHistory}
              />
            )}
          </div>

          <button
            onClick={handleManualSearch}
            disabled={loading || !selectedRound}
            className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-100 dark:shadow-none flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-base">{loading ? 'กำลังค้นหา...' : 'ค้นหาที่นั่งสอบ'}</span>
          </button>

          {error && <div className="mt-4 text-rose-500 text-center text-sm font-semibold">{error}</div>}

          {results !== null && results.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3.5 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ปฏิทินสอบส่วนตัว (Calendar Subscription)
              </span>
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={handleCopyFeed}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${copiedFeed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 active:scale-[0.98]'
                    }`}
                >
                  <svg className="w-4 h-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copiedFeed ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                </button>

                <button
                  onClick={handleSubscribeCalendar}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>เชื่อมต่อ</span>
                </button>

                <button
                  onClick={handleDownloadICal}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>โหลดไฟล์ .ics</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS AREA */}
        <div className="w-full space-y-6">

          {results?.map((exam, idx) => (
            <ExamCard
              key={`${exam.subject}-${idx}`}
              data={exam}
              configMap={configMap}
              subjectName={exam.subject_name || ""}
              onViewMap={() => handleViewMap(exam.room)}
              onJumpToExplorer={() => handleJumpToExplorer(exam)}
            />
          ))}

          {/* NO RESULTS DISPLAY */}
          {results !== null && results.length === 0 && !loading && !error && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-rose-100 dark:border-rose-950/40 rounded-2xl p-10 text-center shadow-sm dark:shadow-none max-w-md mx-auto">
              <div className="text-rose-500 text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">ไม่พบข้อมูลที่นั่งสอบ</h3>
              <p className="text-slate-400 dark:text-slate-400 text-xs">โปรดตรวจสอบรหัสนักศึกษา หรือรอบการสอบใหม่อีกครั้ง</p>
            </div>
          )}

          {/* INITIAL STATE: SHOW STATS SUMMARY */}
          {results === null && !loading && currentRoundStats && (
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Summary Cards */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none">
                  <div className="text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">นักศึกษาที่มีสิทธิ์สอบ</div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalHeadcount.toLocaleString()} <span className="text-sm font-semibold text-slate-400 dark:text-slate-400">คน</span></div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none">
                  <div className="text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">ห้องสอบที่จัดสรร</div>
                  <div className="text-3xl font-black text-sky-600 dark:text-sky-400">{totalRooms} <span className="text-sm font-semibold text-slate-400 dark:text-slate-400">ห้อง</span></div>
                </div>
              </div>

              {/* Top Subjects Volume */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm md:col-span-1 dark:shadow-none">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-3.5 border-b dark:border-slate-800 pb-2">รายวิชาที่มีที่นั่งสูงสุด</h3>
                {topSubjects.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลรายวิชา</div>
                ) : (
                  <div className="space-y-3">
                    {topSubjects.map((sub: any, idx: number) => (
                      <div key={sub.code} className="flex justify-between items-start text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block leading-tight">{sub.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{sub.code}</span>
                        </div>
                        <span className="shrink-0 font-bold text-blue-600 dark:text-blue-400">{sub.count} ที่นั่ง</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cohort Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm md:col-span-1 dark:shadow-none">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-3.5 border-b dark:border-slate-800 pb-2">สัดส่วนตามชั้นปี (รหัส นศ.)</h3>
                {cohorts.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลชั้นปี</div>
                ) : (
                  <div className="space-y-2.5">
                    {cohorts.map((item: any) => (
                      <div key={item.year} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 font-medium">รหัสชั้นปี {item.year}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.count.toLocaleString()} คน</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
      <ScrollToTopButton scrollContainerRef={scrollContainerRef} />
    </div>
  );
};