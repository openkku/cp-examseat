import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  X, 
  Check, 
  Copy, 
  Smartphone, 
  Monitor, 
  Info,
  Calendar as CalendarIcon
} from '../icons';

interface CalendarHelperProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSubscribe: () => void;
  onDownload: () => void;
}

type Platform = 'ios' | 'android' | 'desktop';

export const CalendarHelper: React.FC<CalendarHelperProps> = ({
  isOpen,
  onClose,
  studentId,
  onSubscribe,
  onDownload
}) => {
  const [activePlatform, setActivePlatform] = useState<Platform>('ios');
  const [copied, setCopied] = useState(false);

  // Platform auto-detection
  useEffect(() => {
    if (isOpen) {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua)) {
        setActivePlatform('ios');
      } else if (/Android/.test(ua)) {
        setActivePlatform('android');
      } else {
        setActivePlatform('desktop');
      }
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calendarUrl = `${window.location.protocol}//${window.location.host}/api/calendar/${studentId}.ics`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(calendarUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 relative z-10 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-100 leading-tight">
                วิธีเพิ่มตารางสอบลงปฏิทิน
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                อัปเดตอัตโนมัติเมื่อกำหนดการสอบมีการเปลี่ยนแปลง
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Benefit Box */}
          <Card borderVariant="sky" className="p-4 bg-sky-50/20 dark:bg-sky-950/10">
            <h3 className="text-xs font-black text-sky-850 dark:text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 leading-none">
              <Info className="w-3.5 h-3.5" />
              สมัครรับปฏิทินตารางสอบแล้วได้อะไรบ้าง?
            </h3>
            <ul className="text-xs space-y-1.5 font-bold text-slate-600 dark:text-slate-350">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> ตารางสอบแสดงบนหน้าจอมือถือของคุณทันที
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> แจ้งเตือนในแอปปฏิทินล่วงหน้าก่อนถึงเวลาสอบ
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> หากวิชาสอบเลื่อนวัน/เวลา ปฏิทินจะปรับตามเอง
              </li>
            </ul>
          </Card>

          {/* Platform Tab Buttons */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 pb-2.5 text-xs font-black flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activePlatform === 'ios'
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-450'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              iPhone / iPad
            </button>
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 pb-2.5 text-xs font-black flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activePlatform === 'android'
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-450'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Android
            </button>
            <button
              onClick={() => setActivePlatform('desktop')}
              className={`flex-1 pb-2.5 text-xs font-black flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activePlatform === 'desktop'
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-450'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              <Monitor className="w-4 h-4" />
              คอมพิวเตอร์
            </button>
          </div>

          {/* Tutorial Steps */}
          <div className="space-y-4 pt-1">
            {activePlatform === 'ios' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">วิธีที่ 1: เพิ่มแบบอัตโนมัติ (แนะนำ ⭐)</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>กดปุ่ม <strong className="text-blue-600 dark:text-blue-400">"เพิ่มลงปฏิทินอัตโนมัติ"</strong> ด้านล่างนี้</li>
                    <li>แอปปฏิทิน (Calendar) ของเครื่องจะเปิดขึ้น ให้กดปุ่ม <strong className="text-blue-600 dark:text-blue-400">"สมัครรับ" (Subscribe)</strong></li>
                    <li>ตรวจสอบความถูกต้องแล้วกด <strong className="text-blue-600 dark:text-blue-400">"เพิ่ม" (Add)</strong></li>
                  </ol>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">วิธีที่ 2: คัดลอกลิงก์ไปตั้งค่าเอง</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>คัดลอกลิงก์ปฏิทินที่กล่องข้อความด้านล่าง</li>
                    <li>เปิดแอป <strong className="text-slate-700 dark:text-slate-300">"การตั้งค่า" (Settings)</strong> ของ iOS</li>
                    <li>เลื่อนลงไปเลือกเมนู <strong className="text-slate-700 dark:text-slate-300">"ปฏิทิน" (Calendar)</strong> &gt; <strong className="text-slate-700 dark:text-slate-300">"บัญชี" (Accounts)</strong> &gt; <strong className="text-slate-700 dark:text-slate-300">"เพิ่มบัญชี" (Add Account)</strong></li>
                    <li>เลือกบัญชีชนิด <strong className="text-slate-700 dark:text-slate-300">"อื่นๆ" (Other)</strong> &gt; <strong className="text-blue-600 dark:text-blue-400">"เพิ่มปฏิทินที่สมัครรับ" (Add Subscribed Calendar)</strong></li>
                    <li>วางลิงก์ที่คัดลอกลงในช่องเซิร์ฟเวอร์ แล้วกดถัดไปเพื่อบันทึก</li>
                  </ol>
                </div>
              </div>
            )}

            {activePlatform === 'android' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">สำหรับ Google Calendar (เครื่องทั่วไป / Samsung / Opp / etc)</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>คัดลอกลิงก์ปฏิทินที่กล่องข้อความด้านล่างนี้</li>
                    <li>เปิดเว็บเบราว์เซอร์ไปที่ <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">calendar.google.com</a> (ใช้โหมด Desktop site หากทำบนมือถือ)</li>
                    <li>ตรงแถบซ้ายมือ มองหาหัวข้อ <strong className="text-slate-700 dark:text-slate-300">"ปฏิทินอื่น" (Other calendars)</strong> กดเครื่องหมายบวก <strong className="text-slate-700 dark:text-slate-300">(+)</strong></li>
                    <li>เลือก <strong className="text-blue-600 dark:text-blue-400">"จาก URL" (From URL)</strong> จากนั้นวางลิงก์ที่คัดลอกลงไป แล้วกด <strong className="text-blue-600 dark:text-blue-400">"เพิ่มปฏิทิน" (Add calendar)</strong></li>
                  </ol>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">ทางเลือกเพิ่มเติม: ปฏิทินซัมซุง (Samsung Calendar)</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>คัดลอกลิงก์ปฏิทินด้านล่าง</li>
                    <li>เปิดแอปปฏิทินของซัมซุง กดปุ่มขีดสามขีด (เมนู) &gt; เลือก <strong className="text-slate-700 dark:text-slate-300">"จัดการปฏิทิน" (Manage Calendars)</strong></li>
                    <li>กดปุ่มสมัครรับปฏิทินใหม่ หรือรูปบวก วางลิงก์เพื่อนำเข้ารายการ</li>
                  </ol>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">วิธีนำเข้าใน Google Calendar (Web)</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>คัดลอกลิงก์ปฏิทินที่กล่องข้อความด้านล่างนี้</li>
                    <li>เปิดเว็บเบราว์เซอร์ไปที่ <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">calendar.google.com</a></li>
                    <li>ด้านซ้าย มองหาหัวข้อ <strong className="text-slate-700 dark:text-slate-300">"ปฏิทินอื่น" (Other calendars)</strong> คลิกเครื่องหมายบวก <strong className="text-slate-700 dark:text-slate-300">(+)</strong></li>
                    <li>เลือกเมนู <strong className="text-blue-600 dark:text-blue-400">"จาก URL" (From URL)</strong> วางลิงก์ลงไป แล้วคลิก <strong className="text-blue-600 dark:text-blue-400">"เพิ่มปฏิทิน" (Add calendar)</strong></li>
                  </ol>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">วิธีสำหรับเครื่อง Mac (Apple Calendar)</h4>
                  <ol className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-bold list-decimal pl-4">
                    <li>เปิดแอป Calendar บนเครื่อง Mac</li>
                    <li>ไปที่เมนู <strong className="text-slate-700 dark:text-slate-300">File</strong> &gt; <strong className="text-blue-600 dark:text-blue-400">New Calendar Subscription...</strong> (หรือกดคีย์ลัด <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-750 text-[10px] bg-slate-50 dark:bg-slate-800 font-mono shadow-sm">⌥ ⌘ S</kbd>)</li>
                    <li>วางลิงก์ปฏิทินลงไปแล้วกด <strong className="text-blue-600 dark:text-blue-400">Subscribe</strong></li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Copy Link Component */}
          <div className="pt-2">
            <Input
              label="ลิงก์ปฏิทินสำหรับตั้งค่าเอง (Calendar URL)"
              value={calendarUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
              rightElement={
                <button
                  onClick={handleCopyLink}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="คัดลอกลิงก์"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              }
              className="font-mono text-xs pr-12 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2.5">
          <Button
            onClick={onSubscribe}
            fullWidth
            size="md"
            icon={<Smartphone className="w-4 h-4" />}
          >
            เพิ่มลงปฏิทินอัตโนมัติ
          </Button>
          
          <div className="flex gap-2.5">
            <Button
              onClick={onDownload}
              variant="secondary"
              fullWidth
              size="sm"
              icon={<CalendarIcon className="w-4 h-4" />}
            >
              ดาวน์โหลดไฟล์ปฏิทิน (.ics)
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              fullWidth
              size="sm"
            >
              ปิดหน้าต่างนี้
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
