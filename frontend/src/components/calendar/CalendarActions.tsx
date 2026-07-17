import React, { useState } from 'react';
import { CalendarHelper } from './CalendarHelper';
import { Button } from '../ui/Button';
import { 
  Calendar as CalendarIcon, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  HelpCircle,
  ChevronDown
} from '../icons';

interface CalendarActionsProps {
  studentId: string;
}

export const CalendarActions: React.FC<CalendarActionsProps> = ({ studentId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const handleDownloadICal = () => {
    if (!studentId) return;
    window.open(`/api/calendar/${studentId}.ics`, '_blank');
  };

  const handleSubscribeCalendar = () => {
    if (!studentId) return;
    const host = window.location.host;
    const webcalUrl = `webcal://${host}/api/calendar/${studentId}.ics`;
    window.location.href = webcalUrl;
  };

  const handleCopyFeed = () => {
    if (!studentId) return;
    const url = `${window.location.protocol}//${window.location.host}/api/calendar/${studentId}.ics`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2000);
    });
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/40 w-full animate-in fade-in duration-200">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 text-slate-700 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.99] select-none shadow-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>เพิ่มตารางสอบลงปฏิทิน</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-350 ease-out ${
            isExpanded ? 'rotate-180 text-slate-700 dark:text-slate-300' : ''
          }`} 
        />
      </button>

      {/* Accordion Content Container */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'grid-rows-[1fr] opacity-100 mt-5' 
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
        style={{ visibility: isExpanded ? 'visible' : 'hidden' }}
      >
        <div className="overflow-hidden">
          {/* Title block with benefit explainer */}
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center justify-center gap-1.5 leading-none mb-1">
              <CalendarIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              เพิ่มตารางสอบลงปฏิทินมือถือ
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              วิชาสอบจะแจ้งเตือนและอัปเดตอัตโนมัติในปฏิทินโทรศัพท์ของคุณ
            </p>
          </div>

          {/* Primary Connect CTA */}
          <div className="mb-3">
            <button
              onClick={handleSubscribeCalendar}
              className="w-full flex items-center justify-center font-bold bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white border-none shadow-sm text-xs py-2.5 rounded-xl transition-all duration-200 cursor-pointer gap-2 active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4 text-white" />
              <span>เพิ่มลงปฏิทินอัตโนมัติ</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <Button
              onClick={handleCopyFeed}
              variant="secondary"
              size="sm"
              icon={copiedFeed ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
              className={`h-9 font-bold text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-none ${
                copiedFeed ? '!bg-emerald-50/40 dark:!bg-emerald-950/10 !border-emerald-100 dark:!border-emerald-900/50 !text-emerald-600 dark:!text-emerald-400' : ''
              }`}
            >
              {copiedFeed ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์ปฏิทิน'}
            </Button>

            <Button
              onClick={handleDownloadICal}
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
              className="h-9 font-bold text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-none"
            >
              ดาวน์โหลดไฟล์ปฏิทิน
            </Button>
          </div>

          {/* Tutorial help trigger */}
          <div className="text-center">
            <button
              onClick={() => setIsHelperOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline outline-none cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              ไม่แน่ใจวิธีใช้? ดูวิธีตั้งค่าและคู่มือการใช้งาน
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Helper Modal */}
      <CalendarHelper
        isOpen={isHelperOpen}
        onClose={() => setIsHelperOpen(false)}
        studentId={studentId}
        onSubscribe={handleSubscribeCalendar}
        onDownload={handleDownloadICal}
      />
    </div>
  );
};
