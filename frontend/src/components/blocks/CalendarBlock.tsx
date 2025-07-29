import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockStyle } from '../../types';
import { BlockBase } from './BlockBase';
import './CalendarBlock.css';

interface CalendarBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onStyleChange: (blockId: string, style: BlockStyle) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CalendarBlock: React.FC<CalendarBlockProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onStyleChange,
  onMoveUp,
  onMoveDown,
}) => {
  const [events, setEvents] = useState<any[]>(block.calendarData?.events || []);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<any>>({
    title: '',
    start: '',
    end: '',
    color: '#0078d4'
  });
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const eventInputRef = useRef<HTMLInputElement>(null);

  // イベントが変更されたときにブロックを更新
  useEffect(() => {
    const updatedBlock = {
      ...block,
      calendarData: { events }
    };
    onUpdate(block.id, JSON.stringify(updatedBlock));
  }, [events, block.id, onUpdate]);

  useEffect(() => {
    if (isAddingEvent && eventInputRef.current) {
      eventInputRef.current.focus();
    }
  }, [isAddingEvent]);

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.start) {
      const event = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end || newEvent.start,
        color: newEvent.color || '#0078d4'
      };

      const updatedEvents = [...events, event];
      setEvents(updatedEvents);
      
      setNewEvent({ title: '', start: '', end: '', color: '#0078d4' });
      setIsAddingEvent(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
  };

  const handleSaveEvent = () => {
    if (editingEvent && editingEvent.title && editingEvent.start) {
      const updatedEvents = events.map((e: any) => 
        e.id === editingEvent.id ? editingEvent : e
      );
      setEvents(updatedEvents);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((e: any) => e.id !== eventId);
    setEvents(updatedEvents);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setIsAddingEvent(false);
    setNewEvent({ title: '', start: '', end: '', color: '#0078d4' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const formatDateSafe = (dateString: string | undefined, fallback: string) => {
    if (!dateString) return formatDate(fallback);
    return formatDate(dateString);
  };

  const renderCalendarContent = () => (
    <div className="calendar-block">
      <div className="calendar-header">
        <h3 className="calendar-title">スケジュール管理</h3>
        
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
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="イベントタイトル"
                ref={eventInputRef}
              />
              <input
                type="date"
                value={newEvent.start}
                onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                placeholder="開始日"
              />
              <input
                type="date"
                value={newEvent.end}
                onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                placeholder="終了日"
              />
              <input
                type="color"
                value={newEvent.color}
                onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                className="color-picker"
              />
              <button onClick={handleAddEvent} className="save-button">
                ✓
              </button>
              <button onClick={cancelEdit} className="cancel-button">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="calendar-table-container">
        <table className="calendar-events-table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>開始日</th>
              <th>終了日</th>
              <th>色</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: any) => (
              <tr key={event.id}>
                {editingEvent && editingEvent.id === event.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editingEvent.start}
                        onChange={(e) => setEditingEvent({...editingEvent, start: e.target.value})}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editingEvent.end}
                        onChange={(e) => setEditingEvent({...editingEvent, end: e.target.value})}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="color"
                        value={editingEvent.color}
                        onChange={(e) => setEditingEvent({...editingEvent, color: e.target.value})}
                        className="color-picker"
                      />
                    </td>
                    <td>
                      <button onClick={handleSaveEvent} className="save-button">
                        ✓
                      </button>
                      <button onClick={cancelEdit} className="cancel-button">
                        ✕
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{event.title}</td>
                    <td>{formatDate(event.start)}</td>
                    <td>{formatDateSafe(event.end, event.start)}</td>
                    <td>
                      <div 
                        className="color-preview" 
                        style={{backgroundColor: event.color}}
                      />
                    </td>
                    <td>
                      <button onClick={() => handleEditEvent(event)} className="edit-button">
                        ✎
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="delete-button">
                        🗑
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {events.length === 0 && (
          <div className="no-events">
            <p>イベントがありません。新しいイベントを追加してください。</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <BlockBase
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onStyleChange={onStyleChange}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      {renderCalendarContent()}
    </BlockBase>
  );
};

export { CalendarBlock };