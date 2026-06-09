import React, { useMemo } from 'react';
import type { ExamResult, RoomConfigMap } from '../types';
import { SeatMap } from './SeatMap';

interface Props {
  data: ExamResult;
  configMap: RoomConfigMap;
  subjectName?: string;
  onViewMap?: () => void;
  onJumpToExplorer?: () => void;
}

export const ExamCard: React.FC<Props> = ({ 
  data, 
  configMap, 
  subjectName, 
  onViewMap, 
  onJumpToExplorer 
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
    if (specialStatus === 'no-eligibility') return 'border-rose-200 dark:border-rose-950/85 shadow-rose-100/30 dark:shadow-none';
    if (specialStatus === 'quarantine') return 'border-amber-200 dark:border-amber-950/85 shadow-amber-100/30 dark:shadow-none';
    if (specialStatus === 'outside-schedule') return 'border-sky-200 dark:border-sky-950/85 shadow-sky-100/30 dark:shadow-none';
    return 'border-slate-100 dark:border-slate-800/80 shadow-slate-100/30 dark:shadow-none';
  }, [specialStatus]);

  const detailBg = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'bg-rose-50/50 dark:bg-rose-950/10';
    if (specialStatus === 'quarantine') return 'bg-amber-50/50 dark:bg-amber-950/10';
    if (specialStatus === 'outside-schedule') return 'bg-sky-50/50 dark:bg-sky-950/10';
    return 'bg-white dark:bg-slate-900';
  }, [specialStatus]);

  const statusLabel = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'ไม่มีสิทธิ์สอบ';
    if (specialStatus === 'quarantine') return 'กักตัวสอบ';
    if (specialStatus === 'outside-schedule') return 'สอบนอกตาราง';
    return null;
  }, [specialStatus]);

  const statusBadgeColor = useMemo(() => {
    if (specialStatus === 'no-eligibility') return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/80';
    if (specialStatus === 'quarantine') return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80';
    if (specialStatus === 'outside-schedule') return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/80';
    return '';
  }, [specialStatus]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none overflow-hidden border ${cardBorder} flex flex-col md:flex-row transition-all duration-300 hover:shadow-2xl dark:hover:shadow-none`}>
      
      {/* LEFT: Details Panel */}
      <div className={`p-6 md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/60 ${detailBg} z-10`}>
        
        {/* Course Code & Name */}
        <div className="mb-5">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block mb-1">รายวิชา (Subject)</span>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                    {subjectName || data.subject}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span>{data.subject}</span>
                  {data.section && (
                    <>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-sans text-[10px]">Sec.{data.section}</span>
                    </>
                  )}
                </div>
             </div>
             {statusLabel && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shadow-sm ${statusBadgeColor}`}>
                     {statusLabel}
                  </span>
             )}
          </div>
        </div>

        {/* Date/Time Block */}
        <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <div className="text-blue-500 dark:text-blue-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase block tracking-wider leading-none mb-0.5">วันที่ (Date)</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{data.date}</span>
                </div>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <div className="text-blue-500 dark:text-blue-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase block tracking-wider leading-none mb-0.5">เวลา (Time)</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{data.time}</span>
                </div>
            </div>
        </div>

        {/* Room & Seat Block */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/60 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/80 relative overflow-hidden mb-6 shadow-inner dark:shadow-none">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-sky-500"></div>
            
            <div className="flex justify-between items-end mb-1 px-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">ห้องสอบ (Room)</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">ที่นั่ง (Seat)</span>
            </div>
            <div className="flex justify-between items-end px-1">
                 <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{data.room || "-"}</span>
                 <span className={`text-3xl font-black font-mono tracking-tighter ${specialStatus ? 'text-amber-500 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {data.seat || "-"}
                 </span>
            </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-auto space-y-2">
            {/* Jump to Explorer Button */}
            {(specialStatus !== 'outside-schedule') && onJumpToExplorer && (
               <button 
                 onClick={onJumpToExplorer}
                 className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl transition-all font-bold text-xs shadow-md shadow-blue-100 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 ค้นหาแผนที่ห้องสอบ
               </button>
            )}

            {/* View Image Button */}
            {(specialStatus !== 'outside-schedule') && onViewMap && (
               <button 
                 onClick={onViewMap}
                 className="w-full h-10 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-xs hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer shadow-sm dark:shadow-none"
               >
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                   <circle cx="8.5" cy="8.5" r="1.5"></circle>
                   <polyline points="21 15 16 10 5 21"></polyline>
                 </svg>
                 ดูแผนผังห้องสอบ (รูปภาพ)
               </button>
            )}
        </div>

      </div>

      {/* RIGHT: Map Preview */}
      <div className="md:w-2/3 h-64 md:h-auto bg-slate-50 dark:bg-slate-950 relative min-h-[280px]">
        {config ? (
          <div className="w-full h-full relative">
            <SeatMap config={config} targetSeat={data.seat} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 p-6 text-center">
            <div className="mb-2 text-4xl opacity-40">🗺️</div>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-400">ไม่มีผังแบบจำลอง</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
              {specialStatus ? "จัดสอบนอกตารางหรือกักตัวสอบ" : "ไม่ได้ระบุโครงสร้างผังที่นั่ง"}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};