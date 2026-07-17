// src/components/room/SeatMap.tsx
import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import type { RoomConfig, LayoutItem, ExamResult } from '../../types';
import { parseSeat, formatBranch } from '../../utils';
import { SEAT_PALETTE } from '../../lib/constants';
import { Plus, Minus, Maximize2, Info } from '../icons';
import type { SeatDisplayPrefs, SeatField } from '../../hooks/useExplorerPrefs';

function resolveField(exam: ExamResult, field: SeatField): string {
  switch (field) {
    case 'seat':
      return exam.seat;
    case 'subject':
      return exam.subject;
    case 'subject_name':
      return exam.subject_name ?? exam.subject;
    case 'student_id':
      const id = (exam.student_id || '').replace(/[^0-9]/g, '');
      return id.length >= 6 ? `${id.slice(0, 2)}..${id.slice(-4, -1)}-${id.slice(-1)}` : (exam.student_id || '');
    case 'branch':
      return (exam.branch ?? '').replace(/^[A-Za-z]{2}-/, '').trim().toUpperCase();
    case 'section':
      return exam.section;
    case 'sheet':
      return exam.sheet;
    case 'none':
    default:
      return '';
  }
}

interface Props {
  config: RoomConfig;
  targetSeat?: string;
  occupied?: Record<string, ExamResult>;
  onSeatClick?: (seat: string, data?: ExamResult) => void;
  highlightedSubject?: string;
  seatDisplayPrefs?: SeatDisplayPrefs;
}

