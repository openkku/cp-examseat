import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ExamResult, RoomConfigMap } from '../types';
import { ExamCard } from '../components/exam/ExamCard';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { SearchHistory, type SearchHistoryItem } from '../components/search/SearchHistory';
import { StudentProfileCard } from '../components/search/StudentProfileCard';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { hasExamPassed } from '../utils';

// UI Primitives
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

// Icons
import {
  Search
} from '../components/icons';

interface RoundOption {
  id: string;
  label: string;
}

export const StudentSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [results, setResults] = useState<ExamResult[] | null>(null);
  const [branch, setBranch] = useState<string>('');
  const [configMap, setConfigMap] = useState<RoomConfigMap>({});
  const [rounds, setRounds] = useState<RoundOption[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hide passed exams toggle (disabled by default)
  const [hidePassed, setHidePassed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hide_passed_exams') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hide_passed_exams', String(hidePassed));
    } catch (e) {
      console.warn('Could not save filter to localStorage', e);
    }
  }, [hidePassed]);

  // Sort results: if hidePassed is true, upcoming first, passed pushed to bottom.
  // Otherwise, sort purely chronologically.
  const processedResults = useMemo(() => {
    if (!results) return null;

    return [...results].sort((a, b) => {
      const aPassed = hasExamPassed(a.date, a.time);
      const bPassed = hasExamPassed(b.date, b.time);

      if (hidePassed && aPassed !== bPassed) {
        return aPassed ? 1 : -1; // Push passed exams to the bottom when hidePassed is true
      }

      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      
      const aStart = a.time?.split('-')[0] || '';
      const bStart = b.time?.split('-')[0] || '';
      return aStart.localeCompare(bStart);
    });
  }, [results, hidePassed]);

  // Stats dashboard state
  const [statsData, setStatsData] = useState<any>(null);

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
    setBranch('');

    try {
      const res = await fetch(`/api/exam?id=${id}&round=${roundId}`);
      if (res.status === 404) {
        setResults([]);
        setBranch('');
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data.");

      const rawData: ExamResult[] = await res.json();
      setResults(rawData);
      setBranch(rawData.length > 0 ? (rawData[0].branch || '') : '');
      // Save to history on successful search results
      saveToHistory(id, roundId);

      const uniqueRooms = [...new Set(rawData.map((exam) => exam.room))].filter(Boolean);

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
  const animatedHeadcount = useAnimatedNumber(totalHeadcount);
  const animatedRooms = useAnimatedNumber(totalRooms);
  const topSubjects = currentRoundStats?.top_subjects?.slice(0, 3) || [];
  const cohorts = currentRoundStats?.year_distribution?.slice(0, 4) || [];

  const examsCount = results ? results.length : 0;
  const roomsCount = results ? new Set(results.map(r => r.room).filter(Boolean)).size : 0;
  const daysCount = results ? new Set(results.map(r => r.date).filter(Boolean)).size : 0;

  return (
    <div
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 flex flex-col items-center pt-8 md:pt-14 px-6 pb-20 relative z-10 transition-colors"
    >
      <div className="max-w-3xl w-full flex flex-col items-center">
        {/* HERO TITLE */}
        <div className="text-center mb-8 md:mb-12 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-none mb-3">
            ค้นหาที่นั่งสอบ
          </h1>
          <p className="text-base md:text-lg font-bold text-slate-500 dark:text-slate-400">
            วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
          </p>
        </div>

        {/* SEARCH CONTAINER (Minimal Blue Theme) */}
        <Card className="p-6 md:p-8 w-full max-w-lg mb-8 md:mb-12 border-slate-200 dark:border-slate-800 shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-none !overflow-visible">
          {/* Round Selector */}
          <div className="mb-5">
            <Select
              label="รอบการสอบ (Exam Round)"
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
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
            </Select>
          </div>

          {/* Student ID input with inline search button */}
          <div className="mb-4" ref={historyRef}>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              รหัสนักศึกษา (Student ID)
            </label>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 relative">
              <div className="w-full md:flex-1 relative">
                <input
                  type="text"
                  placeholder="653380123-4"
                  value={studentId}
                  onChange={handleInput}
                  onFocus={() => setShowHistory(true)}
                  onClick={() => setShowHistory(true)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  maxLength={11}
                  className="shadow-none appearance-none border rounded-xl w-full py-3 px-4 text-slate-800 dark:text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-slate-350 dark:focus:ring-slate-700 focus:border-transparent font-mono text-center text-xl tracking-widest bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                />

                {showHistory && (
                  <SearchHistory
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
                className="w-full md:w-auto shrink-0 py-3 px-6 rounded-xl font-bold text-sm whitespace-nowrap h-[50px] flex items-center justify-center bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white border-none shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer gap-2"
              >
                {loading ? '...' : (
                  <>
                    <Search className="w-5 h-5 text-white" />
                    <span>ค้นหา</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && <div className="mt-4 text-rose-500 text-center text-sm font-semibold">{error}</div>}
        </Card>

        {/* STUDENT PROFILE CARD */}
        {results !== null && results.length > 0 && (
          <StudentProfileCard
            studentId={studentId}
            branch={branch}
            examsCount={examsCount}
            roomsCount={roomsCount}
            daysCount={daysCount}
          />
        )}

        {/* RESULTS AREA */}
        <div className="w-full space-y-6">
          {results !== null && results.length > 0 && (
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 animate-in fade-in duration-300">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                ตารางสอบของคุณ ({processedResults?.length || 0} รายการ)
              </span>
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={hidePassed}
                  onChange={(e) => setHidePassed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-250 dark:border-slate-800 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 transition-all cursor-pointer"
                />
                <span>ซ่อนวิชาที่สอบผ่านไปแล้ว</span>
              </label>
            </div>
          )}

          {processedResults?.map((exam, idx) => (
            <ExamCard
              key={`${exam.subject}-${idx}`}
              data={exam}
              configMap={configMap}
              subjectName={exam.subject_name || ""}
              onViewMap={() => handleViewMap(exam.room)}
              onJumpToExplorer={() => handleJumpToExplorer(exam)}
              isPassed={hidePassed && hasExamPassed(exam.date, exam.time)}
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
                <Card className="p-5 border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 dark:border-l-blue-500/80">
                  <div className="text-slate-400 dark:text-slate-400 text-xxs font-bold uppercase tracking-wider mb-1 leading-none">นักศึกษาที่มีสิทธิ์สอบ</div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2 leading-none">
                    {animatedHeadcount.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-400 ml-1">คน</span>
                  </div>
                </Card>

                <Card className="p-5 border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 dark:border-l-emerald-500/80">
                  <div className="text-slate-400 dark:text-slate-400 text-xxs font-bold uppercase tracking-wider mb-1 leading-none">ห้องสอบที่จัดสรร</div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 leading-none">
                    {animatedRooms.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-400 ml-1">ห้อง</span>
                  </div>
                </Card>
              </div>

              {/* Top Subjects Volume */}
              <Card className="p-5 border-slate-200 dark:border-slate-800 md:col-span-1 border-l-4 border-l-sky-500 dark:border-l-sky-500/80">
                <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-800/50 leading-none">
                  รายวิชาที่มีที่นั่งสูงสุด
                </h3>
                {topSubjects.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลรายวิชา</div>
                ) : (
                  <div className="space-y-3.5">
                    {topSubjects.map((sub: any) => (
                      <div key={sub.code} className="flex justify-between items-start text-xs gap-2.5">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate block leading-tight">{sub.name}</span>
                          <span className="text-xxs text-slate-400 dark:text-slate-400 font-mono mt-0.5 block">{sub.code}</span>
                        </div>
                        <Badge variant="slate" size="sm" className="shrink-0 font-bold bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 border-none px-2 py-0.5">
                          {sub.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Cohort Breakdown */}
              <Card className="p-5 border-slate-200 dark:border-slate-800 md:col-span-1 border-l-4 border-l-violet-500 dark:border-l-violet-500/80">
                <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-800/50 leading-none">
                  สัดส่วนตามชั้นปี (รหัส นศ.)
                </h3>
                {cohorts.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลชั้นปี</div>
                ) : (
                  <div className="space-y-2.5">
                    {cohorts.map((item: any) => (
                      <div key={item.year} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-550 dark:text-slate-400">รหัสชั้นปี {item.year}</span>
                        <span className="font-black text-violet-600 dark:text-violet-400 font-mono">{item.count.toLocaleString()} คน</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

            </div>
          )}
        </div>
      </div>
      <ScrollToTopButton scrollContainerRef={scrollContainerRef} />
    </div>
  );
};