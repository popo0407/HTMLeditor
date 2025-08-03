import { useState, useCallback, useRef } from 'react';
import { TableData, CellMerge, TableEditorState, TableStyles } from '../types/wordEditorTypes';
import { tableService } from '../services/tableService';

export interface UseTableEditorProps {
  initialTableData?: TableData;
  onTableChange?: (tableData: TableData) => void;
  onTableDelete?: () => void;
}

export interface UseTableEditorReturn {
  tableData: TableData | null;
  state: TableEditorState;
  setTableData: (tableData: TableData | null) => void;
  createTable: (rows: number, cols: number) => void;
  addRow: (position: 'above' | 'below', rowIndex?: number) => void;
  addColumn: (position: 'left' | 'right', colIndex?: number) => void;
  deleteRow: (rowIndex: number) => void;
  deleteColumn: (colIndex: number) => void;
  updateCell: (row: number, col: number, value: string) => void;
  mergeCells: (merge: CellMerge) => void;
  splitCell: (row: number, col: number) => void;
  updateStyles: (styles: Partial<TableStyles>) => void;
  selectCell: (row: number, col: number) => void;
  startSelection: (row: number, col: number) => void;
  endSelection: () => void;
  validateTable: () => { isValid: boolean; errors: string[] };
  exportToHtml: () => string;
  importFromHtml: (html: string) => boolean;
}

export const useTableEditor = ({
  initialTableData,
  onTableChange,
  onTableDelete,
}: UseTableEditorProps): UseTableEditorReturn => {
  const [tableData, setTableDataState] = useState<TableData | null>(initialTableData || null);
  const [state, setState] = useState<TableEditorState>({
    selectedCell: { row: 0, col: 0 },
    isEditing: false,
    isSelecting: false,
  });

  const tableRef = useRef<HTMLDivElement>(null);

  // 表データ設定
  const setTableData = useCallback((newTableData: TableData | null) => {
    console.log('setTableData called:', newTableData);
    setTableDataState(newTableData);
    if (newTableData && onTableChange) {
      onTableChange(newTableData);
    }
  }, [onTableChange]);

  // 表作成
  const createTable = useCallback((rows: number, cols: number) => {
    console.log('createTable called:', rows, 'x', cols);
    const newTableData = tableService.createTable(rows, cols);
    setTableData(newTableData);
  }, [setTableData]);

  // 行追加
  const addRow = useCallback((position: 'above' | 'below', rowIndex?: number) => {
    if (!tableData) return;
    console.log('addRow called:', position, rowIndex);
    const newTableData = tableService.addRow(tableData, position, rowIndex);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // 列追加
  const addColumn = useCallback((position: 'left' | 'right', colIndex?: number) => {
    if (!tableData) return;
    console.log('addColumn called:', position, colIndex);
    const newTableData = tableService.addColumn(tableData, position, colIndex);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // 行削除
  const deleteRow = useCallback((rowIndex: number) => {
    if (!tableData) return;
    console.log('deleteRow called:', rowIndex);
    const newTableData = tableService.deleteRow(tableData, rowIndex);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // 列削除
  const deleteColumn = useCallback((colIndex: number) => {
    if (!tableData) return;
    console.log('deleteColumn called:', colIndex);
    const newTableData = tableService.deleteColumn(tableData, colIndex);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // セル更新
  const updateCell = useCallback((row: number, col: number, value: string) => {
    if (!tableData) return;
    console.log('updateCell called:', row, col, value);
    const newTableData = tableService.updateCell(tableData, row, col, value);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // セル結合
  const mergeCells = useCallback((merge: CellMerge) => {
    if (!tableData) return;
    console.log('mergeCells called:', merge);
    try {
      const newTableData = tableService.mergeCells(tableData, merge);
      setTableData(newTableData);
    } catch (error) {
      console.error('セル結合に失敗しました:', error);
    }
  }, [tableData, setTableData]);

  // セル分割
  const splitCell = useCallback((row: number, col: number) => {
    if (!tableData) return;
    console.log('splitCell called:', row, col);
    const newTableData = tableService.splitCell(tableData, row, col);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // スタイル更新
  const updateStyles = useCallback((styles: Partial<TableStyles>) => {
    if (!tableData) return;
    console.log('updateStyles called:', styles);
    const newTableData = tableService.updateStyles(tableData, styles);
    setTableData(newTableData);
  }, [tableData, setTableData]);

  // セル選択
  const selectCell = useCallback((row: number, col: number) => {
    console.log('selectCell called:', row, col);
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      isSelecting: false,
      selectionStart: undefined,
    }));
  }, []);

  // 選択開始
  const startSelection = useCallback((row: number, col: number) => {
    console.log('startSelection called:', row, col);
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      isSelecting: true,
      selectionStart: { row, col },
    }));
  }, []);

  // 選択終了
  const endSelection = useCallback(() => {
    console.log('endSelection called');
    setState(prev => ({
      ...prev,
      isSelecting: false,
    }));
  }, []);

  // 表検証
  const validateTable = useCallback(() => {
    if (!tableData) {
      return { isValid: false, errors: ['表が存在しません'] };
    }
    return tableService.validateTable(tableData);
  }, [tableData]);

  // HTMLエクスポート
  const exportToHtml = useCallback(() => {
    if (!tableData) return '';
    return tableService.exportToHtml(tableData);
  }, [tableData]);

  // HTMLインポート
  const importFromHtml = useCallback((html: string) => {
    console.log('importFromHtml called');
    const importedTableData = tableService.importFromHtml(html);
    if (importedTableData) {
      setTableData(importedTableData);
      return true;
    }
    return false;
  }, [setTableData]);

  return {
    tableData,
    state,
    setTableData,
    createTable,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    updateCell,
    mergeCells,
    splitCell,
    updateStyles,
    selectCell,
    startSelection,
    endSelection,
    validateTable,
    exportToHtml,
    importFromHtml,
  };
}; 