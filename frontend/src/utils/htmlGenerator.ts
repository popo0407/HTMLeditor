/**
 * HTML生成ユーティリティ
 * 
 * 責務:
 * - ブロックからHTMLへの変換
 * - テーブルHTMLの生成
 * - HTMLエスケープ処理
 * 
 * 開発憲章の「DRY原則」に従い、重複するHTML生成ロジックを統一
 */

import { Block, BlockType, TableData } from '../types';

export class HtmlGenerator {
  /**
   * ブロックをHTMLに変換
   */
  static generateBlockHtml(block: Block): string {
    const attrs = `data-block-type="${block.type}" data-block-id="${block.id}"`;
    const classAttr = block.style && block.style !== 'normal' ? ` class="${block.style}"` : '';
    
    switch (block.type) {
      case 'heading1':
        return `<h1 ${attrs}${classAttr}>${this.escapeHtml(block.content)}</h1>`;
      case 'heading2':
        return `<h2 ${attrs}${classAttr}>${this.escapeHtml(block.content)}</h2>`;
      case 'heading3':
        return `<h3 ${attrs}${classAttr}>${this.escapeHtml(block.content)}</h3>`;
      case 'paragraph':
        return `<p ${attrs}${classAttr}>${this.escapeHtml(block.content)}</p>`;
      case 'bulletList':
        return this.generateBulletListHtml(block, attrs, classAttr);
      case 'horizontalRule':
        return `<hr ${attrs}${classAttr} />`;
      case 'image':
        return `<img ${attrs}${classAttr} src="${block.src || ''}" alt="${this.escapeHtml(block.content)}" />`;
      case 'table':
        return this.generateTableHtml(block, attrs, classAttr);
      case 'calendar':
        return `<div ${attrs}${classAttr}>カレンダー: ${this.escapeHtml(block.content)}</div>`;
      default:
        return `<p ${attrs}${classAttr}>${this.escapeHtml(block.content)}</p>`;
    }
  }

  /**
   * 箇条書きHTMLを生成
   */
  private static generateBulletListHtml(block: Block, attrs: string, classAttr: string): string {
    const items = block.content.split('\n')
      .filter(item => item.trim())
      .map(item => `<li>${this.escapeHtml(item)}</li>`)
      .join('\n');
    return `<ul ${attrs}${classAttr}>\n${items}\n</ul>`;
  }

  /**
   * テーブルHTMLを生成
   */
  private static generateTableHtml(block: Block, attrs: string, classAttr: string): string {
    const tableRows = block.tableData?.rows || [['セル1', 'セル2'], ['セル3', 'セル4']];
    const hasHeaderRow = block.tableData?.hasHeaderRow || false;
    const hasHeaderColumn = block.tableData?.hasHeaderColumn || false;
    
    let tableHtml = '';
    if (hasHeaderRow && tableRows.length > 0) {
      // ヘッダー行
      const headerCells = tableRows[0].map((cell, colIndex) => {
        const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'th';
        return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
      }).join('');
      tableHtml += `<thead><tr>${headerCells}</tr></thead>`;
      
      // データ行
      if (tableRows.length > 1) {
        const bodyRows = tableRows.slice(1).map(row => {
          const cells = row.map((cell, colIndex) => {
            const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'td';
            return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('\n');
        tableHtml += `<tbody>${bodyRows}</tbody>`;
      }
    } else {
      // ヘッダー行なし
      const bodyRows = tableRows.map(row => {
        const cells = row.map((cell, colIndex) => {
          const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'td';
          return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
      tableHtml += `<tbody>${bodyRows}</tbody>`;
    }
    
    return `<table ${attrs}${classAttr}>\n${tableHtml}\n</table>`;
  }

  /**
   * テーブルデータからHTMLを生成
   */
  static generateTableDataHtml(tableData: TableData, attrs: string = '', classAttr: string = ''): string {
    const { rows, hasHeaderRow, hasHeaderColumn } = tableData;
    
    let tableHtml = '';
    if (hasHeaderRow && rows.length > 0) {
      // ヘッダー行
      const headerCells = rows[0].map((cell, colIndex) => {
        const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'th';
        return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
      }).join('');
      tableHtml += `<thead><tr>${headerCells}</tr></thead>`;
      
      // データ行
      if (rows.length > 1) {
        const bodyRows = rows.slice(1).map(row => {
          const cells = row.map((cell, colIndex) => {
            const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'td';
            return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('\n');
        tableHtml += `<tbody>${bodyRows}</tbody>`;
      }
    } else {
      // ヘッダー行なし
      const bodyRows = rows.map(row => {
        const cells = row.map((cell, colIndex) => {
          const tag = hasHeaderColumn && colIndex === 0 ? 'th' : 'td';
          return `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
      tableHtml += `<tbody>${bodyRows}</tbody>`;
    }
    
    return `<table ${attrs}${classAttr}>\n${tableHtml}\n</table>`;
  }

  /**
   * HTMLエスケープ処理
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 複数ブロックをHTMLに変換
   */
  static generateBlocksHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => this.generateBlockHtml(block));
    return htmlParts.join('\n');
  }

  /**
   * プレビュー用HTMLを生成
   */
  static generatePreviewHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => this.generateBlockHtml(block));
    return `<div class="preview-content">${htmlParts.join('\n')}</div>`;
  }
} 