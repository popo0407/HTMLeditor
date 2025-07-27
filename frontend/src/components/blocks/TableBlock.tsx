/**
 * テーブルブロックコンポーネント（編集機能付き）
 * 
 * 責務:
 * - テーブルの表示と編集
 * - 行・列の追加・削除
 * - セル内容の編集
 */

import React, { useState, useEffect, useRef } from 'react';
import { CommonBlockProps, TableData } from '../../types';
import { BlockBase } from './BlockBase';

export const TableBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const tableRef = useRef<HTMLTableElement>(null);
  
  // テーブルデータを初期化
  const [tableData, setTableData] = useState<TableData>(() => {
    if (block.tableData) {
      return block.tableData;
    }
    
    // block.contentがタブ区切りデータの場合、それをパースする
    if (block.content && block.content.includes('\t')) {
      const rows = block.content.split('\n')
        .filter(row => row.trim())
        .map(row => row.split('\t'));
      
      if (rows.length > 0) {
        return {
          rows: rows,
          hasHeaderRow: true, // 最初の行をヘッダーとして扱う
          hasHeaderColumn: false
        };
      }
    }
    
    // デフォルトテーブル（2x2、ヘッダー行あり）
    return {
      rows: [
        ['ヘッダー1', 'ヘッダー2'],
        ['セル1', 'セル2']
      ],
      hasHeaderRow: true,
      hasHeaderColumn: false
    };
  });

  // テーブルデータが変更されたらブロックを更新
  useEffect(() => {
    const updatedBlock = {
      ...block,
      tableData: tableData
    };
    onUpdate(block.id, JSON.stringify(updatedBlock));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  // セル内容を更新
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setTableData(prev => ({
      rows: prev.rows.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
          : row
      ),
      hasHeaderRow: prev.hasHeaderRow,
      hasHeaderColumn: prev.hasHeaderColumn
    }));
  };

  // 行を追加
  const addRow = () => {
    setTableData(prev => ({
      rows: [...prev.rows, new Array(prev.rows[0]?.length || 2).fill('')],
      hasHeaderRow: prev.hasHeaderRow,
      hasHeaderColumn: prev.hasHeaderColumn
    }));
  };

  // 列を追加
  const addColumn = () => {
    setTableData(prev => ({
      rows: prev.rows.map(row => [...row, '']),
      hasHeaderRow: prev.hasHeaderRow,
      hasHeaderColumn: prev.hasHeaderColumn
    }));
  };

  // 行を削除
  const deleteRow = (rowIndex: number) => {
    if (tableData.rows.length <= 1) return; // 最低1行は残す
    setTableData(prev => ({
      rows: prev.rows.filter((_, idx) => idx !== rowIndex),
      hasHeaderRow: prev.hasHeaderRow,
      hasHeaderColumn: prev.hasHeaderColumn
    }));
  };

  // 列を削除
  const deleteColumn = (colIndex: number) => {
    if (tableData.rows[0]?.length <= 1) return; // 最低1列は残す
    setTableData(prev => ({
      rows: prev.rows.map(row => row.filter((_, idx) => idx !== colIndex)),
      hasHeaderRow: prev.hasHeaderRow,
      hasHeaderColumn: prev.hasHeaderColumn
    }));
  };

  // ヘッダー行の切り替え
  const toggleHeaderRow = () => {
    setTableData(prev => ({
      ...prev,
      hasHeaderRow: !prev.hasHeaderRow
    }));
  };

  // ヘッダー列の切り替え
  const toggleHeaderColumn = () => {
    setTableData(prev => ({
      ...prev,
      hasHeaderColumn: !prev.hasHeaderColumn
    }));
  };

  // セルがヘッダーかどうかを判定
  const isHeaderCell = (rowIndex: number, colIndex: number) => {
    return (tableData.hasHeaderRow && rowIndex === 0) || 
           (tableData.hasHeaderColumn && colIndex === 0);
  };

  // シングルクリックで先頭セルにフォーカス
  const handleTableClick = () => {
    if (tableRef.current && tableData.rows.length > 0 && tableData.rows[0].length > 0) {
      const firstCell = tableRef.current.querySelector('td, th') as HTMLTableCellElement;
      if (firstCell) {
        const input = firstCell.querySelector('input') as HTMLInputElement;
        if (input) {
          input.focus();
          // カーソルをテキスト末端に移動
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }
    }
  };

  return (
    <BlockBase {...props}>
      <div className="block-table">
        {/* テーブル操作コントロール */}
        {props.isSelected && (
          <div style={{ 
            marginBottom: '12px', 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* 追加ボタン */}
            <button 
              className="btn"
              onClick={addRow}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              ➕ 行
            </button>
            <button 
              className="btn"
              onClick={addColumn}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              ➕ 列
            </button>
            
            {/* ヘッダー設定 */}
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="checkbox" 
                checked={tableData.hasHeaderRow || false}
                onChange={toggleHeaderRow}
              />
              1行目をヘッダー
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="checkbox" 
                checked={tableData.hasHeaderColumn || false}
                onChange={toggleHeaderColumn}
              />
              1列目をヘッダー
            </label>
          </div>
        )}
        
        {/* テーブル本体とコントロール */}
        <div style={{ 
          position: 'relative',
          marginTop: props.isSelected ? '35px' : '0',
          marginLeft: props.isSelected ? '40px' : '0'
        }}>
          {/* 行削除ボタン（左側） */}
          {props.isSelected && tableData.rows.length > 1 && (
            <div style={{ 
              position: 'absolute', 
              left: '-35px', 
              top: '0', 
              bottom: '0',
              display: 'flex', 
              flexDirection: 'column',
              zIndex: 10,
              justifyContent: 'stretch'
            }}>
              {tableData.rows.map((_, rowIndex) => (
                <button
                  key={rowIndex}
                  onClick={() => deleteRow(rowIndex)}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    marginBottom: '1px',
                    flex: '1', // フレックスで自動高さ調整
                    width: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                  title={`${rowIndex + 1}行目を削除`}
                >
                  ✕
                </button>
              ))}
            </div>
          )}
          
          {/* 列削除ボタン（上側） */}
          {props.isSelected && tableData.rows[0]?.length > 1 && (
            <div style={{ 
              position: 'absolute', 
              top: '-30px', 
              left: '0', 
              display: 'flex',
              width: '100%',
              zIndex: 10
            }}>
              {tableData.rows[0].map((_, colIndex) => (
                <button
                  key={colIndex}
                  onClick={() => deleteColumn(colIndex)}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    marginRight: '2px',
                    height: '20px',
                    flex: 1,
                    minWidth: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={`${colIndex + 1}列目を削除`}
                >
                  ✕
                </button>
              ))}
            </div>
          )}
          
          {/* テーブル本体 */}
          <table 
            ref={tableRef}
            onClick={handleTableClick}
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid var(--border-color)',
              cursor: 'text'
            }}
          >
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    const CellTag = isHeaderCell(rowIndex, colIndex) ? 'th' : 'td';
                    return (
                      <CellTag 
                        key={colIndex}
                        style={{ 
                          border: '1px solid var(--border-color)', 
                          padding: '8px',
                          backgroundColor: isHeaderCell(rowIndex, colIndex) ? 'var(--background-light)' : 'transparent',
                          fontWeight: isHeaderCell(rowIndex, colIndex) ? 'bold' : 'normal',
                          textAlign: 'left'
                        }}
                      >
                        {props.isSelected ? (
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: '14px',
                              fontWeight: 'inherit'
                            }}
                          />
                        ) : (
                          cell || '\u00A0' // 空の場合は非改行スペース
                        )}
                      </CellTag>
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
