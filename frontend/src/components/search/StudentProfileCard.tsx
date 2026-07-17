import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatBranch } from '../../utils';
import { CalendarActions } from '../calendar/CalendarActions';

interface StudentProfileCardProps {
  studentId: string;
  branch: string;
  examsCount: number;
  roomsCount: number;
  daysCount: number;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  studentId,
  branch,
  examsCount,
  roomsCount,
  daysCount,
}) => {
  // Extract first 2 digits of the student ID as the avatar prefix (e.g. "68")
  const avatarText = studentId && studentId.length >= 2 ? studentId.slice(0, 2) : 'ST';
  const formattedBranchName = formatBranch(branch || '');

  return (
    <Card
      className="p-6 w-full max-w-3xl mb-8 md:mb-12 border-slate-200 dark:border-slate-800 shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-400 !overflow-visible"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6">
        {/* Left Side: Avatar and ID */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/10 shrink-0">
            {avatarText}
          </div>
          <div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block leading-none mb-1">
              รหัสนักศึกษา (Student ID)
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-wider">
              {studentId}
            </span>
          </div>
        </div>

        {/* Right Side: Major/Branch Badge */}
        {formattedBranchName && (
          <div className="sm:text-right shrink-0">
            <span
              className="font-bold px-3.5 py-1 text-xs tracking-wide bg-slate-100 dark:bg-indigo-500/15 text-slate-700 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/30 rounded-full inline-flex items-center shadow-none"
            >
              {formattedBranchName}
            </span>
          </div>
        )}
      </div>

      {/* Stats row (No emojis, soft pastel color boxes matching original blue theme) */}
      <div className="mt-2 flex flex-wrap gap-3">
        <div className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center">
          <span>{examsCount} รายวิชา</span>
        </div>
        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center">
          <span>{roomsCount} ห้องสอบ</span>
        </div>
        <div className="bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center">
          <span>{daysCount} วันสอบ</span>
        </div>
      </div>

      {/* Collapsible Calendar Actions */}
      <CalendarActions studentId={studentId} />
    </Card>
  );
};
