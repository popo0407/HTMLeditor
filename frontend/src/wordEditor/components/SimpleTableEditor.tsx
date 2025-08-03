import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TableData } from '../types/wordEditorTypes';
import './SimpleTableEditor.css';

interface SimpleTableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
}

export const SimpleTableEditor: React.FC<SimpleTableEditorProps> = ({
  tableData,
  onTableChange,
  onTableDelete,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [localTableData, setLocalTableData] = useState<TableData>(tableData);
  const tableRef = useRef<HTMLDivElement>(null);

  // 表データの同期
  useEffect(() => {
    setLocalTableData(tableData);
  }, [tableData]);

  // セルクリックで編集開始（ワンクリックで編集モード）
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setIsEditing(true);
  }, []);

  // セル編集
  const handleCellEdit = useCallback((row: number, col: number, value: string) => {
    const newTableData = { ...localTableData };
    newTableData.rows[row][col] = value;
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // キーボードナビゲーション（Excel/Word風）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditing) {
      const { row, col } = selectedCell;
      const maxRow = localTableData.rows.length - 1;
      const maxCol = localTableData.rows[0]?.length - 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (row > 0) {
            setSelectedCell({ row: row - 1, col });
            setIsEditing(true); // 移動後に自動的に編集モード
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (row < maxRow) {
            setSelectedCell({ row: row + 1, col });
            setIsEditing(true); // 移動後に自動的に編集モード
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (col > 0) {
            setSelectedCell({ row, col: col - 1 });
            setIsEditing(true); // 移動後に自動的に編集モード
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (col < maxCol) {
            setSelectedCell({ row, col: col + 1 });
            setIsEditing(true); // 移動後に自動的に編集モード
          }
          break;
        case 'Enter':
        case 'F2':
          e.preventDefault();
          setIsEditing(true);
          break;
      }
    }
  }, [isEditing, selectedCell, localTableData.rows]);

  // 行追加（選択行の下に追加）
  const handleAddRow = useCallback(() => {
    const newTableData = { ...localTableData };
    const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
    
    // 選択されている行がある場合はその下に、なければ最後に追加
    const insertIndex = selectedCell.row >= 0 ? selectedCell.row + 1 : newTableData.rows.length;
    newTableData.rows.splice(insertIndex, 0, newRow);
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
    
    // 新しい行の同じ列に選択を移動
    setSelectedCell({ row: insertIndex, col: selectedCell.col });
  }, [localTableData, selectedCell, onTableChange]);

  // 列追加（選択列の右に追加）
  const handleAddColumn = useCallback(() => {
    const newTableData = { ...localTableData };
    
    // 選択されている列がある場合はその右に、なければ最後に追加
    const insertIndex = selectedCell.col >= 0 ? selectedCell.col + 1 : newTableData.rows[0]?.length || 0;
    newTableData.rows.forEach(row => row.splice(insertIndex, 0, ''));
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
    
    // 新しい列の同じ行に選択を移動
    setSelectedCell({ row: selectedCell.row, col: insertIndex });
  }, [localTableData, selectedCell, onTableChange]);

  // 行削除
  const handleDeleteRow = useCallback(() => {
    if (localTableData.rows.length > 1) {
      const newTableData = { ...localTableData };
      newTableData.rows.splice(selectedCell.row, 1);
      setLocalTableData(newTableData);
      onTableChange(newTableData);
      // 選択位置を調整
      if (selectedCell.row >= newTableData.rows.length) {
        setSelectedCell({ row: newTableData.rows.length - 1, col: selectedCell.col });
      }
    }
  }, [localTableData, selectedCell, onTableChange]);

  // 列削除
  const handleDeleteColumn = useCallback(() => {
    if (localTableData.rows[0]?.length > 1) {
      const newTableData = { ...localTableData };
      newTableData.rows.forEach(row => row.splice(selectedCell.col, 1));
      setLocalTableData(newTableData);
      onTableChange(newTableData);
      // 選択位置を調整
      if (selectedCell.col >= newTableData.rows[0]?.length) {
        setSelectedCell({ row: selectedCell.row, col: newTableData.rows[0]?.length - 1 });
      }
    }
  }, [localTableData, selectedCell, onTableChange]);

  // 編集可能セルコンポーネント
  const EditableCell: React.FC<{ row: number; col: number; value: string }> = ({ row, col, value }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelected = selectedCell.row === row && selectedCell.col === col;

    useEffect(() => {
      if (isSelected && isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isSelected, isEditing]);

    const handleClick = () => {
      handleCellClick(row, col);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleCellEdit(row, col, e.target.value);
    };

    const handleInputBlur = () => {
      setIsEditing(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        // 次のセルに移動
        const maxRow = localTableData.rows.length - 1;
        const maxCol = localTableData.rows[0]?.length - 1;
        if (col < maxCol) {
          setSelectedCell({ row, col: col + 1 });
        } else if (row < maxRow) {
          setSelectedCell({ row: row + 1, col: 0 });
        }
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };

    return (
      <td
        className={`simple-table-cell ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
      >
        {isSelected && isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="cell-input"
          />
        ) : (
          <span className="cell-content">{value}</span>
        )}
      </td>
    );
  };

  return (
    <div className="simple-table-editor" ref={tableRef} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="table-layout">
        <div className="table-container">
          <table className="simple-table">
            <tbody>
              {localTableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <EditableCell
                      key={`${rowIndex}-${colIndex}`}
                      row={rowIndex}
                      col={colIndex}
                      value={cell}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-controls">
          <button onClick={handleAddRow} className="control-button">
            行追加（選択行の下）
          </button>
          <button onClick={handleAddColumn} className="control-button">
            列追加（選択列の右）
          </button>
          <button onClick={handleDeleteRow} className="control-button">
            行削除
          </button>
          <button onClick={handleDeleteColumn} className="control-button">
            列削除
          </button>
          <button onClick={onTableDelete} className="control-button delete">
            表削除
          </button>
        </div>
      </div>
    </div>
  );
}; 