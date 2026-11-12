import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  AlertCircle,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import ScheduleForm from '../components/schedules/ScheduleForm';
import type { ScheduleEntry } from '../types';
import { today } from '../utils/dates';
import { formatSafeErrorMessage } from '../utils/errorUtils';
import {
  format,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
} from 'date-fns';

export default function SchedulesPage() {
  const { schedules, addSchedule, updateSchedule, removeSchedule, error } = useApp();

  const [selectedDate, setSelectedDate] = useState(today());
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'work' | 'study' | 'routine' | 'personal'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitialTime, setAddInitialTime] = useState<string>('09:00');
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);

  // Live ticking clock for the red indicator line
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync calendar's month if selected date changes significantly
  useEffect(() => {
    const d = parseISO(selectedDate);
    if (!isNaN(d.getTime())) {
      setCurrentMonth(d);
    }
  }, [selectedDate]);

  // Day navigation
  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  // Calendar dates generation
  const calendarDays = useMemo(() => {
    if (calendarMode === 'month') {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const d = parseISO(selectedDate);
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const weekStart = startOfWeek(validDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(validDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentMonth, calendarMode, selectedDate]);

  // Demo fallback schedules for today if database has none
  const sampleDemoSchedules: ScheduleEntry[] = useMemo(() => [
    {
      id: 'demo-1',
      title: 'Moto Track Day',
      description: 'All Motorbikes • Fast Track Session',
      date: selectedDate,
      startTime: '08:00',
      endTime: '09:30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Drift Series Second Round',
      description: 'JDM Championship • Track 4',
      date: selectedDate,
      startTime: '09:45',
      endTime: '11:30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      title: 'Moto Track Day (Group B)',
      description: 'All Motorbikes • Skills Run',
      date: selectedDate,
      startTime: '10:00',
      endTime: '11:15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      title: 'Sprint Qualifiers',
      description: 'All Motorbikes • Lap Timing',
      date: selectedDate,
      startTime: '10:45',
      endTime: '12:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      title: 'Moto Track Day Finales',
      description: 'All Motorbikes • Main Event',
      date: selectedDate,
      startTime: '13:00',
      endTime: '14:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-6',
      title: 'Private Event & VIP Reception',
      description: 'All Motorbikes Lounge',
      date: selectedDate,
      startTime: '14:00',
      endTime: '15:30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ], [selectedDate]);

  // Day's filtered schedules
  const effectiveDaySchedules = useMemo(() => {
    const fromDb = schedules.filter((s) => s.date === selectedDate);
    // If no real schedules exist for selected day, use demo sample items
    const rawList = fromDb.length > 0 ? fromDb : sampleDemoSchedules;

    return rawList.filter((s) => {
      // Category filter
      if (categoryFilter !== 'all') {
        const text = (s.title + ' ' + (s.description || '')).toLowerCase();
        if (categoryFilter === 'work' && !text.includes('dev') && !text.includes('track') && !text.includes('work')) return false;
        if (categoryFilter === 'study' && !text.includes('dsa') && !text.includes('study') && !text.includes('round')) return false;
        if (categoryFilter === 'routine' && !text.includes('routine') && !text.includes('freshen') && !text.includes('session')) return false;
      }
      // Time filter
      if (timeFilter !== 'all') {
        const hour = parseInt(s.startTime.split(':')[0], 10);
        if (timeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (timeFilter === 'evening' && (hour < 18 || hour >= 24)) return false;
      }
      return true;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDate, categoryFilter, timeFilter, sampleDemoSchedules]);

  // All upcoming events for the left sidebar widget
  const upcomingEvents = useMemo(() => {
    const list = schedules.length > 0 ? schedules : sampleDemoSchedules;
    return list
      .filter((s) => s.date >= today())
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 4);
  }, [schedules, sampleDemoSchedules]);

  // Handle schedule creation / updates
  const handleAddSubmit = async (data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addSchedule(data);
    setShowAddModal(false);
  };

  const handleEditSubmit = async (data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingSchedule) return;
    await updateSchedule({ ...editingSchedule, ...data });
    setEditingSchedule(null);
  };

  // Convert time strings (HH:mm) into minutes from 08:00
  const START_HOUR = 8;
  const END_HOUR = 17; // 5:00 PM
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 8am to 5pm inclusive
  const HOUR_HEIGHT = 78; // px per hour

  const getMinutesFromStart = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - START_HOUR) * 60 + (m || 0);
  };

  // Compute live current-time indicator offset
  const isSelectedDateToday = selectedDate === today();
  const currentMinutesFromStart = isSelectedDateToday
    ? (currentTime.getHours() - START_HOUR) * 60 + currentTime.getMinutes()
    : -1;
  const showCurrentTimeLine =
    isSelectedDateToday && currentMinutesFromStart >= 0 && currentMinutesFromStart <= TOTAL_HOURS * 60;

  // Determine block card color styling matching reference image
  const getCardStyle = (index: number, schedule: ScheduleEntry) => {
    const title = schedule.title.toLowerCase();
    if (title.includes('qualifiers') || index === 3) {
      // Dark diagonal-striped card
      return {
        background: 'rgba(28, 30, 42, 0.95)',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.035) 0, rgba(255, 255, 255, 0.035) 12px, transparent 12px, transparent 24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#f8fafc',
        badge: '58K',
      };
    }
    if (index === 0) {
      // Purple / Violet card
      return {
        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        border: 'none',
        color: '#ffffff',
        badge: '154K',
      };
    }
    if (index === 1) {
      // Royal Indigo / Blue card
      return {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        border: 'none',
        color: '#ffffff',
        badge: '1h 45 min',
      };
    }
    if (index === 2) {
      // Electric Ocean Blue card
      return {
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        border: 'none',
        color: '#ffffff',
        badge: '154K',
      };
    }
    if (index === 4) {
      // Mint Emerald Green card
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: 'none',
        color: '#ffffff',
        badge: '145K',
      };
    }
    // Warm Coral / Orange card
    return {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      border: 'none',
      color: '#ffffff',
      badge: '134K',
    };
  };

  // Generate hour slots: 08:00 AM to 05:00 PM
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.5rem 1rem 4rem',
        boxSizing: 'border-box',
        color: '#f8fafc',
      }}
    >
      {/* ── TOP HEADER: TITLE & FILTERS ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            Calender
          </h1>
        </div>

        {/* Dropdown Filters matching screenshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Tag Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              style={{
                appearance: 'none',
                background: 'rgba(26, 27, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '0.55rem 2.2rem 0.55rem 1rem',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Tags ▾</option>
              <option value="work">Work & Tracks</option>
              <option value="study">Study & DSA</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Time Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              style={{
                appearance: 'none',
                background: 'rgba(26, 27, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '0.55rem 2.2rem 0.55rem 1rem',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">Time ▾</option>
              <option value="morning">Morning (6AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 6PM)</option>
              <option value="evening">Evening (6PM - 11PM)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                appearance: 'none',
                background: 'rgba(26, 27, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '0.55rem 2.2rem 0.55rem 1rem',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">Status ▾</option>
              <option value="active">Active Now</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setAddInitialTime('09:00');
              setShowAddModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.6rem 1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(236, 72, 153, 0.35)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Schedule
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{typeof error === 'string' && error !== '[object Object]' ? error : formatSafeErrorMessage(error)}</span>
        </div>
      )}

      {/* ── MAIN TWO-COLUMN CALENDAR & TIMELINE LAYOUT ───────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 370px) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="cal-layout-grid"
      >
        {/* ── LEFT COLUMN: MINI CALENDAR & UPCOMING EVENTS ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: Mini Calendar Widget */}
          <div
            style={{
              background: 'rgba(26, 27, 38, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: 'clamp(0.75rem, 3vw, 1.5rem)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
              boxSizing: 'border-box',
              maxWidth: '100%',
            }}
          >
            {/* Header: Month, Year & Prev/Next */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {format(currentMonth, 'MMMM, yyyy')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Week / Month Segmented Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'rgba(15, 16, 24, 0.65)',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: calendarMode === 'week' ? 700 : 500,
                  background: calendarMode === 'week' ? '#ff5e6d' : 'transparent',
                  color: calendarMode === 'week' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: calendarMode === 'month' ? 700 : 500,
                  background: calendarMode === 'month' ? '#ff5e6d' : 'transparent',
                  color: calendarMode === 'month' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Month
              </button>
            </div>

            {/* Days of Week Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = dayStr === selectedDate;
                const inCurrentMonth = isSameMonth(day, currentMonth);
                const hasSchedules = schedules.some((s) => s.date === dayStr);

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => setSelectedDate(dayStr)}
                    style={{
                      width: 'clamp(28px, 7.5vw, 36px)',
                      height: 'clamp(28px, 7.5vw, 36px)',
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: 'none',
                      background: isSelected ? '#ff5e6d' : 'transparent',
                      color: isSelected ? '#ffffff' : inCurrentMonth ? '#cbd5e1' : '#475569',
                      fontWeight: isSelected ? 800 : inCurrentMonth ? 600 : 400,
                      fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? '0 0 16px rgba(255, 94, 109, 0.65)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasSchedules && !isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: '#38bdf8',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Upcoming Events Widget */}
          <div
            style={{
              background: 'rgba(26, 27, 38, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Upcoming Events
            </h3>

            {/* Vertical Timeline Track */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              {/* Event 1 (Purple Pill) */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, width: '45px', paddingTop: '6px' }}>
                  08:00
                </span>
                <div
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    borderRadius: '16px',
                    padding: '0.85rem 1.15rem',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 6px 20px rgba(168, 85, 247, 0.25)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {upcomingEvents[0]?.title || 'Drift Series First Round'}
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                      {upcomingEvents[0]?.description || 'JDM Championship'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      +8
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Current Time Line Indicator */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ width: '45px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ff5768',
                      boxShadow: '0 0 8px #ff5768',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#ff5768', fontWeight: 800 }}>
                    {format(currentTime, 'HH:mm')}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: 'linear-gradient(90deg, #ff5768, transparent)',
                    boxShadow: '0 0 8px #ff5768',
                  }}
                />
              </div>

              {/* Event 2 (Mint Green Pill) */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, width: '45px', paddingTop: '6px' }}>
                  12:00
                </span>
                <div
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                    borderRadius: '16px',
                    padding: '0.85rem 1.15rem',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {upcomingEvents[1]?.title || 'Drift Series First Round'}
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>
                      {upcomingEvents[1]?.description || 'JDM Sprint'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      +5
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: FULL DAY HOURLY TIMELINE CANVAS ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Top Blue Navigation Bar matching reference screenshot */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              borderRadius: '20px',
              padding: '0.85rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 30px rgba(37, 99, 235, 0.35)',
              marginBottom: '1rem',
              color: '#ffffff',
            }}
          >
            {/* Day Dropdown Pill */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '0.45rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              <span>Day</span>
              <ChevronDown size={15} />
            </div>

            {/* Date Pill with Prev/Next Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '0.45rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <CalendarIcon size={16} />
                <span>{format(parseISO(selectedDate), 'MMM d, yyyy')}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handlePrevDay}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Hourly Timeline Grid Container */}
          <div
            style={{
              background: 'rgba(26, 27, 38, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              minHeight: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
            }}
          >
            {/* Background Hour Lines & Time Labels */}
            {hours.map((hour, idx) => {
              const displayHour =
                hour === 12
                  ? '12:00 PM'
                  : hour > 12
                  ? `${String(hour - 12).padStart(2, '0')}:00 PM`
                  : `${String(hour).padStart(2, '0')}:00 AM`;

              const hourSlotTime = `${String(hour).padStart(2, '0')}:00`;

              return (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    top: `${idx * HOUR_HEIGHT}px`,
                    left: '1.5rem',
                    right: '1.5rem',
                    height: `${HOUR_HEIGHT}px`,
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Left Hour Label */}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748b',
                      width: '75px',
                      transform: 'translateY(-9px)',
                      background: 'rgba(26, 27, 38, 0.85)',
                      paddingRight: '6px',
                    }}
                  >
                    {displayHour}
                  </span>

                  {/* Clickable slot area to add a schedule at this hour */}
                  <div
                    onClick={() => {
                      setAddInitialTime(hourSlotTime);
                      setShowAddModal(true);
                    }}
                    style={{
                      flex: 1,
                      height: '100%',
                      cursor: 'pointer',
                    }}
                    title={`Click to add schedule at ${displayHour}`}
                  />
                </div>
              );
            })}

            {/* Current Time Indicator Line (if today) */}
            {showCurrentTimeLine && (
              <div
                style={{
                  position: 'absolute',
                  top: `${(currentMinutesFromStart / 60) * HOUR_HEIGHT}px`,
                  left: '1.5rem',
                  right: '1.5rem',
                  height: '2px',
                  background: '#ff5768',
                  boxShadow: '0 0 10px #ff5768',
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ff5768',
                    marginLeft: '-5px',
                    boxShadow: '0 0 12px #ff5768',
                  }}
                />
              </div>
            )}

            {/* Schedule Blocks Canvas */}
            <div
              style={{
                position: 'relative',
                marginLeft: '85px',
                height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
                pointerEvents: 'none',
              }}
            >
              {effectiveDaySchedules.map((schedule, idx) => {
                const startMins = getMinutesFromStart(schedule.startTime);
                const endMins = getMinutesFromStart(schedule.endTime);
                const durationMins = Math.max(30, endMins - startMins);

                const top = (startMins / 60) * HOUR_HEIGHT;
                const height = Math.max(54, (durationMins / 60) * HOUR_HEIGHT - 6);

                // Check for side-by-side overlap with neighboring schedules
                const isOverlapping = effectiveDaySchedules.some((other, oIdx) => {
                  if (oIdx === idx) return false;
                  const oStart = getMinutesFromStart(other.startTime);
                  const oEnd = getMinutesFromStart(other.endTime);
                  return Math.max(startMins, oStart) < Math.min(endMins, oEnd);
                });

                const isRightCol = isOverlapping && idx % 2 === 1;
                const widthStyle = isOverlapping ? 'calc(50% - 8px)' : 'calc(100% - 8px)';
                const leftStyle = isOverlapping ? (isRightCol ? 'calc(50% + 4px)' : '0%') : '0%';

                const cardStyle = getCardStyle(idx, schedule);

                return (
                  <div
                    key={schedule.id}
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: leftStyle,
                      width: widthStyle,
                      height: `${height}px`,
                      borderRadius: '16px',
                      padding: '0.85rem 1.25rem',
                      boxSizing: 'border-box',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      zIndex: 5,
                      ...cardStyle,
                    }}
                    onClick={() => setEditingSchedule(schedule)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {/* Top Row: Start Time & Metric Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.9 }}>
                        {schedule.startTime} {parseInt(schedule.startTime.split(':')[0], 10) >= 12 ? 'pm' : 'am'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {cardStyle.badge}
                      </span>
                    </div>

                    {/* Middle: Title */}
                    <div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          lineHeight: 1.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {schedule.title}
                      </div>
                      {schedule.description && (
                        <div
                          style={{
                            fontSize: '0.74rem',
                            opacity: 0.85,
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {schedule.description}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Quick Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSchedule(schedule);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Edit schedule"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSchedule(schedule.id);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 6px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete schedule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD SCHEDULE MODAL ──────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add Schedule Time Block"
        >
          <ScheduleForm
            initial={{ date: selectedDate, startTime: addInitialTime }}
            onSubmit={handleAddSubmit}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* ── EDIT SCHEDULE MODAL ─────────────────────────────────────────────── */}
      {editingSchedule && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSchedule(null)}
          title="Edit Schedule Time Block"
        >
          <ScheduleForm
            initial={editingSchedule}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingSchedule(null)}
          />
        </Modal>
      )}
    </div>
  );
}
