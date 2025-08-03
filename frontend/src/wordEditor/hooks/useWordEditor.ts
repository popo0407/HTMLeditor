import { useState, useCallback, useRef } from 'react';
import { EditorContent, EditorFormats, TableData } from '../types/wordEditorTypes';

export interface UseWordEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export interface UseWordEditorReturn {
  content: string;
  formats: EditorFormats;
  isEditing: boolean;
  tableData?: TableData;
  setContent: (content: string) => void;
  setFormats: (formats: Partial<EditorFormats> | ((prev: EditorFormats) => EditorFormats)) => void;
  setIsEditing: (isEditing: boolean) => void;
  setTableData: (tableData?: TableData) => void;
  insertTable: (rows?: number, cols?: number) => void;
  updateTableData: (tableData: TableData) => void;
  deleteTable: () => void;
  getEditorContent: () => EditorContent;
}

export const useWordEditor = ({ initialContent = '', onContentChange }: UseWordEditorProps): UseWordEditorReturn => {
  const [content, setContentState] = useState(initialContent);
  const [formats, setFormatsState] = useState<EditorFormats>({
    heading: 'p',
    emphasis: 'normal',
    inline: {
      bold: false,
      underline: false,
    },
    paragraph: {
      indent: 0,
    },
    table: {
      rows: 0,
      cols: 0,
      hasHeaderRow: false,
      hasHeaderCol: false,
      cellMerges: [],
      styles: {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#f0f0f0',
        alignment: 'left',
        cellPadding: 8,
      },
    },
  });
  const [isEditing, setIsEditingState] = useState(false);
  const [tableData, setTableDataState] = useState<TableData | undefined>();

  const quillRef = useRef<any>(null);

  // コンテンツ設定
  const setContent = useCallback((newContent: string) => {
    console.log('setContent called:', newContent.length, 'characters');
    setContentState(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [onContentChange]);

  // フォーマット設定
  const setFormats = useCallback((newFormats: Partial<EditorFormats> | ((prev: EditorFormats) => EditorFormats)) => {
    console.log('setFormats called with:', newFormats);
    setFormatsState(prev => {
      const result = typeof newFormats === 'function' ? newFormats(prev) : { ...prev, ...newFormats };
      console.log('Formats updated from:', prev, 'to:', result);
      return result;
    });
  }, []);

  // 編集状態設定
  const setIsEditing = useCallback((editing: boolean) => {
    console.log('setIsEditing called:', editing);
    setIsEditingState(editing);
  }, []);

  // 表データ設定
  const setTableData = useCallback((data?: TableData) => {
    console.log('setTableData called:', data);
    setTableDataState(data);
  }, []);

  // 表挿入
  const insertTable = useCallback((rows = 3, cols = 3) => {
    console.log('insertTable called:', rows, 'x', cols);
    const newTableData: TableData = {
      rows: Array(rows).fill(null).map(() => Array(cols).fill('')),
      headers: Array(cols).fill(''),
      styles: {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#f0f0f0',
        alignment: 'left',
        cellPadding: 8,
      },
    };
    setTableDataState(newTableData);
  }, []);

  // 表データ更新
  const updateTableData = useCallback((newTableData: TableData) => {
    console.log('updateTableData called:', newTableData);
    setTableDataState(newTableData);
  }, []);

  // 表削除
  const deleteTable = useCallback(() => {
    console.log('deleteTable called');
    setTableDataState(undefined);
  }, []);

  // エディタコンテンツ取得
  const getEditorContent = useCallback((): EditorContent => {
    return {
      content,
      formats,
    };
  }, [content, formats]);

  return {
    content,
    formats,
    isEditing,
    tableData,
    setContent,
    setFormats,
    setIsEditing,
    setTableData,
    insertTable,
    updateTableData,
    deleteTable,
    getEditorContent,
  };
}; 