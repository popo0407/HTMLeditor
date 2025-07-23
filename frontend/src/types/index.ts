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
  | 'bulletList' 
  | 'image' 
  | 'table' 
  | 'horizontalRule';

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
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

// テーブルデータ構造
export interface TableData {
  rows: string[][];
  hasHeaderRow?: boolean;
  hasHeaderColumn?: boolean;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  style?: BlockStyle;
  src?: string; // 画像用
  tableData?: TableData; // テーブル用
}

// アドレス帳関連の型定義
export interface Contact {
  id: number;
  common_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface CommonID {
  id: number;
  common_id: string;
  created_at: string;
  updated_at?: string;
  contacts: Contact[];
}

export interface AddressBookValidation {
  exists: boolean;
  common_id: string;
  contacts: Contact[];
}

// API リクエスト/レスポンス型
export interface ContactCreateRequest {
  name: string;
  email: string;
}

export interface AddressBookValidationRequest {
  common_id: string;
}

// UI状態管理用の型
export interface AppState {
  blocks: Block[];
  selectedBlockId: string | null;
  currentCommonId: string | null;
  contacts: Contact[];
  isPreviewMode: boolean;
}
