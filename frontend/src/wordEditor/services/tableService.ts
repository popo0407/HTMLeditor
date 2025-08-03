import { TableData, CellMerge, TableStyles } from '../types/wordEditorTypes';

export interface TableService {
  createTable(rows: number, cols: number): TableData;
  addRow(tableData: TableData, position: 'above' | 'below', rowIndex?: number): TableData;
  addColumn(tableData: TableData, position: 'left' | 'right', colIndex?: number): TableData;
  deleteRow(tableData: TableData, rowIndex: number): TableData;
  deleteColumn(tableData: TableData, colIndex: number): TableData;
  mergeCells(tableData: TableData, merge: CellMerge): TableData;
  splitCell(tableData: TableData, row: number, col: number): TableData;
  updateCell(tableData: TableData, row: number, col: number, value: string): TableData;
  updateStyles(tableData: TableData, styles: Partial<TableStyles>): TableData;
  validateTable(tableData: TableData): { isValid: boolean; errors: string[] };
  exportToHtml(tableData: TableData): string;
  importFromHtml(html: string): TableData | null;
}

export class TableServiceImpl implements TableService {
  
  /**
   * 新しい表を作成
   */
  createTable(rows: number, cols: number): TableData {
    const tableData: TableData = {
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
    
    return tableData;
  }

  /**
   * 行を追加
   */
  addRow(tableData: TableData, position: 'above' | 'below', rowIndex?: number): TableData {
    const newTableData = { ...tableData };
    const newRow = Array(newTableData.rows[0]?.length || 0).fill('');
    
    if (position === 'above') {
      const insertIndex = rowIndex !== undefined ? rowIndex : 0;
      newTableData.rows.splice(insertIndex, 0, newRow);
    } else {
      const insertIndex = rowIndex !== undefined ? rowIndex + 1 : newTableData.rows.length;
      newTableData.rows.splice(insertIndex, 0, newRow);
    }
    
    return newTableData;
  }

  /**
   * 列を追加
   */
  addColumn(tableData: TableData, position: 'left' | 'right', colIndex?: number): TableData {
    const newTableData = { ...tableData };
    
    if (position === 'left') {
      const insertIndex = colIndex !== undefined ? colIndex : 0;
      newTableData.rows.forEach(row => row.splice(insertIndex, 0, ''));
      if (newTableData.headers) {
        newTableData.headers.splice(insertIndex, 0, '');
      }
    } else {
      const insertIndex = colIndex !== undefined ? colIndex + 1 : newTableData.rows[0]?.length || 0;
      newTableData.rows.forEach(row => row.splice(insertIndex, 0, ''));
      if (newTableData.headers) {
        newTableData.headers.splice(insertIndex, 0, '');
      }
    }
    
    return newTableData;
  }

  /**
   * 行を削除
   */
  deleteRow(tableData: TableData, rowIndex: number): TableData {
    const newTableData = { ...tableData };
    
    if (rowIndex >= 0 && rowIndex < newTableData.rows.length) {
      newTableData.rows.splice(rowIndex, 1);
    }
    
    return newTableData;
  }

  /**
   * 列を削除
   */
  deleteColumn(tableData: TableData, colIndex: number): TableData {
    const newTableData = { ...tableData };
    
    if (colIndex >= 0 && colIndex < (newTableData.rows[0]?.length || 0)) {
      newTableData.rows.forEach(row => row.splice(colIndex, 1));
      if (newTableData.headers) {
        newTableData.headers.splice(colIndex, 1);
      }
    }
    
    return newTableData;
  }

  /**
   * セルを結合
   */
  mergeCells(tableData: TableData, merge: CellMerge): TableData {
    const newTableData = { ...tableData };
    
    // 結合範囲の検証
    if (merge.row < 0 || merge.col < 0 || 
        merge.row + merge.rowSpan > newTableData.rows.length ||
        merge.col + merge.colSpan > (newTableData.rows[0]?.length || 0)) {
      throw new Error('Invalid merge range');
    }
    
    // 結合されたセルの内容を統合
    let mergedContent = '';
    for (let i = 0; i < merge.rowSpan; i++) {
      for (let j = 0; j < merge.colSpan; j++) {
        const cellContent = newTableData.rows[merge.row + i][merge.col + j];
        if (cellContent) {
          mergedContent += (mergedContent ? ' ' : '') + cellContent;
        }
      }
    }
    
    // 結合されたセルに統合された内容を設定
    newTableData.rows[merge.row][merge.col] = mergedContent;
    
    // 結合されたセルを空にする（実際の実装では、結合情報を保持する必要がある）
    for (let i = 0; i < merge.rowSpan; i++) {
      for (let j = 0; j < merge.colSpan; j++) {
        if (i === 0 && j === 0) continue; // メインセルはスキップ
        newTableData.rows[merge.row + i][merge.col + j] = '';
      }
    }
    
    return newTableData;
  }

  /**
   * セルを分割
   */
  splitCell(tableData: TableData, row: number, col: number): TableData {
    // この実装では、結合されたセルの分割は複雑なため、
    // 基本的な分割（セルを空にする）のみを実装
    const newTableData = { ...tableData };
    
    if (row >= 0 && row < newTableData.rows.length && 
        col >= 0 && col < (newTableData.rows[0]?.length || 0)) {
      newTableData.rows[row][col] = '';
    }
    
    return newTableData;
  }

  /**
   * セルの内容を更新
   */
  updateCell(tableData: TableData, row: number, col: number, value: string): TableData {
    const newTableData = { ...tableData };
    
    if (row >= 0 && row < newTableData.rows.length && 
        col >= 0 && col < (newTableData.rows[0]?.length || 0)) {
      newTableData.rows[row][col] = value;
    }
    
    return newTableData;
  }

  /**
   * 表のスタイルを更新
   */
  updateStyles(tableData: TableData, styles: Partial<TableStyles>): TableData {
    const newTableData = { ...tableData };
    
    if (!newTableData.styles) {
      newTableData.styles = {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#f0f0f0',
        alignment: 'left',
        cellPadding: 8,
      };
    }
    
    newTableData.styles = { ...newTableData.styles, ...styles };
    
    return newTableData;
  }

  /**
   * 表の妥当性を検証
   */
  validateTable(tableData: TableData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!tableData.rows || tableData.rows.length === 0) {
      errors.push('表に少なくとも1行が必要です');
    }
    
    if (!tableData.headers || tableData.headers.length === 0) {
      errors.push('表に少なくとも1列が必要です');
    }
    
    // 各行の列数が一致するかチェック
    const expectedCols = tableData.rows[0]?.length || 0;
    for (let i = 0; i < tableData.rows.length; i++) {
      if (tableData.rows[i].length !== expectedCols) {
        errors.push(`行${i + 1}の列数が一致しません`);
      }
    }
    
    // ヘッダーの列数が一致するかチェック
    if (tableData.headers && tableData.headers.length !== expectedCols) {
      errors.push('ヘッダーの列数が表の列数と一致しません');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 表をHTMLにエクスポート
   */
  exportToHtml(tableData: TableData): string {
    const { rows, headers, styles } = tableData;
    
    if (!rows || rows.length === 0) {
      return '';
    }
    
    // デフォルトスタイルを設定
    const defaultStyles = {
      borderColor: '#000000',
      backgroundColor: '#ffffff',
      headerBackgroundColor: '#f0f0f0',
      alignment: 'left' as const,
      cellPadding: 8,
    };
    
    const finalStyles = styles || defaultStyles;
    
    const tableStyle = `
      border-collapse: collapse;
      width: 100%;
      border: 1px solid ${finalStyles.borderColor};
      background-color: ${finalStyles.backgroundColor};
    `;
    
    const cellStyle = `
      border: 1px solid ${finalStyles.borderColor};
      padding: ${finalStyles.cellPadding}px;
      text-align: ${finalStyles.alignment};
    `;
    
    const headerStyle = `
      ${cellStyle}
      background-color: ${finalStyles.headerBackgroundColor};
      font-weight: bold;
    `;
    
    let html = `<table style="${tableStyle}">`;
    
    // ヘッダー行
    if (headers && headers.some(header => header.trim() !== '')) {
      html += '<thead><tr>';
      headers.forEach(header => {
        html += `<th style="${headerStyle}">${this.escapeHtml(header)}</th>`;
      });
      html += '</tr></thead>';
    }
    
    // データ行
    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td style="${cellStyle}">${this.escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
  }

  /**
   * HTMLから表をインポート
   */
  importFromHtml(html: string): TableData | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');
      
      if (!table) {
        return null;
      }
      
      const rows: string[][] = [];
      const headers: string[] = [];
      
      // ヘッダー行の処理
      const thead = table.querySelector('thead');
      if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('th');
          headerCells.forEach(cell => {
            headers.push(cell.textContent || '');
          });
        }
      }
      
      // データ行の処理
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const dataRows = tbody.querySelectorAll('tr');
        dataRows.forEach(row => {
          const rowData: string[] = [];
          const cells = row.querySelectorAll('td');
          cells.forEach(cell => {
            rowData.push(cell.textContent || '');
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });
      }
      
      // ヘッダーがない場合は空のヘッダーを作成
      if (headers.length === 0 && rows.length > 0) {
        headers.push(...Array(rows[0].length).fill(''));
      }
      
      if (rows.length === 0) {
        return null;
      }
      
      return {
        rows,
        headers,
        styles: {
          borderColor: '#000000',
          backgroundColor: '#ffffff',
          headerBackgroundColor: '#f0f0f0',
          alignment: 'left',
          cellPadding: 8,
        },
      };
    } catch (error) {
      console.error('HTMLから表のインポートに失敗しました:', error);
      return null;
    }
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// シングルトンインスタンス
export const tableService = new TableServiceImpl(); 