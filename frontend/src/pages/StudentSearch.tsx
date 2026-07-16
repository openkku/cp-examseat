import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ExamResult, RoomConfigMap } from '../types';
import { ExamCard } from '../components/exam/ExamCard';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { SearchHistory, type SearchHistoryItem } from '../components/search/SearchHistory';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

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
import { CalendarActions } from '../components/calendar/CalendarActions';

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
          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
            วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
          </p>
        </div>

        {/* SEARCH CONTAINER (Glassmorphic) */}
        <Card glass className="p-6 md:p-8 w-full max-w-lg mb-8 md:mb-12 shadow-xl hover:shadow-2xl !overflow-visible">
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

          {/* Student ID input */}
          <div className="mb-6 relative" ref={historyRef}>
            <Input
              label="รหัสนักศึกษา (Student ID)"
              type="text"
              placeholder="653380123-4"
              value={studentId}
              onChange={handleInput}
              onFocus={() => setShowHistory(true)}
              onClick={() => setShowHistory(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              maxLength={11}
              className="font-mono text-center text-xl tracking-widest py-3 border-slate-200 dark:border-slate-800"
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

          <Button
            onClick={handleManualSearch}
            disabled={loading || !selectedRound}
            fullWidth
            size="lg"
            icon={<Search className="w-5 h-5" />}
          >
            {loading ? 'กำลังค้นหา...' : 'ค้นหาที่นั่งสอบ'}
          </Button>

          {error && <div className="mt-4 text-rose-500 text-center text-sm font-semibold">{error}</div>}
          {results !== null && results.length > 0 && (
            <CalendarActions studentId={studentId} />
          )}
        </Card>

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
                <Card className="p-5 border-slate-100 dark:border-slate-800/80">
                  <div className="text-slate-400 dark:text-slate-500 text-xxs font-bold uppercase tracking-wider mb-1 leading-none">นักศึกษาที่มีสิทธิ์สอบ</div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2 leading-none">
                    {animatedHeadcount.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">คน</span>
                  </div>
                </Card>

                <Card className="p-5 border-slate-100 dark:border-slate-800/80">
                  <div className="text-slate-400 dark:text-slate-500 text-xxs font-bold uppercase tracking-wider mb-1 leading-none">ห้องสอบที่จัดสรร</div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2 leading-none">
                    {animatedRooms.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">ห้อง</span>
                  </div>
                </Card>
              </div>

              {/* Top Subjects Volume */}
              <Card className="p-5 border-slate-100 dark:border-slate-800/80 md:col-span-1">
                <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 leading-none">
                  รายวิชาที่มีที่นั่งสูงสุด
                </h3>
                {topSubjects.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลรายวิชา</div>
                ) : (
                  <div className="space-y-3.5">
                    {topSubjects.map((sub: any) => (
                      <div key={sub.code} className="flex justify-between items-start text-xs gap-2.5">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-750 dark:text-slate-200 truncate block leading-tight">{sub.name}</span>
                          <span className="text-xxs text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">{sub.code}</span>
                        </div>
                        <Badge variant="blue" size="sm" className="shrink-0 font-extrabold">
                          {sub.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Cohort Breakdown */}
              <Card className="p-5 border-slate-100 dark:border-slate-800/80 md:col-span-1">
                <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 leading-none">
                  สัดส่วนตามชั้นปี (รหัส นศ.)
                </h3>
                {cohorts.length === 0 ? (
                  <div className="text-slate-300 dark:text-slate-700 text-xs italic py-4 text-center">ไม่มีข้อมูลชั้นปี</div>
                ) : (
                  <div className="space-y-2.5">
                    {cohorts.map((item: any) => (
                      <div key={item.year} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-455">รหัสชั้นปี {item.year}</span>
                        <span className="font-black text-slate-750 dark:text-slate-200 font-mono">{item.count.toLocaleString()} คน</span>
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