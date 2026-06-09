import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import type { RoomConfig, LayoutItem, ExamResult } from '../types';
import { parseSeat } from '../utils';

// --- COLOR PALETTE (Responsive light/dark mode) ---
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

interface Props {
  config: RoomConfig;
  targetSeat?: string;
  occupied?: Record<string, ExamResult>;
  onSeatClick?: (seat: string, data?: ExamResult) => void;
  highlightedSubject?: string;
}

export const SeatMap: React.FC<Props> = ({ config, targetSeat, occupied = {}, onSeatClick, highlightedSubject }) => {
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
    const map: Record<string, { color: typeof PALETTE[0], name: string }> = {};
    const entries = Object.values(occupied);
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

            let colorClass = "bg-white dark:bg-slate-900 text-gray-300 dark:text-slate-600 border-gray-200 dark:border-slate-800"; 
            let subjectInfo = null;
            
            if (isOccupied) {
                subjectInfo = subjectMap[studentData.subject];
                const theme = subjectInfo?.color || PALETTE[0];
                
                if (isTarget) {
                    colorClass = "bg-red-600 text-white border-red-700 shadow-lg ring-2 ring-red-400 dark:ring-red-950 z-20";
                } else {
                    colorClass = `${theme.bg} ${theme.text} ${theme.border}`;
                }
            } else if (isTarget) {
                 colorClass = "bg-red-600 text-white border-red-700 shadow-lg ring-2 ring-red-400 dark:ring-red-950 z-20";
            }

            let interactiveClass = "hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200";
            if (highlightedSubject) {
              const matches = isOccupied && studentData.subject === highlightedSubject;
              if (matches) {
                interactiveClass += " scale-105 z-10 shadow-md ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 saturate-100";
              } else if (isTarget) {
                interactiveClass += " scale-105 z-20 shadow-lg saturate-100";
              } else {
                interactiveClass += " opacity-20 scale-95 saturate-50 blur-[0.2px] hover:opacity-60 hover:scale-100";
              }
            }

            const tooltip = studentData 
              ? `${seatId}: ${studentData.student_id}\n${studentData.subject} - ${subjectInfo?.name || ''}` 
              : seatId;

            return (
              <div
                key={seatId}
                ref={isTarget ? targetRef : undefined}
                title={tooltip}
                onClick={(e) => { e.stopPropagation(); if (onSeatClick) onSeatClick(seatId, studentData); }}
                className={`flex flex-col items-center justify-center rounded border flex-shrink-0 ${colorClass} ${interactiveClass}`}
                style={{ width: '42px', height: '34px' }}
              >
                <span className={`text-[9px] leading-none font-bold ${isOccupied ? 'opacity-70' : ''}`}>{seatId}</span>
                {isOccupied && <span className="text-[9px] font-bold leading-none mt-0.5 truncate max-w-[38px]">{studentData.subject}</span>}
              </div>
            );
          })}
        </React.Fragment>
      );
    }
    
    // ... (Obstruction/Gap rendering)
    if (item.type === 'obstruction') {
        const height = item.height || (item.count ? (item.count * 40) - 6 : 34);
        const width = item.width ? `${item.width}px` : '42px';
        if (item.transparent) return <div key={`${colIndex}-${itemIndex}`} style={{ height, width, flexShrink: 0 }} />;
        return (
          <div key={`${colIndex}-${itemIndex}`} className="rounded flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-400 border border-gray-300 dark:border-slate-800 bg-gray-200 dark:bg-slate-900/60 pattern-stripes writing-vertical shrink-0" style={{ height, width }}>
            <span className="uppercase tracking-widest">{item.label}</span>
          </div>
        );
      }

      if (item.type === 'gap') {
        return <div key={`${colIndex}-${itemIndex}`} style={{ height: item.count ? (item.count * 40) - 6 : 34, flexShrink: 0 }} className="w-full" />;
      }
      return null;
  };

  return (
    <div className="relative h-full flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-950 overflow-hidden select-none touch-none transition-colors">
      
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
                <div className="w-full text-center text-xs font-bold text-gray-300 dark:text-slate-700 uppercase mb-4 tracking-[0.5em]">{config.frontLabel || "Front"}</div>
                <div className="flex items-start gap-1.5 mx-auto">
                    {config.layout.map((block, i) => {
                        if (block.type === 'aisle') return <div key={`aisle-${i}`} style={{ width: block.width }} className="shrink-0 h-1" />;
                        if (block.type === 'column') {
                            return (
                                <div key={`col-${i}`} className="flex flex-col gap-1.5 shrink-0">
                                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-600 text-center h-3 flex items-end justify-center">{block.label || ''}</div>
                                    {block.items.map((item, j) => renderItem(item, i, j))}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                 <div className="w-full text-center text-xs font-bold text-gray-300 dark:text-slate-700 uppercase mt-4 tracking-[0.5em]">{config.backLabel || "Back"}</div>
            </div>
        </div>
      </div>

      {/* CONTROLS (Lower Z-Index to allow sidebar to cover) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button onClick={() => { transform.current.k = Math.min(transform.current.k + 0.5, 4); updateTransform(); setZoomLevel(transform.current.k); }} className="w-12 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full shadow-xl dark:shadow-none text-gray-600 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center text-2xl active:bg-gray-100 dark:active:bg-slate-700 cursor-pointer transition-colors">+</button>
        <button onClick={() => centerTarget(true)} className="w-12 h-12 bg-blue-600 border border-blue-700 rounded-full shadow-xl text-white font-bold hover:bg-blue-700 flex items-center justify-center active:bg-blue-800 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
        <button onClick={() => { transform.current.k = Math.max(transform.current.k - 0.5, 0.2); updateTransform(); setZoomLevel(transform.current.k); }} className="w-12 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full shadow-xl dark:shadow-none text-gray-600 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center text-2xl active:bg-gray-100 dark:active:bg-slate-700 cursor-pointer transition-colors">-</button>
      </div>
      
      {/* LEGEND (Moved to LEFT, Z-Index reduced) */}
      {Object.keys(subjectMap).length !== 0 &&
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded p-3 text-xs shadow-lg dark:shadow-none max-h-60 overflow-y-auto max-w-[220px] hidden sm:block z-10 transition-colors">
          <div className="font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">Subjects</div>
          
          {Object.entries(subjectMap).map(([subj, info]) => (
              <div key={subj} className="flex items-start gap-2 mb-2 last:mb-0">
                  <div className={`w-3 h-3 rounded ${info.color.bg} ${info.color.border} border flex-shrink-0 mt-0.5`}></div>
                  <div className="flex flex-col leading-tight">
                      <span className="text-gray-900 dark:text-slate-200 font-bold font-mono text-[10px]">{subj}</span>
                      {info.name && <span className="text-gray-500 dark:text-slate-400 text-[10px] truncate max-w-[160px]">{info.name}</span>}
                  </div>
              </div>
          ))}
      </div>}
    </div>
  );
};