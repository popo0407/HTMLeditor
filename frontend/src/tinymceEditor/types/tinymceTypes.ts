// TinyMCE エディタ関連の型定義

export interface TinyMCEEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  height?: number;
  className?: string;
}

export interface TinyMCEConfig {
  height?: number;
  menubar?: boolean;
  plugins?: string[];
  toolbar?: string | string[];
  content_style?: string;
  setup?: (editor: any) => void;
  [key: string]: any;
}

export interface IHtmlImportService {
  loadFromFile(file: File): Promise<string>;
  loadFromString(html: string): string;
  sanitizeHtml(html: string): string;
  validateFile(file: File): boolean;
  parseHtml(html: string): { title: string; content: string };
  loadWithErrorHandling(file: File): Promise<{ success: boolean; content?: string; error?: string }>;
}

export interface IHtmlExportService {
  exportToHtml(content: string): string;
  downloadHtml(content: string, filename?: string): void;
  copyToClipboard(content: string): Promise<void>;
}

export interface ITableService {
  insertTable(rows: number, cols: number): void;
  deleteTable(): void;
  insertRow(): void;
  deleteRow(): void;
  insertColumn(): void;
  deleteColumn(): void;
  mergeCells(): void;
  splitCells(): void;
}



export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface EditorActions {
  save: () => void;
  load: (content: string) => void;
  clear: () => void;
  export: () => void;
  import: (file: File) => Promise<void>;
}

// エディタイベント型
export interface EditorEvent {
  type: string;
  target: any;
  data?: any;
}

// フォーマット型
export interface FormatOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  format?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: string;
  backgroundColor?: string;
}

// 表セル型
export interface TableCell {
  row: number;
  col: number;
  content: string;
  colspan?: number;
  rowspan?: number;
}

// 表型
export interface Table {
  rows: number;
  cols: number;
  cells: TableCell[][];
  className?: string;
  style?: string;
}

// エクスポートオプション
export interface ExportOptions {
  format: 'html' | 'text' | 'pdf';
  includeStyles?: boolean;
  filename?: string;
}

// インポートオプション
export interface ImportOptions {
  format: 'html' | 'text';
  sanitize?: boolean;
  preserveFormatting?: boolean;
} 