/**
 * テーブル初期化カスタムフック
 * 
 * 責務:
 * - テーブルデータの初期化ロジック
 * - タブ区切りデータのパース
 * - デフォルトテーブルの生成
 * 
 * 開発憲章の「関心の分離」に従い、初期化ロジックをコンポーネントから分離
 */

import { useState, useEffect } from 'react';
import { Block, TableData } from '../types';

export const useTableInitializer = (block: Block, onUpdate: (blockId: string, content: string) => void) => {
  const [tableData, setTableData] = useState<TableData>(() => {
    return initializeTableData(block);
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

  return {
    tableData,
    setTableData
  };
};

/**
 * テーブルデータの初期化
 */
function initializeTableData(block: Block): TableData {
  // 既存のテーブルデータがある場合はそれを使用
  if (block.tableData) {
    return block.tableData;
  }
  
  // block.contentがタブ区切りデータの場合、それをパースする
  if (block.content && block.content.includes('\t')) {
    const parsedData = parseTabSeparatedData(block.content);
    if (parsedData) {
      return parsedData;
    }
  }
  
  // デフォルトテーブル（2x2、ヘッダー行あり）
  return createDefaultTableData();
}

/**
 * タブ区切りデータをパース
 */
function parseTabSeparatedData(content: string): TableData | null {
  const rows = content.split('\n')
    .filter(row => row.trim())
    .map(row => row.split('\t'));
  
  if (rows.length > 0) {
    return {
      rows: rows,
      hasHeaderRow: true, // 最初の行をヘッダーとして扱う
      hasHeaderColumn: false
    };
  }
  
  return null;
}

/**
 * デフォルトテーブルデータを生成
 */
function createDefaultTableData(): TableData {
  return {
    rows: [
      ['ヘッダー1', 'ヘッダー2'],
      ['セル1', 'セル2']
    ],
    hasHeaderRow: true,
    hasHeaderColumn: false
  };
} 