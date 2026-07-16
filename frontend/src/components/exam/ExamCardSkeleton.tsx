// src/components/exam/ExamCardSkeleton.tsx
import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export const ExamCardSkeleton: React.FC = () => {
  return (
    <Card className="flex flex-col md:flex-row h-auto w-full border-slate-200/50 dark:border-slate-800/80">
      {/* Left skeleton panel */}
      <div className="p-6 md:w-[38%] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900 z-10">
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" height={10} />
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="30%" height={12} />
        </div>
        
        <div className="grid grid-cols-1 gap-2.5">
          <Skeleton variant="rectangular" height={42} className="rounded-xl" />
          <Skeleton variant="rectangular" height={42} className="rounded-xl" />
        </div>
        
        <Skeleton variant="rectangular" height={60} className="rounded-xl w-full" />
        
        <div className="space-y-2 mt-auto">
          <Skeleton variant="rectangular" height={40} className="rounded-xl" />
          <Skeleton variant="rectangular" height={40} className="rounded-xl" />
        </div>
      </div>
      
      {/* Right skeleton panel */}
      <div className="md:w-[62%] h-48 sm:h-64 md:h-auto bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-center p-8 min-h-[180px] sm:min-h-[280px]">
        <Skeleton variant="rectangular" className="w-full h-full rounded-xl" />
      </div>
    </Card>
  );
};
