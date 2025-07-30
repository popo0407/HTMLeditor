/**
 * アプリケーション全体で使用する型定義
 * 
 * 開発憲章の「設定とロジックの分離」に従い、
 * 型定義を独立したファイルで管理
 */

// ブロックエディタ関連の型定義
export type BlockType = 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'paragraph' 
  | 'image' 
  | 'table' 
  | 'horizontalRule'
  | 'calendar';

// ブロックに適用可能なスタイル
export type BlockStyle = 'normal' | 'important' | 'action-item';

// 共通ブロックプロパティインターフェース
export interface CommonBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onStyleChange?: (blockId: string, style: BlockStyle) => void;
  onTypeChange?: (blockId: string, type: BlockType) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

// テーブルデータ構造
export interface TableData {
  rows: string[][];
  hasHeaderRow?: boolean;
  hasHeaderColumn?: boolean;
}

// Calendar関連の型定義
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color?: string;
}

export interface DateInfo {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface WeekInfo {
  dates: DateInfo[];
}

export interface CalendarData {
  year: number;
  month: number;
  weeks: WeekInfo[];
  events?: CalendarEvent[];
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  style?: BlockStyle;
  src?: string; // 画像用
  tableData?: TableData; // テーブル用
  calendarData?: CalendarData; // カレンダー用
}



// UI状態管理用の型
export interface AppState {
  blocks: Block[];
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  previewHtml: string;
}
