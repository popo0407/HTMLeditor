// Wordライクエディタ用の型定義

// ===== エディタコンテンツ関連 =====
export interface EditorContent {
  content: string;
  formats: EditorFormats;
}

export interface EditorFormats {
  heading: HeadingLevel;
  emphasis: EmphasisStyle;
  inline: InlineFormats;
  paragraph: ParagraphFormats;
  table: TableFormats;
}

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'p';
export type EmphasisStyle = 'normal' | 'important' | 'action-item';

export interface InlineFormats {
  bold: boolean;
  underline: boolean;
}

export interface ParagraphFormats {
  indent: number;
}

export interface TableFormats {
  rows: number;
  cols: number;
  hasHeaderRow: boolean;
  hasHeaderCol: boolean;
  cellMerges: CellMerge[];
  styles: TableStyles;
}

// ===== 表関連 =====
export interface TableData {
  rows: string[][];
  headers?: string[];
  styles?: TableStyles;
}

export interface CellMerge {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface TableStyles {
  borderColor: string;
  backgroundColor: string;
  headerBackgroundColor: string;
  alignment: 'left' | 'center' | 'right';
  cellPadding: number;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface TableSelection {
  start: CellPosition;
  end: CellPosition;
}

// ===== エディタセクション関連 =====
export type EditorSectionType = 'text' | 'table';

export interface EditorSection {
  id: string;
  type: EditorSectionType;
  content: string;
  tableData?: TableData;
}

export interface EditorSectionState {
  sections: EditorSection[];
  currentSectionId: string;
}

// ===== コンポーネントProps =====
export interface WordLikeEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  onTableInsert?: () => void;
  onHtmlImport?: (html: string) => void;
}

export interface SimpleTableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
}

export interface TableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
  onCellMerge?: (merge: CellMerge) => void;
  onCellSplit?: (row: number, col: number) => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onHeadingChange: (level: HeadingLevel) => void;
  onEmphasisChange: (style: EmphasisStyle) => void;
  onTableCreate: () => void;
  currentHeading: string;
  currentEmphasis: string;
}

// ===== 状態管理関連 =====
export interface WordLikeEditorState {
  content: string;
  formats: EditorFormats;
  isEditing: boolean;
  tableData?: TableData;
  importResult?: HtmlImportResult;
}

export interface TableEditorState {
  selectedCell: CellPosition;
  isEditing: boolean;
  isSelecting: boolean;
  selectionStart?: CellPosition;
}

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  savedSelection: any;
}

// ===== HTMLインポート関連 =====
export interface HtmlImportResult {
  success: boolean;
  content?: EditorContent;
  errors?: string[];
  warnings?: string[];
}

export interface HtmlImporterProps {
  onImport: (content: string) => void;
  onImportError: (error: string) => void;
}

export interface HtmlImporterState {
  isImporting: boolean;
  progress: number;
  importResult?: HtmlImportResult;
}

// ===== キーボードショートカット関連 =====
export type KeyboardShortcut = 
  | 'ctrl+b'
  | 'ctrl+u'
  | 'ctrl+z'
  | 'ctrl+y'
  | 'ctrl+t'
  | 'ctrl+shift+up'
  | 'ctrl+shift+down'
  | 'ctrl+shift+left'
  | 'ctrl+shift+right'
  | 'tab'
  | 'shift+tab';

export interface KeyboardHandler {
  (quill: any): void;
}

export interface KeyboardHandlers {
  [key: string]: KeyboardHandler;
}

export interface KeyboardShortcutsProps {
  quillRef: React.RefObject<any>;
  onTableAddRow?: (position: 'above' | 'below') => void;
  onTableAddColumn?: (position: 'left' | 'right') => void;
  onTableNextCell?: () => void;
  onTablePreviousCell?: () => void;
}

// ===== Quill.js関連 =====
export interface Quill {
  getContents(): any;
  setContents(contents: any): void;
  getText(): string;
  setText(text: string): void;
  getSelection(): { index: number; length: number } | null;
  setSelection(index: number, length?: number): void;
  format(format: string, value: any): void;
  formatLine(index: number, length: number, format: string, value: any): void;
  insertText(index: number, text: string, format?: any): void;
  deleteText(index: number, length: number): void;
  insertEmbed(index: number, type: string, value: any): void;
  getLine(index: number): any[];
  getFormat(index: number, length?: number): any;
  focus(): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

// ===== メール送信関連 =====
export interface MailSendRequest {
  recipient_email: string;
  subject: string;
  html_content: string;
}

// ===== イベントハンドラー型 =====
export type ContentChangeHandler = (value: string, delta: any, source: any, editor: any) => void;
export type FocusHandler = () => void;
export type KeyboardEventHandler = (e: React.KeyboardEvent) => void;
export type MouseEventHandler = (e: React.MouseEvent) => void; 