import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TableData, CellMerge, TableEditorProps, TableEditorState } from '../types/wordEditorTypes';
import './TableEditor.css';

export const TableEditor: React.FC<TableEditorProps> = ({
  tableData,
  onTableChange,
  onTableDelete,
  onCellMerge,
  onCellSplit,
}) => {
  const [state, setState] = useState<TableEditorState>({
    selectedCell: { row: 0, col: 0 },
    isEditing: false,
    isSelecting: false,
  });

  const [localTableData, setLocalTableData] = useState<TableData>(tableData);
  const tableRef = useRef<HTMLDivElement>(null);

  // 表データの同期
  useEffect(() => {
    setLocalTableData(tableData);
  }, [tableData]);

  // セル選択
  const handleCellClick = useCallback((row: number, col: number) => {
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      isSelecting: false,
      selectionStart: undefined,
    }));
  }, []);

  // セル選択開始
  const handleCellMouseDown = useCallback((row: number, col: number) => {
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      isSelecting: true,
      selectionStart: { row, col },
    }));
  }, []);

  // セル選択中
  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (state.isSelecting && state.selectionStart) {
      setState(prev => ({
        ...prev,
        selectedCell: { row, col },
      }));
    }
  }, [state.isSelecting, state.selectionStart]);

  // セル選択終了
  const handleCellMouseUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSelecting: false,
    }));
  }, []);

  // セル編集開始
  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      isEditing: true,
    }));
  }, []);

  // セル編集
  const handleCellEdit = useCallback((row: number, col: number, value: string) => {
    const newTableData = { ...localTableData };
    newTableData.rows[row][col] = value;
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // 行追加
  const handleAddRow = useCallback((position: 'above' | 'below') => {
    const newTableData = { ...localTableData };
    const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
    
    if (position === 'above') {
      newTableData.rows.unshift(newRow);
    } else {
      newTableData.rows.push(newRow);
    }
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // 列追加
  const handleAddColumn = useCallback((position: 'left' | 'right') => {
    const newTableData = { ...localTableData };
    
    if (position === 'left') {
      newTableData.rows.forEach(row => row.unshift(''));
      if (newTableData.headers) {
        newTableData.headers.unshift('');
      }
    } else {
      newTableData.rows.forEach(row => row.push(''));
      if (newTableData.headers) {
        newTableData.headers.push('');
      }
    }
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // 行削除
  const handleDeleteRow = useCallback((rowIndex: number) => {
    const newTableData = { ...localTableData };
    newTableData.rows.splice(rowIndex, 1);
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // 列削除
  const handleDeleteColumn = useCallback((colIndex: number) => {
    const newTableData = { ...localTableData };
    newTableData.rows.forEach(row => row.splice(colIndex, 1));
    if (newTableData.headers) {
      newTableData.headers.splice(colIndex, 1);
    }
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // セル結合
  const handleMergeCells = useCallback(() => {
    if (state.selectionStart && state.selectedCell && onCellMerge) {
      const startRow = Math.min(state.selectionStart.row, state.selectedCell.row);
      const endRow = Math.max(state.selectionStart.row, state.selectedCell.row);
      const startCol = Math.min(state.selectionStart.col, state.selectedCell.col);
      const endCol = Math.max(state.selectionStart.col, state.selectedCell.col);

      const merge: CellMerge = {
        row: startRow,
        col: startCol,
        rowSpan: endRow - startRow + 1,
        colSpan: endCol - startCol + 1,
      };

      onCellMerge(merge);
    }
  }, [state.selectionStart, state.selectedCell, onCellMerge]);

  // セル分割
  const handleSplitCell = useCallback((row: number, col: number) => {
    if (onCellSplit) {
      onCellSplit(row, col);
    }
  }, [onCellSplit]);

  // キーボードナビゲーション
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { selectedCell } = state;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (selectedCell.row > 0) {
          setState(prev => ({
            ...prev,
            selectedCell: { ...selectedCell, row: selectedCell.row - 1 },
          }));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (selectedCell.row < localTableData.rows.length - 1) {
          setState(prev => ({
            ...prev,
            selectedCell: { ...selectedCell, row: selectedCell.row + 1 },
          }));
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedCell.col > 0) {
          setState(prev => ({
            ...prev,
            selectedCell: { ...selectedCell, col: selectedCell.col - 1 },
          }));
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedCell.col < localTableData.rows[0].length - 1) {
          setState(prev => ({
            ...prev,
            selectedCell: { ...selectedCell, col: selectedCell.col + 1 },
          }));
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // 前のセル
          if (selectedCell.col > 0) {
            setState(prev => ({
              ...prev,
              selectedCell: { ...selectedCell, col: selectedCell.col - 1 },
            }));
          } else if (selectedCell.row > 0) {
            setState(prev => ({
              ...prev,
              selectedCell: { row: selectedCell.row - 1, col: localTableData.rows[0].length - 1 },
            }));
          }
        } else {
          // 次のセル
          if (selectedCell.col < localTableData.rows[0].length - 1) {
            setState(prev => ({
              ...prev,
              selectedCell: { ...selectedCell, col: selectedCell.col + 1 },
            }));
          } else if (selectedCell.row < localTableData.rows.length - 1) {
            setState(prev => ({
              ...prev,
              selectedCell: { row: selectedCell.row + 1, col: 0 },
            }));
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        setState(prev => ({ ...prev, isEditing: true }));
        break;
      case 'Delete':
      case 'Backspace':
        if (!state.isEditing) {
          e.preventDefault();
          handleCellEdit(selectedCell.row, selectedCell.col, '');
        }
        break;
    }
  }, [state, localTableData.rows.length, handleCellEdit]);

  // コンテキストメニュー
  const handleContextMenu = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
    }));
  }, []);

  // セル編集コンポーネント
  const EditableCell: React.FC<{ row: number; col: number; value: string }> = ({ row, col, value }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const isSelected = state.selectedCell.row === row && state.selectedCell.col === col;

    useEffect(() => {
      setEditValue(value);
    }, [value]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    };

    const handleInputBlur = () => {
      setIsEditing(false);
      handleCellEdit(row, col, editValue);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        handleCellEdit(row, col, editValue);
        // 次のセルに移動
        if (col < localTableData.rows[0].length - 1) {
          setState(prev => ({
            ...prev,
            selectedCell: { row, col: col + 1 },
          }));
        } else if (row < localTableData.rows.length - 1) {
          setState(prev => ({
            ...prev,
            selectedCell: { row: row + 1, col: 0 },
          }));
        }
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(value);
      }
    };

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="table-cell-input"
        />
      );
    }

    return (
      <div
        className={`table-cell ${isSelected ? 'selected' : ''}`}
        onClick={() => handleCellClick(row, col)}
        onMouseDown={() => handleCellMouseDown(row, col)}
        onMouseEnter={() => handleCellMouseEnter(row, col)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => handleContextMenu(e, row, col)}
      >
        {value}
      </div>
    );
  };

  return (
    <div className="table-editor" ref={tableRef} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="table-toolbar">
        <button onClick={() => handleAddRow('above')}>+ 行（上）</button>
        <button onClick={() => handleAddRow('below')}>+ 行（下）</button>
        <button onClick={() => handleAddColumn('left')}>+ 列（左）</button>
        <button onClick={() => handleAddColumn('right')}>+ 列（右）</button>
        <button onClick={() => handleDeleteRow(state.selectedCell.row)}>- 行</button>
        <button onClick={() => handleDeleteColumn(state.selectedCell.col)}>- 列</button>
        <button onClick={handleMergeCells}>セル結合</button>
        <button onClick={() => handleSplitCell(state.selectedCell.row, state.selectedCell.col)}>セル分割</button>
        <button onClick={onTableDelete} className="delete-table">表削除</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {localTableData.headers?.map((header, colIndex) => (
                <th key={colIndex} className="table-header">
                  {header}
                </th>
              )) || []}
            </tr>
          </thead>
          <tbody>
            {localTableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="table-row">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="table-cell-container">
                    <EditableCell
                      row={rowIndex}
                      col={colIndex}
                      value={cell}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-info">
        <p>選択セル: {state.selectedCell.row + 1}行目, {state.selectedCell.col + 1}列目</p>
        <p>表サイズ: {localTableData.rows.length}行 × {localTableData.rows[0]?.length || 0}列</p>
        <p>操作: クリックで選択、ダブルクリックで編集、矢印キーで移動、Tabで次のセル</p>
      </div>
    </div>
  );
}; 