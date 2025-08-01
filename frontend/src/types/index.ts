/**
 * アプリケーション全体で使用する型定義
 * 
 * 開発憲章の「設定とロジックの分離」に従い、
 * 型定義を独立したファイルで管理
 */

// Wordライクエディタ用の型定義
export interface EditorContent {
  html: string;
  text: string;
  formats: any;
}

// テーブルデータ構造
export interface TableData {
  rows: string[][];
  hasHeaderRow?: boolean;
  hasHeaderColumn?: boolean;
}

// UI状態管理用の型
export interface AppState {
  content: string;
  isEditing: boolean;
}

// メール送信用の型定義
export interface MailSendRequest {
  recipient_email: string;
  subject: string;
  html_content: string;
}
