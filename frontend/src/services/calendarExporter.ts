/**
 * カレンダー専用HTML出力サービス
 * 
 * 責務:
 * - カレンダーブロックから表示専用HTMLの生成
 * - React非依存の自己完結HTMLファイル作成
 * - スケジュールデータのJSON埋め込み
 * 
 * 開発憲章の「単一責任の原則」に従い、カレンダー出力のみを担当
 */

import { CalendarData, CalendarEvent } from '../types/index';
import { calendarService } from './calendarService';

export class CalendarExporter {
  /**
   * カレンダーデータを表示専用HTMLに変換
   * 
   * @param calendarData カレンダーデータ
   * @param title HTML文書のタイトル
   * @returns 完全自己完結HTML文字列
   */
  exportToHTML(calendarData: CalendarData, title: string = 'カレンダー'): string {
    const eventMonths = this.getEventMonths(calendarData);
    const calendarsHTML = eventMonths.map(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      const weeks = calendarService.generateMonthCalendar(year, month, calendarData.events || []);
      return `
        <div class="calendar-month-section">
          <h2 class="calendar-month-title">${year}年${month}月</h2>
          ${this.generateCalendarHTML(weeks)}
        </div>`;
    }).join('');
    
    const eventsJSON = JSON.stringify(calendarData.events || []);
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    ${this.getInlineCSS()}
  </style>
</head>
<body>
  <div class="calendar-export-container">
    <header class="calendar-export-header">
      <h1>${this.escapeHtml(title)}</h1>
    </header>
    
    <div class="calendar-export-content">
      ${calendarsHTML}
    </div>
    
    ${(calendarData.events && calendarData.events.length > 0) ? this.generateEventList(calendarData.events) : ''}
  </div>
  
  <script id="schedule-data" type="application/json">
${eventsJSON}
  </script>
</body>
</html>`;
  }

  /**
   * イベントがある月をすべて取得
   * 
   * @param calendarData カレンダーデータ
   * @returns イベントがある月の配列（YYYY-MM形式）
   */
  private getEventMonths(calendarData: CalendarData): string[] {
    const eventMonths = new Set<string>();
    
    if (calendarData.events) {
      calendarData.events.forEach(event => {
        const startMonth = event.start.substring(0, 7); // YYYY-MM
        eventMonths.add(startMonth);
        
        if (event.end) {
          const endMonth = event.end.substring(0, 7); // YYYY-MM
          eventMonths.add(endMonth);
          
          // 開始月と終了月の間の月も追加
          const startDate = new Date(event.start + 'T00:00:00');
        const endDate = new Date(event.end + 'T00:00:00');
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          eventMonths.add(monthStr);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        }
      });
    }
    
    // 現在月も含める（イベントがない場合の表示用）
    if (eventMonths.size === 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      eventMonths.add(currentMonth);
    }
    
    return Array.from(eventMonths).sort();
  }

  /**
   * カレンダーテーブルHTMLを生成
   * 
   * @param weeks 週データ配列
   * @returns カレンダーテーブルHTML
   */
  private generateCalendarHTML(weeks: any[]): string {
    const headerRow = `
      <tr>
        <th class="sunday">日</th>
        <th>月</th>
        <th>火</th>
        <th>水</th>
        <th>木</th>
        <th>金</th>
        <th class="saturday">土</th>
      </tr>`;
    
    const bodyRows = weeks.map(week => {
      const cells = week.dates.map((dateInfo: any) => {
        const classes = [
          'calendar-export-cell',
          !dateInfo.isCurrentMonth && 'other-month',
          dateInfo.isToday && 'today',
          dateInfo.isSunday && 'sunday',
          dateInfo.isSaturday && 'saturday'
        ].filter(Boolean).join(' ');
        
        const events = dateInfo.events.map((event: CalendarEvent) => 
          `<div class="calendar-export-event" title="${this.escapeHtml(event.title)}">${this.escapeHtml(event.title)}</div>`
        ).join('');
        
        return `
          <td class="${classes}">
            <div class="calendar-export-date">${dateInfo.day}</div>
            <div class="calendar-export-events">${events}</div>
          </td>`;
      }).join('');
      
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `
      <table class="calendar-export-table">
        <thead>${headerRow}</thead>
        <tbody>${bodyRows}</tbody>
      </table>`;
  }

  /**
   * イベント一覧HTMLを生成
   * 
   * @param events イベント配列
   * @returns イベント一覧HTML
   */
  private generateEventList(events: CalendarEvent[]): string {
    const sortedEvents = [...events].sort((a, b) => a.start.localeCompare(b.start));
    
    const eventItems = sortedEvents.map(event => {
      const startDate = new Date(event.start).toLocaleDateString('ja-JP');
      const endDate = event.end && event.end !== event.start ? 
        ` - ${new Date(event.end).toLocaleDateString('ja-JP')}` : '';
      
      return `
        <li class="calendar-export-event-item">
          <span class="calendar-export-event-date">${startDate}${endDate}</span>
          <span class="calendar-export-event-title">${this.escapeHtml(event.title)}</span>
        </li>`;
    }).join('');
    
    return `
      <div class="calendar-export-events-section">
        <h2>イベント一覧</h2>
        <ul class="calendar-export-events-list">
          ${eventItems}
        </ul>
      </div>`;
  }

  /**
   * 自己完結用インラインCSS
   * 
   * @returns CSS文字列
   */
  private getInlineCSS(): string {
    return `
      body {
        font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        background: #ffffff;
      }
      
