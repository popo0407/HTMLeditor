// Wordライクエディタ用の型定義

export interface EditorContent {
  content: string;
  formats: EditorFormats;
  tableData?: TableData;
}

export interface EditorFormats {
  heading: 'h1' | 'h2' | 'h3' | 'p';
  emphasis: 'normal' | 'important' | 'action-item';
  inline: {
    bold: boolean;
    underline: boolean;
  };
  paragraph: {
    indent: number;
  };
  table: {
    rows: number;
    cols: number;
    hasHeaderRow: boolean;
    hasHeaderCol: boolean;
    cellMerges: CellMerge[];
    styles: TableStyles;
  };
}

export interface TableData {
  rows: string[][];
  headers: string[];
  styles: TableStyles;
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

export interface HtmlImportResult {
  success: boolean;
  content?: EditorContent;
  errors?: string[];
  warnings?: string[];
}

export interface WordLikeEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  onTableInsert?: () => void;
  onHtmlImport?: (html: string) => void;
}

export interface WordLikeEditorState {
  content: string;
  formats: EditorFormats;
  isEditing: boolean;
  tableData?: TableData;
  importResult?: HtmlImportResult;
}

export interface TableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
  onCellMerge: (merge: CellMerge) => void;
  onCellSplit: (row: number, col: number) => void;
}

export interface TableEditorState {
  selectedCell: { row: number; col: number };
  isEditing: boolean;
  isSelecting: boolean;
  selectionStart?: { row: number; col: number };
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

// キーボードショートカットの型定義
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

// Quill.jsの型定義
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
}

// メール送信用の型定義
export interface MailSendRequest {
  recipient_email: string;
  subject: string;
  html_content: string;
} 