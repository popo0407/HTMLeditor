import { CalendarEvent, DateInfo, WeekInfo } from '../types/index';

export class CalendarService {
  /**
   * HTMLからスケジュールデータを抽出
   * @param htmlContent HTMLコンテンツ
   * @returns 抽出されたイベントデータ
   */
  extractScheduleFromHTML(htmlContent: string): CalendarEvent[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // script タグからJSONデータを探す
    const scriptTag = doc.querySelector('script[id="schedule-data"]');
    if (!scriptTag || !scriptTag.textContent) {
      return [];
    }

    try {
      const scheduleData = JSON.parse(scriptTag.textContent.trim());
      return Array.isArray(scheduleData) ? scheduleData : [];
    } catch (error) {
      console.error('スケジュールJSONの解析に失敗しました:', error);
      return [];
    }
  }

  /**
   * 指定された年月のカレンダーを生成
   * @param year 年
   * @param month 月（1-12）
   * @param events イベントデータ
   * @returns 週ごとに整理されたカレンダーデータ
   */
  generateMonthCalendar(year: number, month: number, events: CalendarEvent[]): WeekInfo[] {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const today = new Date();

    // カレンダーの開始日（月の最初の週の日曜日）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // カレンダーの終了日（月の最後の週の土曜日）
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const weeks: WeekInfo[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const week: WeekInfo = { dates: [] };

      for (let i = 0; i < 7; i++) {
        const dateEvents = this.getEventsForDate(currentDate, events);
        
        week.dates.push({
          date: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month - 1,
          isToday: this.isSameDate(currentDate, today),
          events: dateEvents
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return weeks;
  }

  /**
   * 指定された日付のイベントを取得
   * @param date 対象日付
   * @param events 全イベントデータ
   * @returns その日のイベント配列
   */
  private getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart; // endがundefinedの場合はstartと同じとする
      
      // 日付のみで比較（時間は無視）
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
      
      return targetDate >= startDate && targetDate <= endDate;
    });
  }

  /**
   * 2つの日付が同じ日かどうかを判定
   * @param date1 日付1
   * @param date2 日付2
   * @returns 同じ日の場合true
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * 月の名前を取得
   * @param month 月（1-12）
   * @returns 月の名前
   */
  getMonthName(month: number): string {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1] || '';
  }

  /**
   * 曜日の名前を取得
   * @returns 曜日名の配列
   */
  getDayNames(): string[] {
    return ['日', '月', '火', '水', '木', '金', '土'];
  }
}

export const calendarService = new CalendarService();