      .calendar-export-container {
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .calendar-export-header {
        background: #f8f9fa;
        padding: 24px;
        border-bottom: 1px solid #e9ecef;
        text-align: center;
      }
      
      .calendar-export-header h1 {
        margin: 0 0 8px 0;
        font-size: 2rem;
        color: #1f2937;
      }
      
      .calendar-export-date {
        font-size: 1.25rem;
        color: #6b7280;
        margin: 0;
      }
      
      .calendar-export-content {
        padding: 24px;
      }
      
      .calendar-month-section {
        margin-bottom: 48px;
      }
      
      .calendar-month-section:last-child {
        margin-bottom: 32px;
      }
      
      .calendar-month-title {
        font-size: 1.5rem;
        color: #1f2937;
        margin: 0 0 24px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .calendar-export-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        margin-bottom: 32px;
      }
      
      .calendar-export-table th {
        padding: 12px 8px;
        text-align: center;
        font-weight: 600;
        color: #374151;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
      }
      
      .calendar-export-table th.sunday {
        color: #dc2626;
      }
      
      .calendar-export-table th.saturday {
        color: #2563eb;
      }
      
      .calendar-export-cell {
        width: 14.28%;
        height: 100px;
        padding: 8px;
        border: 1px solid #e5e7eb;
        vertical-align: top;
        position: relative;
      }
      
      .calendar-export-cell.other-month {
        background: #f9fafb;
        color: #9ca3af;
      }
      
      .calendar-export-cell.today {
        background: #dbeafe;
        border-color: #3b82f6;
        font-weight: 600;
      }
      
      .calendar-export-cell.sunday {
        background: #fef2f2;
      }
      
      .calendar-export-cell.saturday {
        background: #eff6ff;
      }
      
      .calendar-export-cell.other-month.sunday,
      .calendar-export-cell.other-month.saturday {
        background: #f9fafb;
      }
      
      .calendar-export-date {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .calendar-export-events {
        font-size: 11px;
        line-height: 1.2;
      }
      
      .calendar-export-event {
        display: block;
        margin-bottom: 2px;
        padding: 2px 4px;
        background: #3b82f6;
        color: #ffffff;
        border-radius: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .calendar-export-events-section {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }
      
      .calendar-export-events-section h2 {
        margin: 0 0 16px 0;
        font-size: 1.5rem;
        color: #1f2937;
      }
      
      .calendar-export-events-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .calendar-export-event-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .calendar-export-event-item:last-child {
        border-bottom: none;
      }
      
      .calendar-export-event-date {
        font-size: 14px;
        color: #6b7280;
        min-width: 150px;
        font-weight: 500;
      }
      
      .calendar-export-event-title {
        font-size: 16px;
        color: #1f2937;
        margin-left: 16px;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 16px;
        }
        
        .calendar-export-container {
          box-shadow: none;
          border: 1px solid #ccc;
        }
        
        .calendar-export-cell {
          height: 80px;
        }
      }`;
  }

  /**
   * HTMLエスケープ
   * 
   * @param text エスケープ対象の文字列
   * @returns エスケープされた文字列
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// シングルトンインスタンスをエクスポート
export const calendarExporter = new CalendarExporter();
