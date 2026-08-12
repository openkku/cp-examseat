import React from 'react';
import { Card } from '../ui/Card';
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
      className="p-5 sm:p-6 w-full max-w-3xl mb-8 md:mb-10 border-slate-200/80 dark:border-slate-800 shadow-sm shadow-emerald-950/[0.035] dark:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-400 !overflow-visible"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-5">
        {/* Left Side: Avatar and ID */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-teal-600/25 shrink-0">
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
              className="font-bold px-3 py-1.5 text-xs tracking-wide bg-teal-50 dark:bg-teal-950/35 text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-900/50 rounded-xl inline-flex items-center shadow-none"
            >
              {formattedBranchName}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 px-3 py-2.5">
          <span className="block text-lg leading-none font-black text-sky-700 dark:text-sky-300">{examsCount}</span><span className="block mt-1 text-[10px] font-bold text-sky-700/70 dark:text-sky-300/70">รายวิชา</span>
        </div>
        <div className="rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 px-3 py-2.5">
          <span className="block text-lg leading-none font-black text-teal-700 dark:text-teal-300">{roomsCount}</span><span className="block mt-1 text-[10px] font-bold text-teal-700/70 dark:text-teal-300/70">ห้องสอบ</span>
        </div>
        <div className="rounded-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 px-3 py-2.5">
          <span className="block text-lg leading-none font-black text-orange-700 dark:text-orange-300">{daysCount}</span><span className="block mt-1 text-[10px] font-bold text-orange-700/70 dark:text-orange-300/70">วันสอบ</span>
        </div>
      </div>

      {/* Collapsible Calendar Actions */}
      <CalendarActions studentId={studentId} />
    </Card>
  );
};
