import { format, isToday, isTomorrow, isYesterday, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
