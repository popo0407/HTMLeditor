// カレンダーサービス（スタブ）
// 予定取得/変換等のビジネスロジック追加予定

import { CalendarEvent } from './calendarExporter';

export function normalizeEvents(raw: any[]): CalendarEvent[] {
	return raw.map((r, i) => ({
		id: String(r.id ?? i),
		title: String(r.title ?? 'Untitled'),
		start: new Date(r.start ?? Date.now()),
		end: new Date(r.end ?? Date.now()),
	}));
}

const calendarService = { normalizeEvents };
export default calendarService;
