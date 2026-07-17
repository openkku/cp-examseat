// src/components/exam/ExamCard.tsx
import React, { useMemo } from 'react';
import type { ExamResult, RoomConfigMap } from '../../types';
import { SeatMap } from '../room/SeatMap';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Calendar as CalendarIcon, Clock, MapPin, Image as ImageIcon } from '../icons';

interface Props {
  data: ExamResult;
  configMap: RoomConfigMap;
  subjectName?: string;
  onViewMap?: () => void;
  onJumpToExplorer?: () => void;
  isPassed?: boolean;
}

export const ExamCard: React.FC<Props> = ({ 
  data, 
  configMap, 
  subjectName, 
  onViewMap, 
  onJumpToExplorer,
  isPassed = false
}) => {
  
  // 1. Resolve special status
  const specialStatus = useMemo(() => {
    if (data.sheet && data.sheet.includes('รายวิชากักตัวสอบ')) return 'quarantine';
    if (data.room && data.room.includes('จัดสอบนอกตาราง')) return 'outside-schedule';
    if (data.note && data.note.includes('หมดสิทธิ์สอบ')) return 'no-eligibility';
    return null;
  }, [data.sheet, data.room, data.note]);

  // 2. Resolve config using RegExp matching
  const config = useMemo(() => {
    if (!data.room || data.room === '-' || !configMap) return null;
    if (configMap[data.room]) return configMap[data.room];
    const keys = Object.keys(configMap);
    for (const key of keys) {
      try {
        if (new RegExp(key, 'i').test(data.room)) return configMap[key];
      } catch (e) {}
    }
    return null;
  }, [data.room, configMap]);

  // Premium Border Themes
  const cardBorder = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'rose' as const;
    if (specialStatus === 'quarantine') return 'amber' as const;
    if (specialStatus === 'outside-schedule') return 'sky' as const;
    return 'default' as const;
  }, [specialStatus]);

  const detailBg = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'bg-rose-50/30 dark:bg-rose-950/5';
    if (specialStatus === 'quarantine') return 'bg-amber-50/30 dark:bg-amber-950/5';
    if (specialStatus === 'outside-schedule') return 'bg-sky-50/30 dark:bg-sky-950/5';
    return 'bg-white dark:bg-slate-900';
  }, [specialStatus]);

  const statusLabel = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'ไม่มีสิทธิ์สอบ';
    if (specialStatus === 'quarantine') return 'กักตัวสอบ';
    if (specialStatus === 'outside-schedule') return 'สอบนอกตาราง';
    return null;
  }, [specialStatus]);

  const statusBadgeColor = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'rose' as const;
    if (specialStatus === 'quarantine') return 'amber' as const;
    if (specialStatus === 'outside-schedule') return 'sky' as const;
    return 'slate' as const;
  }, [specialStatus]);

  return (
    <Card 
      borderVariant={cardBorder} 
      className={`flex flex-col md:flex-row shadow-xl dark:shadow-none hover:shadow-2xl dark:hover:shadow-none transition-all duration-300 w-full ${
        isPassed ? 'opacity-40 filter grayscale pointer-events-none shadow-none hover:shadow-none hover:translate-y-0' : ''
      }`}
    >
      {/* LEFT: Details Panel */}
      <div className={`p-6 md:w-[38%] flex flex-col border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/60 ${detailBg} z-10`}>
        
        {/* Course Code & Name */}
        <div className="mb-5">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase tracking-wider block mb-1.5 leading-none">รายวิชา (Subject)</span>
                <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-snug break-words" title={subjectName || data.subject}>
                    {subjectName || data.subject}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span>{data.subject}</span>
                  {data.section && (
                    <>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-655 dark:text-slate-350 font-sans text-xs font-extrabold">Sec.{data.section}</span>
                    </>
                  )}
                </div>
              </div>
             {statusLabel && (
                <Badge variant={statusBadgeColor} size="sm">
                   {statusLabel}
                </Badge>
             )}
          </div>
        </div>

        {/* Date/Time Block */}
        <div className="grid grid-cols-1 gap-2.5 mb-5">
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
                <div className="text-blue-500 dark:text-blue-450 shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase block tracking-wider leading-none mb-1.5">วันที่ (Date)</span>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-200 whitespace-nowrap block">{data.date}</span>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
                <div className="text-blue-500 dark:text-blue-450 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase block tracking-wider leading-none mb-1.5">เวลา (Time)</span>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-200 whitespace-nowrap block font-mono">{data.time}</span>
                </div>
            </div>
        </div>

        {/* Room & Seat Block */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/60 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/80 relative overflow-hidden mb-6 shadow-inner dark:shadow-none">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-cyan-500"></div>
            
            <div className="flex justify-between items-end mb-1 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase tracking-wider leading-none">ห้องสอบ (Room)</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase tracking-wider leading-none text-right">ที่นั่ง (Seat)</span>
            </div>
            <div className="flex justify-between items-end px-1 mt-1.5">
                 <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{data.room || "-"}</span>
                 <span className={`text-3xl font-black font-mono tracking-tighter leading-none ${specialStatus ? 'text-amber-500 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {data.seat || "-"}
                 </span>
            </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-auto space-y-2">
            {/* Jump to Explorer Button */}
            {(specialStatus !== 'outside-schedule') && onJumpToExplorer && (
               <Button 
                 onClick={onJumpToExplorer}
                 variant="primary"
                 fullWidth
                 icon={<MapPin className="w-4 h-4" />}
                 className="shadow-sm"
               >
                 ค้นหาแผนที่ห้องสอบ
               </Button>
            )}

            {/* View Image Button */}
            {(specialStatus !== 'outside-schedule') && onViewMap && (
               <Button 
                 onClick={onViewMap}
                 variant="secondary"
                 fullWidth
                 icon={<ImageIcon className="w-4 h-4" />}
               >
                 ดูแผนผังห้องสอบ (รูปภาพ)
               </Button>
            )}
        </div>

      </div>

      {/* RIGHT: Map Preview */}
      <div className="md:w-[62%] h-48 sm:h-64 md:h-auto bg-slate-50 dark:bg-slate-950 relative min-h-[180px] sm:min-h-[280px]">
        {config ? (
          <div className="w-full h-full relative">
            <SeatMap config={config} targetSeat={data.seat} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 p-6 text-center">
            <div className="mb-2 text-4xl opacity-40 select-none">🗺️</div>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">ไม่มีผังแบบจำลอง</span>
            <span className="text-xxs text-slate-400 dark:text-slate-500 mt-1.5 font-semibold max-w-[200px] leading-relaxed">
              {specialStatus ? "จัดสอบนอกตารางหรือกักตัวสอบ" : "ไม่ได้ระบุโครงสร้างผังที่นั่ง"}
            </span>
          </div>
        )}
      </div>

    </Card>
  );
};
