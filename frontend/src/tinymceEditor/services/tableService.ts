import { ITableService, Table, TableCell } from '../types/tinymceTypes';

export class TableService implements ITableService {
  private editor: any;

  constructor(editor: any) {
    this.editor = editor;
  }

  insertTable(rows: number, cols: number): void {
    const tableHtml = this.generateTableHtml(rows, cols);
    this.editor.insertContent(tableHtml);
  }

  deleteTable(): void {
    const table = this.editor.dom.getParent(this.editor.selection.getNode(), 'table');
    if (table) {
      this.editor.dom.remove(table);
    }
  }

  insertRow(): void {
    this.editor.execCommand('mceTableInsertRow');
  }

  deleteRow(): void {
    this.editor.execCommand('mceTableDeleteRow');
  }

  insertColumn(): void {
    this.editor.execCommand('mceTableInsertCol');
  }

  deleteColumn(): void {
    this.editor.execCommand('mceTableDeleteCol');
  }

  mergeCells(): void {
    this.editor.execCommand('mceTableMergeCells');
  }

  splitCells(): void {
    this.editor.execCommand('mceTableSplitCells');
  }

  // カスタム表テンプレート
  insertCustomTable(template: 'basic' | 'header' | 'data' | 'schedule'): void {
    let tableHtml = '';
    
    switch (template) {
      case 'basic':
        tableHtml = this.generateTableHtml(3, 3);
        break;
      case 'header':
        tableHtml = `
          <table class="custom-table">
            <thead>
              <tr>
                <th>項目</th>
                <th>内容</th>
                <th>担当者</th>
                <th>期限</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      case 'data':
        tableHtml = `
          <table class="custom-table">
            <tr>
              <th>データ1</th>
              <th>データ2</th>
              <th>データ3</th>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </table>
        `;
        break;
      case 'schedule':
        tableHtml = `
          <table class="custom-table">
            <tr>
              <th>時間</th>
              <th>月曜日</th>
              <th>火曜日</th>
              <th>水曜日</th>
              <th>木曜日</th>
              <th>金曜日</th>
            </tr>
            <tr>
              <td>9:00-10:00</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>10:00-11:00</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>11:00-12:00</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </table>
        `;
        break;
    }
    
    this.editor.insertContent(tableHtml);
  }

  // 表のスタイル適用
  applyTableStyle(style: 'basic' | 'striped' | 'bordered' | 'compact'): void {
    const table = this.editor.dom.getParent(this.editor.selection.getNode(), 'table');
    if (!table) return;

    // 既存のスタイルクラスを削除
    table.className = table.className.replace(/table-\w+/g, '').trim();
    
    // 新しいスタイルクラスを追加
    table.className += ` table-${style}`;
  }

  // 表のプロパティ設定
  setTableProperties(properties: {
    width?: string;
    height?: string;
    cellspacing?: string;
    cellpadding?: string;
    border?: string;
    align?: 'left' | 'center' | 'right';
  }): void {
    const table = this.editor.dom.getParent(this.editor.selection.getNode(), 'table');
    if (!table) return;

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        table.setAttribute(key, value);
      }
    });
  }

  // セルのプロパティ設定
  setCellProperties(properties: {
    width?: string;
    height?: string;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    bgcolor?: string;
    colspan?: string;
    rowspan?: string;
  }): void {
    const cell = this.editor.dom.getParent(this.editor.selection.getNode(), 'td,th');
    if (!cell) return;

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        cell.setAttribute(key, value);
      }
    });
  }

  // 表のHTML生成
  private generateTableHtml(rows: number, cols: number): string {
    let html = '<table class="custom-table">';
    
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        // 最初の行をヘッダーにする
        const tag = i === 0 ? 'th' : 'td';
        html += `<${tag}></${tag}>`;
      }
      html += '</tr>';
    }
    
    html += '</table>';
    return html;
  }

  // 表のデータ取得
  getTableData(): Table | null {
    const table = this.editor.dom.getParent(this.editor.selection.getNode(), 'table');
    if (!table) return null;

    const rows = table.querySelectorAll('tr');
    const cells: TableCell[][] = [];

    rows.forEach((row: Element, rowIndex: number) => {
      const rowCells: TableCell[] = [];
      const cellsInRow = row.querySelectorAll('td, th');
      
      cellsInRow.forEach((cell: Element, colIndex: number) => {
        rowCells.push({
          row: rowIndex,
          col: colIndex,
          content: cell.textContent || '',
          colspan: cell.getAttribute('colspan') ? parseInt(cell.getAttribute('colspan')!) : undefined,
          rowspan: cell.getAttribute('rowspan') ? parseInt(cell.getAttribute('rowspan')!) : undefined,
        });
      });
      
      cells.push(rowCells);
    });

    return {
      rows: rows.length,
      cols: cells[0]?.length || 0,
      cells,
      className: table.className,
      style: table.getAttribute('style') || undefined,
    };
  }

  // 表のデータ設定
  setTableData(tableData: Table): void {
    const table = this.editor.dom.getParent(this.editor.selection.getNode(), 'table');
    if (!table) return;

    // 既存の表を削除
    this.editor.dom.remove(table);

    // 新しい表を生成
    let html = '<table class="custom-table">';
    
    tableData.cells.forEach((row, rowIndex) => {
      html += '<tr>';
      row.forEach((cell) => {
        const tag = rowIndex === 0 ? 'th' : 'td';
        const colspan = cell.colspan ? ` colspan="${cell.colspan}"` : '';
        const rowspan = cell.rowspan ? ` rowspan="${cell.rowspan}"` : '';
        html += `<${tag}${colspan}${rowspan}>${cell.content}</${tag}>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    
    this.editor.insertContent(html);
  }
} 