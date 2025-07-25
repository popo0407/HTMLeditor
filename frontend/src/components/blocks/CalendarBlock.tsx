import React, { useState, useRef, useEffect } from 'react';
import { CalendarEvent, DateInfo, WeekInfo, CalendarData } from '../../types/index';

interface CalendarBlockData {
  events?: CalendarEvent[];
}

interface CalendarBlockProps {
  data: CalendarBlockData;
  onUpdate: (newData: CalendarBlockData) => void;
}

const CalendarBlock: React.FC<CalendarBlockProps> = ({ data, onUpdate }) => {
  const [calendar, setCalendar] = useState<CalendarData>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weeks: []
  });
  const [selectedDate, setSelectedDate] = useState<DateInfo | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const eventInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingEvent && eventInputRef.current) {
      eventInputRef.current.focus();
    }
  }, [isAddingEvent]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendar(prev => {
      let newYear = prev.year;
      let newMonth = prev.month;
      
      if (direction === 'prev') {
        newMonth -= 1;
        if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }
      } else {
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }
      
      return { ...prev, year: newYear, month: newMonth };
    });
  };

  const handleDateClick = (date: DateInfo) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    if (newEventTitle.trim() && selectedDate) {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: newEventTitle.trim(),
        start: `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(selectedDate.date).padStart(2, '0')}`,
        end: `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(selectedDate.date).padStart(2, '0')}`
      };

      const currentEvents = data.events || [];
      const updatedData = {
        ...data,
        events: [...currentEvents, newEvent]
      };

      onUpdate(updatedData);
      setNewEventTitle('');
      setIsAddingEvent(false);
      setSelectedDate(null);
    }
  };

  const cancelAddEvent = () => {
    setNewEventTitle('');
    setIsAddingEvent(false);
    setSelectedDate(null);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
  };

  const handleEventSave = () => {
    if (editingEvent) {
      const currentEvents = data.events || [];
      const updatedEvents = currentEvents.map((e: CalendarEvent) => 
        e.id === editingEvent.id ? editingEvent : e
      );
      
      const updatedData = {
        ...data,
        events: updatedEvents
      };

      onUpdate(updatedData);
      setEditingEvent(null);
    }
  };

  const handleEventDelete = (eventId: string) => {
    if (window.confirm('このイベントを削除しますか？')) {
      const currentEvents = data.events || [];
      const updatedEvents = currentEvents.filter((e: CalendarEvent) => e.id !== eventId);
      
      const updatedData = {
        ...data,
        events: updatedEvents
      };

      onUpdate(updatedData);
    }
  };

  const getEventsForDate = (date: DateInfo): CalendarEvent[] => {
    const dateString = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(date.date).padStart(2, '0')}`;
    return (data.events || []).filter((event: CalendarEvent) => event.start === dateString);
  };

  const renderCalendarCell = (date: DateInfo) => {
    const events = getEventsForDate(date);
    const isSelected = selectedDate === date;

    return (
      <td
        key={`${date.date}-${date.isCurrentMonth}`}
        className={`calendar-date ${date.isCurrentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDateClick(date)}
      >
        <div className="date-number">{date.date}</div>
        {events.length > 0 && (
          <div className="date-events">
            {events.map((event: CalendarEvent) => (
              <span
                key={event.id}
                className="event-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventEdit(event);
                }}
              >
                {editingEvent?.id === event.id ? (
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        handleEventSave();
                      } else if (e.key === 'Escape') {
                        setEditingEvent(null);
                      }
                    }}
                    onBlur={handleEventSave}
                    className="event-edit-input"
                  />
                ) : (
                  <>
                    <span className="event-title">{event.title}</span>
                    <button
                      className="delete-event-button"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleEventDelete(event.id);
                      }}
                    >
                      🗑
                    </button>
                  </>
                )}
              </span>
            ))}
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="calendar-block">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={() => navigateMonth('prev')} className="nav-button">
            ＜
          </button>
          <h3 className="calendar-title">
            {calendar.year}年{calendar.month}月
          </h3>
          <button onClick={() => navigateMonth('next')} className="nav-button">
            ＞
          </button>
        </div>
        
        <div className="calendar-controls">
          {!isAddingEvent ? (
            <button 
              onClick={() => setIsAddingEvent(true)}
              className="add-event-button"
            >
              ＋ イベント追加
            </button>
          ) : (
            <div className="add-event-form">
              <input
                type="text"
                value={newEventTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEventTitle(e.target.value)}
                placeholder="イベントタイトル"
                ref={eventInputRef}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleAddEvent();
                  } else if (e.key === 'Escape') {
                    cancelAddEvent();
                  }
                }}
              />
              <button onClick={handleAddEvent} className="save-button">
                ✓
              </button>
              <button onClick={cancelAddEvent} className="cancel-button">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="calendar-grid">
        <table className="calendar-table">
          <thead>
            <tr>
              {['日', '月', '火', '水', '木', '金', '土'].map((dayName: string) => (
                <th key={dayName} className="calendar-day-header">
                  {dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.weeks.map((week: WeekInfo, weekIndex: number) => (
              <tr key={`week-${weekIndex}`} className="calendar-week">
                {week.dates.map((date: DateInfo) => renderCalendarCell(date))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDate && (
        <div className="selected-date-info">
          <p>選択日: {calendar.year}年{calendar.month}月{selectedDate.date}日</p>
        </div>
      )}
    </div>
  );
};

export { CalendarBlock };