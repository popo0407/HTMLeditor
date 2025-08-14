import React from 'react';

// カレンダーブロック（将来: 予定表示 / エクスポート連携）

export interface CalendarBlockProps {
	date?: Date;
	eventsCount?: number;
}

export const CalendarBlock: React.FC<CalendarBlockProps> = ({ date, eventsCount }) => {
	return <div style={{display:'none'}} data-date={date?.toISOString()} data-events={eventsCount} data-placeholder="calendar-block" />;
};

export default CalendarBlock;
