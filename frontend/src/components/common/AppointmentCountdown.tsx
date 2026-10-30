import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface AppointmentCountdownProps {
  targetDateTime?: string | null;
  targetDate?: string | null;
  label?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
}

export const AppointmentCountdown: React.FC<AppointmentCountdownProps> = ({
  targetDateTime,
  targetDate,
  label = 'Next Clinical Appointment',
  title,
  subtitle,
  className = '',
  compact = false,
}) => {
  const displayTitle = title || label;
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
    isValid: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    isValid: false,
  });

  useEffect(() => {
    const rawTarget = targetDateTime || targetDate;
    if (!rawTarget) {
      setTimeLeft((prev) => ({ ...prev, isValid: false }));
      return;
    }

    const calculateTime = () => {
      // Normalize date string
      let targetTime: number;
      if (rawTarget.includes('T')) {
        targetTime = new Date(rawTarget).getTime();
      } else if (rawTarget.includes(' ') && rawTarget.length > 10) {
        // e.g. "2026-11-05 10:30:00"
        targetTime = new Date(rawTarget.replace(' ', 'T')).getTime();
      } else {
        // Date only, e.g. "2026-11-05" -> treat as 09:00 AM on that day
        targetTime = new Date(`${rawTarget}T09:00:00`).getTime();
      }

      if (isNaN(targetTime)) {
        setTimeLeft((prev) => ({ ...prev, isValid: false }));
        return;
      }

      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
          isValid: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isPast: false,
        isValid: true,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateTime, targetDate]);

  if (!timeLeft.isValid) {
    return (
      <div className={`p-3 bg-slate-50 border border-brand-border rounded-xl text-xs text-brand-muted flex items-center gap-2 ${className}`}>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span>No upcoming appointment or follow-up scheduled.</span>
      </div>
    );
  }

  if (timeLeft.isPast) {
    return (
      <div className={`p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
        <span>The scheduled consultation has commenced or concluded.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-brand-teal font-mono text-xs rounded-lg ${className}`}>
        <Clock className="w-3.5 h-3.5 text-brand-teal" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-teal-50/80 via-white to-sky-50/80 border border-brand-teal/20 rounded-2xl shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-teal flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-teal animate-pulse" />
          {displayTitle}
        </span>
        <span className="text-[11px] text-brand-muted font-medium">Live Countdown</span>
      </div>

      <div className="text-sm font-semibold text-brand-navy">
        Next appointment in{' '}
        <span className="text-brand-teal">
          {timeLeft.days > 0 && `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''}, `}
          {timeLeft.hours} hour{timeLeft.hours !== 1 ? 's' : ''},{' '}
          {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? 's' : ''} and{' '}
          {timeLeft.seconds} second{timeLeft.seconds !== 1 ? 's' : ''}
        </span>
      </div>

      {subtitle && (
        <div className="text-xs text-brand-muted mt-0.5 mb-3">{subtitle}</div>
      )}

      {/* Numerical Digit Blocks */}
      <div className="grid grid-cols-4 gap-2 text-center mt-3">
        <div className="p-2 bg-white rounded-xl border border-brand-border/80 shadow-xs">
          <div className="text-lg font-bold font-mono text-brand-navy">{timeLeft.days}</div>
          <div className="text-[10px] uppercase font-semibold text-brand-muted">Days</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-brand-border/80 shadow-xs">
          <div className="text-lg font-bold font-mono text-brand-navy">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase font-semibold text-brand-muted">Hours</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-brand-border/80 shadow-xs">
          <div className="text-lg font-bold font-mono text-brand-navy">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase font-semibold text-brand-muted">Mins</div>
        </div>
        <div className="p-2 bg-white rounded-xl border border-brand-border/80 shadow-xs">
          <div className="text-lg font-bold font-mono text-brand-teal">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase font-semibold text-brand-muted">Secs</div>
        </div>
      </div>
    </div>
  );
};
