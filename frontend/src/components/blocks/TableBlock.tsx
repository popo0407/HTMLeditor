/**
 * テーブルブロックコンポーネント（編集機能付き）
 * 
 * 責務:
 * - テーブルの表示と編集
 * - 行・列の追加・削除
 * - セル内容の編集
 */

import React, { useRef } from 'react';
import { CommonBlockProps, TableData } from '../../types';
import { BlockBase } from './BlockBase';
import { useTableInitializer } from '../../hooks/useTableInitializer';

export const TableBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const tableRef = useRef<HTMLTableElement>(null);
  
  // テーブル初期化ロジックをカスタムフックに分離
  const { tableData, setTableData } = useTableInitializer(block, onUpdate);

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

  return (
    <BlockBase {...props}>
      <div className="table-block">
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
