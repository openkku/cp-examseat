import React from 'react';

export interface SearchHistoryItem {
  studentId: string;
  roundId: string;
  roundLabel: string;
}

interface SearchHistoryDropdownProps {
  history: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
  onRemove: (id: string, roundId: string, e: React.MouseEvent) => void;
  onClearAll: (e: React.MouseEvent) => void;
}

export const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
  history,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 rounded-xl shadow-xl dark:shadow-none overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          ประวัติการค้นหาล่าสุด
        </span>
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 dark:hover:text-rose-405 hover:underline transition-colors cursor-pointer"
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
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-850 border-b border-slate-100 dark:border-slate-850/60 cursor-pointer group flex items-center justify-between transition-colors last:border-0"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Clock/history icon */}
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {/* Student ID */}
              <span className="font-mono text-sm font-semibold text-slate-705 dark:text-slate-200 tracking-wider">
                {item.studentId}
              </span>
              {/* Round pill badge */}
              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-400 truncate max-w-[150px] md:max-w-[180px]">
                {item.roundLabel}
              </span>
            </div>
            {/* Delete button */}
            <button
              onClick={(e) => onRemove(item.studentId, item.roundId, e)}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-rose-500 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="ลบรายการนี้"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
