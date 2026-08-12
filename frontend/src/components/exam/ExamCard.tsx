// src/components/exam/ExamCard.tsx
import React, { useMemo } from 'react';
import type { ExamResult, RoomConfigMap } from '../../types';
import { SeatMap } from '../room/SeatMap';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Calendar as CalendarIcon, Clock, MapPin, Image as ImageIcon, AlertTriangle, Building, Hash } from '../icons';

interface Props {
  data: ExamResult;
  configMap: RoomConfigMap;
  subjectName?: string;
  onViewMap?: () => void;
  onJumpToExplorer?: () => void;
  isPassed?: boolean;
}

const isPendingText = (val?: string): boolean => {
  if (!val) return true;
  const v = val.trim().toLowerCase();
  return (
    v === '' ||
    v === '-' ||
    v.includes('แจ้ง') || // Catches "แจ้งก่อนวันสอบ", "แจ้งวันก่อนสอบ", "แจ้งหน้าห้องสอบ", etc.
    v.includes('รอกำหนด') ||
    v.includes('ไม่ระบุ') ||
    v.includes('tba')
  );
};

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
    if (data.room && data.room.includes('สอบนอกตาราง')) return 'outside-schedule';
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
      } catch {
        // A room key can be literal text rather than a valid regular expression.
      }
    }
    return null;
  }, [data.room, configMap]);

  // Pending & Layout Validity logic
  const isRoomPending = useMemo(() => isPendingText(data.room), [data.room]);
  const isSeatPending = useMemo(() => isPendingText(data.seat), [data.seat]);
  const isMultiRoom = useMemo(() => Boolean(data.room && data.room.includes(',')), [data.room]);

  // Layout is invalid/unmapped if room or seat is pending, or multi-room, or no config map exists
  const isLayoutInvalid = isRoomPending || isSeatPending || isMultiRoom || !config;

  const canShowExplorerBtn = !isLayoutInvalid && specialStatus !== 'outside-schedule' && Boolean(onJumpToExplorer);
  const canShowViewMapBtn = !isLayoutInvalid && specialStatus !== 'outside-schedule' && Boolean(onViewMap);

  // Premium Border Themes
  const cardBorder = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'rose' as const;
    if (specialStatus === 'quarantine') return 'amber' as const;
    if (specialStatus === 'outside-schedule') return 'sky' as const;
    return 'default' as const;
  }, [specialStatus]);

  const detailBg = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'bg-rose-50/30 dark:bg-rose-950/20';
    if (specialStatus === 'quarantine') return 'bg-amber-50/30 dark:bg-amber-950/20';
    if (specialStatus === 'outside-schedule') return 'bg-sky-50/30 dark:bg-sky-950/20';
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
      className={`flex flex-col md:flex-row shadow-md shadow-emerald-950/[0.035] dark:shadow-none hover:shadow-lg hover:shadow-emerald-950/[0.06] dark:hover:shadow-none transition-all duration-200 w-full ${
        isPassed ? 'opacity-40 filter grayscale pointer-events-none shadow-none hover:shadow-none hover:translate-y-0' : ''
      }`}
    >
      {/* LEFT: Details Panel */}
      <div className={`p-6 md:w-[38%] flex flex-col border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/60 ${detailBg} z-10`}>
        
        {/* Course Code & Name */}
        <div className="mb-5">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 leading-none">รายวิชา (Subject)</span>
                <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-snug break-words" title={subjectName || data.subject}>
                    {subjectName || data.subject}
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span>{data.subject}</span>
                  {data.section && (
                    <>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-300 font-sans text-xs font-extrabold">Sec.{data.section}</span>
                    </>
                  )}
                </div>
                {data.labels?.filter(Boolean).length ? (
                  <div className="mt-3 flex flex-wrap gap-2" aria-label="ประเภทการสอบ">
                    {data.labels.filter(Boolean).map((label) => (
                      <Badge key={label} variant="navy" size="md" className="font-black tracking-wide">
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
             {statusLabel && (
                <Badge variant={statusBadgeColor} size="md" className="font-black">
                   {statusLabel}
                </Badge>
             )}
          </div>
        </div>

        {/* Date/Time Block */}
        <div className="grid grid-cols-1 gap-2.5 mb-5">
            <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-teal-600 dark:text-teal-400 shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider leading-none mb-1">วันที่ (Date)</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap block">{data.date}</span>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-teal-600 dark:text-teal-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider leading-none mb-1">เวลา (Time)</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap block font-mono">{data.time}</span>
                </div>
            </div>
        </div>

        {/* Separate Room & Seat Blocks (Stacked 2-Line Layout) */}
        <div className="flex flex-col gap-2.5 mb-4">
          {/* Room Container - Line 1 Header, Line 2 Value */}
          <div className="bg-slate-100/90 dark:bg-slate-800/90 p-3.5 rounded-xl border border-slate-250 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 dark:hover:border-slate-600 relative overflow-hidden flex flex-col gap-1.5 transition-all shadow-xs dark:shadow-none min-w-0">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500 dark:bg-slate-400"></div>
            <div className="flex items-center gap-2 pl-2">
              <Building className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">ห้องสอบ (Room)</span>
            </div>
            <div className="pl-2 pr-1">
              <span
                className={`font-mono block break-words whitespace-normal text-slate-900 dark:text-white ${
                  (data.room || '').length > 12
                    ? 'text-xs sm:text-sm font-bold leading-snug'
                    : 'text-base sm:text-lg font-black leading-snug'
                }`}
              >
                {data.room || '-'}
              </span>
            </div>
          </div>

          {/* Seat Container - Line 1 Header, Line 2 Value */}
          <div className="bg-teal-50 dark:bg-teal-950/70 p-3.5 rounded-xl border border-teal-200 dark:border-teal-800/80 hover:bg-teal-100/60 dark:hover:bg-teal-950 dark:hover:border-teal-700 relative overflow-hidden flex flex-col gap-1.5 transition-all shadow-xs dark:shadow-none min-w-0">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600 dark:bg-teal-400"></div>
            <div className="flex items-center gap-2 pl-2">
              <Hash className="w-4 h-4 text-teal-700 dark:text-teal-300 shrink-0" />
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">ที่นั่ง (Seat)</span>
            </div>
            <div className="pl-2 pr-1">
              <span
                className={`font-mono block break-words whitespace-normal text-teal-700 dark:text-teal-200 ${
                  (data.seat || '').length > 8
                    ? 'text-xs sm:text-sm font-bold leading-snug'
                    : 'text-xl sm:text-2xl font-black leading-snug'
                }`}
              >
                {data.seat || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width Amber Notice Banner (Notes & Special Instructions) */}
        {data.note && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/30 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-amber-600 dark:text-amber-400 leading-none mb-1">
                หมายเหตุ / ข้อปฏิบัติ
              </span>
              <p className="text-xs font-bold leading-relaxed break-words">
                {data.note}
              </p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-auto space-y-2">
            {/* Jump to Explorer Button */}
            {canShowExplorerBtn && (
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
            {canShowViewMapBtn && (
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
        {config && !isLayoutInvalid ? (
          <div className="w-full h-full relative">
            <SeatMap config={config} targetSeat={data.seat} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-6 text-center">
            <div className="mb-2 text-4xl opacity-50 select-none">🗺️</div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">ไม่มีผังแบบจำลอง</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-semibold max-w-[220px] leading-relaxed">
              {specialStatus
                ? "จัดสอบนอกตารางหรือกักตัวสอบ"
                  : "ไม่ได้ระบุโครงสร้างผังที่นั่ง"}
            </span>
          </div>
        )}
      </div>

    </Card>
  );
};
