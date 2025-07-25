/**
 * カレンダー機能関連の型定義
 * 
 * 開発憲章の「設定とロジックの分離」に従い、
 * カレンダー専用の型定義を独立したファイルで管理
 */

// カレンダーイベントオブジェクト
export interface CalendarEvent {
  id: string;           // evt-20250723-01 形式のユニークID
  title: string;        // プロジェクトA定例 等の予定タイトル
  start: string;        // 2025-07-23 形式の開始日
  end?: string;         // 2025-07-25 形式の終了日（任意）
  color?: string;       // 色指定（今回は固定色使用）
}

// カレンダーブロックのデータ構造
export interface CalendarData {
  events: CalendarEvent[];
  viewMode: 'month';     // 今回は月表示のみ
}

// 日付セル情報
export interface DateCellInfo {
  date: string;          // YYYY-MM-DD形式
  day: number;           // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  events: CalendarEvent[];
}

// カレンダー表示用の週情報
export interface WeekInfo {
  dates: DateCellInfo[];
}
