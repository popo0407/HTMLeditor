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
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [localTableData, setLocalTableData] = useState<TableData>(tableData);
  const [moveDirection, setMoveDirection] = useState<'left' | 'right' | 'up' | 'down' | 'tab' | 'shift-tab' | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // 表データの同期
  useEffect(() => {
    setLocalTableData(tableData);
  }, [tableData]);

  // セルフォーカス（常に編集可能）
  const handleCellFocus = useCallback((row: number, col: number) => {
    setFocusedCell({ row, col });
  }, []);

  // セル編集
  const handleCellEdit = useCallback((row: number, col: number, value: string) => {
    const newTableData = { ...localTableData };
    newTableData.rows[row][col] = value;
    setLocalTableData(newTableData);
    onTableChange(newTableData);
  }, [localTableData, onTableChange]);

  // キーボードナビゲーション（Word風）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { row, col } = focusedCell;
    const maxRow = localTableData.rows.length - 1;
    const maxCol = localTableData.rows[0]?.length - 1;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          setMoveDirection('up');
          setFocusedCell({ row: row - 1, col });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < maxRow) {
          setMoveDirection('down');
          setFocusedCell({ row: row + 1, col });
        }
        break;
      case 'ArrowLeft':
        // 左キーはセル内の文字移動または左のセルに移動
        // この処理はEditableCell内で行う
        break;
      case 'ArrowRight':
        // 右キーはセル内の文字移動または右のセルに移動
        // この処理はEditableCell内で行う
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: 前のセルに移動
          setMoveDirection('shift-tab');
          if (col > 0) {
            setFocusedCell({ row, col: col - 1 });
          } else if (row > 0) {
            setFocusedCell({ row: row - 1, col: maxCol });
          }
        } else {
          // Tab: 次のセルに移動
          setMoveDirection('tab');
          if (col < maxCol) {
            setFocusedCell({ row, col: col + 1 });
          } else if (row < maxRow) {
            setFocusedCell({ row: row + 1, col: 0 });
          }
        }
        break;
      case 'Enter':
        if (e.ctrlKey) {
          // Ctrl+Enter: 新しい行を追加
          e.preventDefault();
          const newTableData = { ...localTableData };
          const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
          newTableData.rows.splice(row + 1, 0, newRow);
          setLocalTableData(newTableData);
          onTableChange(newTableData);
          setFocusedCell({ row: row + 1, col });
        }
        // 通常のEnterは改行として処理（セル内で改行）
        break;
    }
  }, [focusedCell, localTableData.rows, onTableChange]);

  // 行追加（フォーカス行の下に追加）
  const handleAddRow = useCallback(() => {
    const newTableData = { ...localTableData };
    const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
    
    // フォーカスされている行がある場合はその下に、なければ最後に追加
    const insertIndex = focusedCell.row >= 0 ? focusedCell.row + 1 : newTableData.rows.length;
    newTableData.rows.splice(insertIndex, 0, newRow);
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
    
    // 新しい行の同じ列にフォーカスを移動
    setFocusedCell({ row: insertIndex, col: focusedCell.col });
  }, [localTableData, focusedCell, onTableChange]);

  // 列追加（フォーカス列の右に追加）
  const handleAddColumn = useCallback(() => {
    const newTableData = { ...localTableData };
    
    // フォーカスされている列がある場合はその右に、なければ最後に追加
    const insertIndex = focusedCell.col >= 0 ? focusedCell.col + 1 : newTableData.rows[0]?.length || 0;
    newTableData.rows.forEach(row => row.splice(insertIndex, 0, ''));
    
    setLocalTableData(newTableData);
    onTableChange(newTableData);
    
    // 新しい列の同じ行にフォーカスを移動
    setFocusedCell({ row: focusedCell.row, col: insertIndex });
  }, [localTableData, focusedCell, onTableChange]);

  // 行削除
  const handleDeleteRow = useCallback(() => {
    if (localTableData.rows.length > 1) {
      const newTableData = { ...localTableData };
      newTableData.rows.splice(focusedCell.row, 1);
      setLocalTableData(newTableData);
      onTableChange(newTableData);
      // フォーカス位置を調整
      if (focusedCell.row >= newTableData.rows.length) {
        setFocusedCell({ row: newTableData.rows.length - 1, col: focusedCell.col });
      }
    }
  }, [localTableData, focusedCell, onTableChange]);

  // 列削除
  const handleDeleteColumn = useCallback(() => {
    if (localTableData.rows[0]?.length > 1) {
      const newTableData = { ...localTableData };
      newTableData.rows.forEach(row => row.splice(focusedCell.col, 1));
      setLocalTableData(newTableData);
      onTableChange(newTableData);
      // フォーカス位置を調整
      if (focusedCell.col >= newTableData.rows[0]?.length) {
        setFocusedCell({ row: focusedCell.row, col: newTableData.rows[0]?.length - 1 });
      }
    }
  }, [localTableData, focusedCell, onTableChange]);

  // 編集可能セルコンポーネント
  const EditableCell: React.FC<{ row: number; col: number; value: string }> = ({ row, col, value }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isFocused = focusedCell.row === row && focusedCell.col === col;

    useEffect(() => {
      if (isFocused && inputRef.current) {
        inputRef.current.focus();
        // フォーカス時にカーソル位置を設定
        if (focusedCell.row === row && focusedCell.col === col) {
          const textLength = inputRef.current.value.length;
          
          // 移動方向に応じてカーソル位置を設定
          switch (moveDirection) {
            case 'left':
              // 左キーで移動した場合は文末にカーソルを配置
              inputRef.current.setSelectionRange(textLength, textLength);
              break;
            case 'right':
              // 右キーで移動した場合は文頭にカーソルを配置
              inputRef.current.setSelectionRange(0, 0);
              break;
            case 'up':
            case 'down':
            case 'tab':
            case 'shift-tab':
            default:
              // その他の移動はデフォルト位置（文頭）
              inputRef.current.setSelectionRange(0, 0);
              break;
          }
          
          // 移動方向をリセット
          setMoveDirection(null);
        }
      }
    }, [isFocused, focusedCell.row, focusedCell.col, row, col, moveDirection]);

    const handleClick = () => {
      handleCellFocus(row, col);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleCellEdit(row, col, e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: 前のセルに移動
          const maxRow = localTableData.rows.length - 1;
          const maxCol = localTableData.rows[0]?.length - 1;
          if (col > 0) {
            setFocusedCell({ row, col: col - 1 });
          } else if (row > 0) {
            setFocusedCell({ row: row - 1, col: maxCol });
          }
        } else {
          // Tab: 次のセルに移動
          const maxRow = localTableData.rows.length - 1;
          const maxCol = localTableData.rows[0]?.length - 1;
          if (col < maxCol) {
            setFocusedCell({ row, col: col + 1 });
          } else if (row < maxRow) {
            setFocusedCell({ row: row + 1, col: 0 });
          }
        }
      } else if (e.key === 'Enter' && e.ctrlKey) {
        // Ctrl+Enter: 新しい行を追加
        e.preventDefault();
        const newTableData = { ...localTableData };
        const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
        newTableData.rows.splice(row + 1, 0, newRow);
        setLocalTableData(newTableData);
        onTableChange(newTableData);
        setFocusedCell({ row: row + 1, col });
      } else if (e.key === 'ArrowLeft') {
        // 左キー: 文頭以外はセル内の左の文字に移動、文頭だったら左のセルの文末に移動
        const input = e.target as HTMLInputElement;
        const selectionStart = input.selectionStart ?? 0;
        if (selectionStart > 0) {
          // セル内で左に移動可能な場合は何もしない（デフォルト動作）
          return;
        } else {
          // 文頭の場合は左のセルに移動
          e.preventDefault();
          const maxRow = localTableData.rows.length - 1;
          const maxCol = localTableData.rows[0]?.length - 1;
          if (col > 0) {
            setMoveDirection('left');
            setFocusedCell({ row, col: col - 1 });
            // 左のセルに移動後、カーソルを文末に配置
            setTimeout(() => {
              const prevInput = document.querySelector(`[data-row="${row}"][data-col="${col - 1}"] input`) as HTMLInputElement;
              if (prevInput) {
                const textLength = prevInput.value.length;
                prevInput.setSelectionRange(textLength, textLength);
              }
            }, 0);
          } else if (row > 0) {
            setMoveDirection('left');
            setFocusedCell({ row: row - 1, col: maxCol });
            // 前の行の最後のセルに移動後、カーソルを文末に配置
            setTimeout(() => {
              const prevInput = document.querySelector(`[data-row="${row - 1}"][data-col="${maxCol}"] input`) as HTMLInputElement;
              if (prevInput) {
                const textLength = prevInput.value.length;
                prevInput.setSelectionRange(textLength, textLength);
              }
            }, 0);
          }
        }
      } else if (e.key === 'ArrowRight') {
        // 右キー: 文末以外はセル内の右の文字に移動、文末だったら右のセルの文頭に移動
        const input = e.target as HTMLInputElement;
        const selectionStart = input.selectionStart ?? 0;
        if (selectionStart < input.value.length) {
          // セル内で右に移動可能な場合は何もしない（デフォルト動作）
          return;
        } else {
          // 文末の場合は右のセルに移動
          e.preventDefault();
          const maxRow = localTableData.rows.length - 1;
          const maxCol = localTableData.rows[0]?.length - 1;
          if (col < maxCol) {
            setMoveDirection('right');
            setFocusedCell({ row, col: col + 1 });
            // 次のセルに移動後、カーソルを文頭に配置
            setTimeout(() => {
              const nextInput = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"] input`) as HTMLInputElement;
              if (nextInput) {
                nextInput.setSelectionRange(0, 0);
              }
            }, 0);
          } else if (row < maxRow) {
            setMoveDirection('right');
            setFocusedCell({ row: row + 1, col: 0 });
            // 次の行の最初のセルに移動後、カーソルを文頭に配置
            setTimeout(() => {
              const nextInput = document.querySelector(`[data-row="${row + 1}"][data-col="0"] input`) as HTMLInputElement;
              if (nextInput) {
                nextInput.setSelectionRange(0, 0);
              }
            }, 0);
          }
        }
      }
      // 通常のEnterは改行として処理（セル内で改行）
    };

    return (
      <td
        className={`simple-table-cell ${isFocused ? 'focused' : ''}`}
        onClick={handleClick}
        data-row={row}
        data-col={col}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="cell-input"
          placeholder=""
        />
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