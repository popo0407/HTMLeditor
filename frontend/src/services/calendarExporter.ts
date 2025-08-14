// カレンダーエクスポートサービス（スタブ）
// 今後: iCal / CSV 生成などを実装

export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
}

export function exportToIcs(events: CalendarEvent[]): string {
	// 簡易ダミー実装（ICS 仕様ではない）
	const lines = ['BEGIN:VCALENDAR'];
	for (const ev of events) {
		lines.push(`EVENT:${ev.title} ${ev.start.toISOString()}-${ev.end.toISOString()}`);
	}
	lines.push('END:VCALENDAR');
	return lines.join('\n');
}

const calendarExporter = { exportToIcs };
export default calendarExporter;
