/**
 * テーブルブロックコンポーネント（編集機能付き）
 * 
 * 責務:
 * - テーブルの表示と編集
 * - 行・列の追加・削除
 * - セル内容の編集
 */

import React, { useRef, useEffect } from 'react';
import { CommonBlockProps, TableData } from '../../types';
import { BlockBase } from './BlockBase';
import { useTableInitializer } from '../../hooks/useTableInitializer';
import { BlockType, BlockStyle } from '../../types';

export const TableBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate, isSelected } = props;
  const tableRef = useRef<HTMLTableElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  
  // テーブル初期化ロジックをカスタムフックに分離
  const { tableData, setTableData } = useTableInitializer(block, onUpdate);

  // フォーカス状態が変更されたら編集モードに入る
  useEffect(() => {
    const now = Date.now();
    if (isSelected && (now - lastFocusTimeRef.current) > 50) {
      lastFocusTimeRef.current = now;
      // テーブルにフォーカスを設定
      if (tableRef.current) {
        const firstCell = tableRef.current.querySelector('td input, th input') as HTMLInputElement;
        if (firstCell) {
          firstCell.focus();
        }
      }
    }
  }, [isSelected]);

  // 行追加
  const addRow = () => {
    const newRow = Array(tableData.rows[0]?.length || 2).fill('新しいセル');
    setTableData({
      ...tableData,
      rows: [...tableData.rows, newRow]
    });
  };

  // 列追加
  const addColumn = () => {
    setTableData({
      ...tableData,
      rows: tableData.rows.map(row => [...row, '新しいセル'])
    });
  };

  // 行削除
  const deleteRow = (rowIndex: number) => {
    if (tableData.rows.length > 1) {
      setTableData({
        ...tableData,
        rows: tableData.rows.filter((_, index) => index !== rowIndex)
      });
    }
  };

  // 列削除
  const deleteColumn = (colIndex: number) => {
    if (tableData.rows[0]?.length > 1) {
      setTableData({
        ...tableData,
        rows: tableData.rows.map(row => row.filter((_, index) => index !== colIndex))
      });
    }
  };

  // セル編集
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableData.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;
    setTableData({
      ...tableData,
      rows: newRows
    });
  };

  // ヘッダー行設定
  const toggleHeaderRow = () => {
    setTableData({
      ...tableData,
      hasHeaderRow: !tableData.hasHeaderRow
    });
  };

  // ヘッダー列設定
  const toggleHeaderColumn = () => {
    setTableData({
      ...tableData,
      hasHeaderColumn: !tableData.hasHeaderColumn
    });
  };

  // キーボードイベントハンドラー
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 上下キーでブロック間移動（カーソル位置に関係なく）
    if (e.key === 'ArrowUp' && props.onMoveUp) {
      e.preventDefault();
      props.onMoveUp(block.id);
    }
    if (e.key === 'ArrowDown' && props.onMoveDown) {
      e.preventDefault();
      props.onMoveDown(block.id);
    }
    // Shift+Space: 強調切り替え
    if (e.shiftKey && e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // 現在の強調状態を取得して次の状態に切り替え
      const blockStyleOrder: BlockStyle[] = ['normal', 'important', 'action-item'];
      const currentStyle = block.style || 'normal';
      const currentIndex = blockStyleOrder.indexOf(currentStyle);
      const nextIndex = (currentIndex + 1) % blockStyleOrder.length;
      const nextStyle = blockStyleOrder[nextIndex];
      // 強調変更のコールバックを呼ぶ
      if (props.onStyleChange) {
        props.onStyleChange(block.id, nextStyle);
      }
    }
  };

  return (
    <BlockBase {...props}>
      <div className="table-block" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="table-controls">
          <button onClick={addRow} className="table-control-btn">+行</button>
          <button onClick={addColumn} className="table-control-btn">+列</button>
          <label>
            <input
              type="checkbox"
              checked={tableData.hasHeaderRow}
              onChange={toggleHeaderRow}
            />
            ヘッダー行
          </label>
          <label>
            <input
              type="checkbox"
              checked={tableData.hasHeaderColumn}
              onChange={toggleHeaderColumn}
            />
            ヘッダー列
          </label>
        </div>
        
        <div className="table-container">
          <table ref={tableRef} className={`table-editor ${block.style || ''}`}>
            {tableData.hasHeaderRow && tableData.rows.length > 0 && (
              <thead>
                <tr>
                  {tableData.rows[0].map((cell, colIndex) => (
                    <th key={colIndex}>
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(0, colIndex, e.target.value)}
                        className="table-cell-input"
                      />
                      <button
                        onClick={() => deleteColumn(colIndex)}
                        className="delete-btn"
                        title="列を削除"
                      >
                        ×
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableData.rows.slice(tableData.hasHeaderRow ? 1 : 0).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    const actualRowIndex = tableData.hasHeaderRow ? rowIndex + 1 : rowIndex;
                    const isHeaderCell = tableData.hasHeaderColumn && colIndex === 0;
                    const Tag = isHeaderCell ? 'th' : 'td';
                    
                    return (
                      <Tag key={colIndex}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(actualRowIndex, colIndex, e.target.value)}
                          className="table-cell-input"
                        />
                        {colIndex === 0 && (
                          <button
                            onClick={() => deleteRow(actualRowIndex)}
                            className="delete-btn"
                            title="行を削除"
                          >
                            ×
                          </button>
                        )}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BlockBase>
  );
};
