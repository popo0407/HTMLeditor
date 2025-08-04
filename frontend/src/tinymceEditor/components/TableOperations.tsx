import React, { useState } from 'react';
import { TableService } from '../services/tableService';

interface TableOperationsProps {
  editor: any;
}

export const TableOperations: React.FC<TableOperationsProps> = ({ editor }) => {
  const [tableService] = useState(() => new TableService(editor));
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const handleInsertTable = () => {
    tableService.insertTable(tableRows, tableCols);
    setShowTableDialog(false);
  };

  const handleInsertCustomTable = (template: 'basic' | 'header' | 'data' | 'schedule') => {
    tableService.insertCustomTable(template);
  };

  const handleTableStyle = (style: 'basic' | 'striped' | 'bordered' | 'compact') => {
    tableService.applyTableStyle(style);
  };

  return (
    <div className="table-operations">
      <div className="table-operations-section">
        <h3>表操作</h3>
        
        {/* 基本表操作 */}
        <div className="basic-table-operations">
          <h4>基本操作</h4>
          <div className="table-buttons">
            <button
              onClick={() => setShowTableDialog(true)}
              className="table-button insert"
            >
              表を挿入
            </button>
            <button
              onClick={() => tableService.deleteTable()}
              className="table-button delete"
            >
              表を削除
            </button>
          </div>
        </div>

        {/* 行・列操作 */}
        <div className="row-column-operations">
          <h4>行・列操作</h4>
          <div className="table-buttons">
            <button
              onClick={() => tableService.insertRow()}
              className="table-button row"
            >
              行を挿入
            </button>
            <button
              onClick={() => tableService.deleteRow()}
              className="table-button row"
            >
              行を削除
            </button>
            <button
              onClick={() => tableService.insertColumn()}
              className="table-button column"
            >
              列を挿入
            </button>
            <button
              onClick={() => tableService.deleteColumn()}
              className="table-button column"
            >
              列を削除
            </button>
          </div>
        </div>

        {/* セル操作 */}
        <div className="cell-operations">
          <h4>セル操作</h4>
          <div className="table-buttons">
            <button
              onClick={() => tableService.mergeCells()}
              className="table-button cell"
            >
              セルを結合
            </button>
            <button
              onClick={() => tableService.splitCells()}
              className="table-button cell"
            >
              セルを分割
            </button>
          </div>
        </div>

        {/* 表テンプレート */}
        <div className="table-templates">
          <h4>表テンプレート</h4>
          <div className="table-buttons">
            <button
              onClick={() => handleInsertCustomTable('basic')}
              className="table-button template"
            >
              基本表
            </button>
            <button
              onClick={() => handleInsertCustomTable('header')}
              className="table-button template"
            >
              ヘッダー表
            </button>
            <button
              onClick={() => handleInsertCustomTable('data')}
              className="table-button template"
            >
              データ表
            </button>
            <button
              onClick={() => handleInsertCustomTable('schedule')}
              className="table-button template"
            >
              スケジュール表
            </button>
          </div>
        </div>

        {/* 表スタイル */}
        <div className="table-styles">
          <h4>表スタイル</h4>
          <div className="table-buttons">
            <button
              onClick={() => handleTableStyle('basic')}
              className="table-button style"
            >
              基本
            </button>
            <button
              onClick={() => handleTableStyle('striped')}
              className="table-button style"
            >
              ストライプ
            </button>
            <button
              onClick={() => handleTableStyle('bordered')}
              className="table-button style"
            >
              ボーダー
            </button>
            <button
              onClick={() => handleTableStyle('compact')}
              className="table-button style"
            >
              コンパクト
            </button>
          </div>
        </div>
      </div>

      {/* 表挿入ダイアログ */}
      {showTableDialog && (
        <div className="table-dialog-overlay">
          <div className="table-dialog">
            <h3>表を挿入</h3>
            <div className="dialog-content">
              <div className="input-group">
                <label htmlFor="table-rows">行数:</label>
                <input
                  id="table-rows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="table-cols">列数:</label>
                <input
                  id="table-cols"
                  type="number"
                  min="1"
                  max="20"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="dialog-actions">
              <button
                onClick={handleInsertTable}
                className="dialog-button confirm"
              >
                挿入
              </button>
              <button
                onClick={() => setShowTableDialog(false)}
                className="dialog-button cancel"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 