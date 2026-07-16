// src/components/search/SearchHistory.tsx
import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, Trash2 } from '../icons';

export interface SearchHistoryItem {
  studentId: string;
  roundId: string;
  roundLabel: string;
}

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
  onRemove: (id: string, roundId: string, e: React.MouseEvent) => void;
  onClearAll: (e: React.MouseEvent) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  if (history.length === 0) return null;

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-xl shadow-xl dark:shadow-none overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
          ประวัติการค้นหาล่าสุด
        </span>
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer outline-none hover:underline"
        >
          ล้างทั้งหมด
        </button>
      </div>
      {/* Scrollable list */}
      <div className="max-h-64 overflow-y-auto">
        {history.map((item, idx) => (
          <div
            key={`${item.studentId}-${item.roundId}-${idx}`}
            onClick={() => onSelect(item)}
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/40 cursor-pointer group flex items-center justify-between transition-colors last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Clock/history icon */}
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              {/* Student ID */}
              <span className="font-mono text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider">
                {item.studentId}
              </span>
              {/* Round badge */}
              <Badge variant="blue" size="sm" className="truncate max-w-[150px] md:max-w-[180px] font-extrabold">
                {item.roundLabel}
              </Badge>
            </div>
            {/* Delete button */}
            <button
              onClick={(e) => onRemove(item.studentId, item.roundId, e)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/50 hover:text-rose-500 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none"
              title="ลบรายการนี้"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};