export const SeatMap: React.FC<Props> = ({ config, targetSeat, occupied = {}, onSeatClick, highlightedSubject, seatDisplayPrefs }) => {
  const prefs = seatDisplayPrefs || { line1: 'seat', line2: 'subject' };
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  
  const target = targetSeat ? parseSeat(targetSeat) : { char: '', num: -1 };
  const globalCounters: Record<string, number> = {};
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Transform & Interaction State
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  // --- 1. MEMOIZE COLORS ---
  const subjectMap = useMemo(() => {
    const map: Record<string, { color: typeof SEAT_PALETTE[0], name: string }> = {};
    const entries = Object.values(occupied);
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
  }, [occupied]);

  // --- 2. ENGINE ---
  const updateTransform = () => {
    if (contentRef.current) {
      const { x, y, k } = transform.current;
      contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
    }
  };

  // --- 3. INPUT HANDLERS (Mouse/Touch) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
        e.preventDefault(); e.stopPropagation();
        const ZOOM_SPEED = 0.001;
        const currentK = transform.current.k;
        let newK = Math.min(Math.max(currentK - (e.deltaY * ZOOM_SPEED * currentK), 0.2), 4.0);
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleRatio = newK / currentK;
        
        transform.current.x = mouseX - (mouseX - transform.current.x) * scaleRatio;
        transform.current.y = mouseY - (mouseY - transform.current.y) * scaleRatio;
        transform.current.k = newK;
        
        updateTransform();
        setZoomLevel(newK);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    transform.current.x += dx;
    transform.current.y += dy;
    lastPos.current = { x: e.clientX, y: e.clientY };
    updateTransform();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        transform.current.x += dx;
        transform.current.y += dy;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateTransform();
    } else if (e.touches.length === 2) {
        const newDist = getDistance(e.touches[0], e.touches[1]);
        if (lastTouchDistance.current) {
            const scaleFactor = newDist / lastTouchDistance.current;
            const currentK = transform.current.k;
            let newK = Math.min(Math.max(currentK * scaleFactor, 0.2), 4.0);

            const rect = containerRef.current!.getBoundingClientRect();
            const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

            const ratio = newK / currentK;
            transform.current.x = centerX - (centerX - transform.current.x) * ratio;
            transform.current.y = centerY - (centerY - transform.current.y) * ratio;
            transform.current.k = newK;

            updateTransform();
            setZoomLevel(newK);
        }
        lastTouchDistance.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastTouchDistance.current = null;
  };

  // --- 4. CENTERING LOGIC ---
  const centerTarget = (animate = true) => {
    if (!containerRef.current) return; 
    let targetX = 0, targetY = 0;
    
    if (targetRef.current) {
        targetX = targetRef.current.offsetLeft + targetRef.current.offsetWidth / 2;
        targetY = targetRef.current.offsetTop + targetRef.current.offsetHeight / 2;
    } else if (contentRef.current) {
        targetX = contentRef.current.scrollWidth / 2;
        targetY = contentRef.current.scrollHeight / 2;
    }

    const container = containerRef.current.getBoundingClientRect();
    const centerX = (container.width / 2) - targetX;
    const centerY = (container.height / 2) - targetY;

    transform.current = { x: centerX, y: centerY, k: 1 };
    
    if (contentRef.current) {
        contentRef.current.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        updateTransform();
        setTimeout(() => { if (contentRef.current) contentRef.current.style.transition = ''; }, 500);
    }
    setZoomLevel(1);
  };

  useLayoutEffect(() => { if (targetSeat) setTimeout(() => centerTarget(true), 50); }, [targetSeat]);

  // --- 5. RENDER HELPER ---
  const renderItem = (item: LayoutItem, colIndex: number, itemIndex: number) => {
    if (item.type === 'seats') {
      let numbers: number[] = [];
      if (item.manual) {
        numbers.push(...item.manual);
        if (item.inverse) numbers.reverse();
      } else {
        const start = item.start ?? (globalCounters[item.char] || 1);
        const count = item.count || 0;
        const step = item.step ?? (item.inverse ? -1 : 1);
        let current = start;
        for (let i = 0; i < count; i++) {
          numbers.push(current);
          current += step;
        }
        globalCounters[item.char] = current; 
      }

      return (
        <React.Fragment key={`${colIndex}-${itemIndex}`}>
          {numbers.map((num) => {
            const seatId = `${item.char}${num}`;
            const isTarget = item.char === target.char && num === target.num;
            const studentData = occupied[seatId];
            const isOccupied = !!studentData;

            let colorClass = "bg-white dark:bg-slate-900 text-gray-300 dark:text-slate-700 border-slate-200 dark:border-slate-800/80"; 
            let subjectInfo = null;
            
            if (isOccupied) {
                subjectInfo = subjectMap[studentData.subject];
                const theme = subjectInfo?.color || SEAT_PALETTE[0];
                
                if (isTarget) {
                    colorClass = "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-450 dark:ring-rose-950 z-20 animate-radar";
                } else {
                    colorClass = `${theme.bg} ${theme.text} ${theme.border}`;
                }
            } else if (isTarget) {
                 colorClass = "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-450 dark:ring-rose-950 z-20 animate-radar";
            }

            let interactiveClass = "hover:scale-105 hover:shadow-sm cursor-pointer transition-all duration-200";
            if (highlightedSubject) {
              const matches = isOccupied && studentData.subject === highlightedSubject;
              if (matches) {
                interactiveClass += " scale-105 z-10 shadow-md ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-950 saturate-100";
              } else if (isTarget) {
                interactiveClass += " scale-105 z-20 shadow-lg saturate-100";
              } else {
                interactiveClass += " opacity-20 scale-95 saturate-50 blur-[0.2px] hover:opacity-60 hover:scale-100";
              }
            }

            const tooltip = studentData 
              ? `${seatId}: ${studentData.student_id}\n${studentData.subject} - ${subjectInfo?.name || ''}` 
              : seatId;

            const line1Text = isOccupied ? resolveField(studentData, prefs.line1) : seatId;
            const line2Text = isOccupied && prefs.line2 !== 'none' ? resolveField(studentData, prefs.line2) : '';

            const isLine1Long = line1Text.length >= 8;
            const line1SizeClass = isLine1Long ? 'text-[9px] tracking-tighter font-sans' : 'text-[10px]';

            const isLine2Long = line2Text.length >= 8;
            const line2SizeClass = isLine2Long ? 'text-[8px] tracking-tighter font-sans' : 'text-[9px]';

            return (
              <div
                key={seatId}
                ref={isTarget ? targetRef : undefined}
                title={tooltip}
                onClick={(e) => { e.stopPropagation(); if (onSeatClick) onSeatClick(seatId, studentData); }}
                className={`flex flex-col items-center justify-center rounded border flex-shrink-0 font-bold ${colorClass} ${interactiveClass}`}
                style={{ width: '42px', height: '34px' }}
              >
                <span className={`${line1SizeClass} leading-none font-bold truncate max-w-[38px]`}>
                  {line1Text}
                </span>
                {line2Text && (
                  <span className={`${line2SizeClass} leading-none mt-0.5 truncate max-w-[38px] opacity-70`}>
                    {line2Text}
                  </span>
                )}
              </div>
            );
          })}
        </React.Fragment>
      );
    }
    
    // Obstruction/Gap rendering
    if (item.type === 'obstruction') {
        const height = item.height || (item.count ? (item.count * 40) - 6 : 34);
        const width = item.width ? `${item.width}px` : '42px';
        if (item.transparent) return <div key={`${colIndex}-${itemIndex}`} style={{ height, width, flexShrink: 0 }} />;
        return (
          <div key={`${colIndex}-${itemIndex}`} className="rounded flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-900/60 pattern-stripes writing-vertical shrink-0 font-bold" style={{ height, width }}>
            <span className="uppercase tracking-widest leading-none">{item.label}</span>
          </div>
        );
      }

      if (item.type === 'gap') {
        return <div key={`${colIndex}-${itemIndex}`} style={{ height: item.count ? (item.count * 40) - 6 : 34, flexShrink: 0 }} className="w-full" />;
      }
      return null;
  };

  return (
    <div className="relative h-full flex flex-col border border-slate-200/50 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden select-none touch-none transition-colors">
      
      {/* MAP VIEWPORT */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-950 z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={contentRef} className="absolute top-0 left-0 w-max origin-top-left will-change-transform">
            <div className="p-20 md:p-40"> 
                <div className="w-full text-center text-xs font-bold text-slate-300 dark:text-slate-700 uppercase mb-4 tracking-[0.5em]">{config.frontLabel || "Front"}</div>
                <div className="flex items-start gap-1.5 mx-auto">
                    {config.layout.map((block, i) => {
                        if (block.type === 'aisle') return <div key={`aisle-${i}`} style={{ width: block.width }} className="shrink-0 h-1" />;
                        if (block.type === 'column') {
                            return (
                                <div key={`col-${i}`} className="flex flex-col gap-1.5 shrink-0">
                                    <div className="text-xs font-bold text-slate-400 dark:text-slate-655 text-center h-3 flex items-end justify-center leading-none">{block.label || ''}</div>
                                    {block.items.map((item, j) => renderItem(item, i, j))}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                 <div className="w-full text-center text-xs font-bold text-slate-300 dark:text-slate-700 uppercase mt-4 tracking-[0.5em]">{config.backLabel || "Back"}</div>
            </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-20 md:bottom-6 right-6 flex flex-col gap-2 z-10">
        <button onClick={() => { transform.current.k = Math.min(transform.current.k + 0.5, 4); updateTransform(); setZoomLevel(transform.current.k); }} className="w-11 h-11 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full shadow-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-xl active:bg-slate-100 dark:active:bg-slate-700 cursor-pointer transition-all active:scale-95">+</button>
        <button onClick={() => centerTarget(true)} className="w-11 h-11 bg-indigo-600 border border-indigo-700 rounded-full shadow-lg text-white font-bold hover:bg-indigo-700 flex items-center justify-center active:bg-indigo-800 cursor-pointer transition-all active:scale-95">
            <Maximize2 className="h-4.5 w-4.5" />
        </button>
        <button onClick={() => { transform.current.k = Math.max(transform.current.k - 0.5, 0.2); updateTransform(); setZoomLevel(transform.current.k); }} className="w-11 h-11 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-full shadow-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-xl active:bg-slate-100 dark:active:bg-slate-700 cursor-pointer transition-all active:scale-95">-</button>
      </div>
      
      {/* LEGEND (Floating desktop legend) */}
      {Object.keys(subjectMap).length !== 0 &&
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200/50 dark:border-slate-800 rounded-xl p-3.5 text-xs shadow-lg max-h-60 overflow-y-auto max-w-[220px] hidden sm:block z-10 transition-all">
          <div className="font-extrabold text-slate-400 dark:text-slate-500 mb-2.5 uppercase text-xs tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Subjects</span>
          </div>
          
          {Object.entries(subjectMap).map(([subj, info]) => (
              <div key={subj} className="flex items-start gap-2.5 mb-2 last:mb-0">
                  <div className={`w-3.5 h-3.5 rounded-lg ${info.color.bg} ${info.color.border} border flex-shrink-0 mt-0.5`}></div>
                  <div className="flex flex-col leading-tight min-w-0">
                      <span className="text-slate-800 dark:text-slate-200 font-bold font-mono text-xs">{subj}</span>
                      {info.name && <span className="text-slate-400 dark:text-slate-500 text-xs truncate max-w-[140px] font-semibold mt-0.5">{info.name}</span>}
                  </div>
              </div>
          ))}
      </div>}
    </div>
  );
};
