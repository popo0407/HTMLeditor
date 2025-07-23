/**
 * クリップボード操作とHTML変換サービス
 * 
 * 責務:
 * - クリップボードからのHTML読み込み
 * - HTMLからブロック構造への変換
 * - ブロック構造からHTMLへの変換
 * 
 * 要件 F-001-1: クリップボードのHTMLテキストを読み込み、編集を開始できる
 * 要件 F-001-5: 再アップロード時に編集可能な構造を持つHTMLを出力する
 */

import { Block, BlockType } from '../types';

class ClipboardService {
  /**
   * クリップボードからHTMLテキストを読み込み
   */
  async importFromClipboard(): Promise<Block[]> {
    try {
      // まずHTMLデータを取得を試行
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        if (item.types.includes('text/html')) {
          const htmlBlob = await item.getType('text/html');
          const htmlText = await htmlBlob.text();
          return this.parseHtmlToBlocks(htmlText);
        }
      }
      
      // HTMLがない場合はプレーンテキストにフォールバック
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        return this.parseTextToBlocks(text);
      }
      
      throw new Error('クリップボードにコンテンツが見つかりません');
      
    } catch (error) {
      console.error('クリップボード読み込みエラー:', error);
      throw new Error('クリップボードの読み込みに失敗しました。ブラウザでクリップボードのアクセス許可が必要です。');
    }
  }

  /**
   * HTMLテキストをブロック構造に変換
   */
  private parseHtmlToBlocks(html: string): Block[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: Block[] = [];

    // 既存のブロック構造を持つHTMLかチェック（data-block-type属性の存在）
    const existingBlocks = doc.querySelectorAll('[data-block-type]');
    
    if (existingBlocks.length > 0) {
      // 既存のブロック構造から復元
      existingBlocks.forEach((element, index) => {
        const blockType = element.getAttribute('data-block-type') as BlockType;
        const blockId = element.getAttribute('data-block-id') || `restored-${Date.now()}-${index}`;
        
        blocks.push({
          id: blockId,
          type: blockType,
          content: this.extractContentFromElement(element, blockType),
          src: element.getAttribute('src') || undefined,
        });
      });
    } else {
      // 通常のHTMLから変換
      this.parseHtmlElements(doc.body, blocks);
    }

    return blocks.length > 0 ? blocks : this.createDefaultBlocks();
  }

  /**
   * HTML要素を再帰的に解析してブロックに変換
   */
  private parseHtmlElements(element: Element, blocks: Block[]): void {
    Array.from(element.children).forEach(child => {
      const block = this.elementToBlock(child);
      if (block) {
        blocks.push(block);
      } else {
        // 認識できない要素の場合、子要素を再帰的に処理
        this.parseHtmlElements(child, blocks);
      }
    });
  }

  /**
   * HTML要素をブロックオブジェクトに変換
   */
  private elementToBlock(element: Element): Block | null {
    const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (element.tagName.toLowerCase()) {
      case 'h1':
        return { id, type: 'heading1', content: element.textContent || '' };
      case 'h2':
        return { id, type: 'heading2', content: element.textContent || '' };
      case 'h3':
        return { id, type: 'heading3', content: element.textContent || '' };
      case 'p':
        return { id, type: 'paragraph', content: element.textContent || '' };
      case 'ul':
      case 'ol':
        const listItems = Array.from(element.querySelectorAll('li'))
          .map(li => li.textContent || '')
          .join('\n');
        return { id, type: 'bulletList', content: listItems };
      case 'hr':
        return { id, type: 'horizontalRule', content: '' };
      case 'img':
        return { 
          id, 
          type: 'image', 
          content: element.getAttribute('alt') || '',
          src: element.getAttribute('src') || undefined
        };
      case 'table':
        return { id, type: 'table', content: element.textContent || '' };
      default:
        // 不明な要素は段落として扱う
        if (element.textContent && element.textContent.trim()) {
          return { id, type: 'paragraph', content: element.textContent.trim() };
        }
        return null;
    }
  }

  /**
   * 要素からブロック固有のコンテンツを抽出
   */
  private extractContentFromElement(element: Element, blockType: BlockType): string {
    switch (blockType) {
      case 'bulletList':
        const listItems = Array.from(element.querySelectorAll('li'))
          .map(li => li.textContent || '')
          .join('\n');
        return listItems;
      default:
        return element.textContent || '';
    }
  }

  /**
   * プレーンテキストをブロック構造に変換
   */
  private parseTextToBlocks(text: string): Block[] {
    const lines = text.split('\n').filter(line => line.trim());
    const blocks: Block[] = [];

    lines.forEach(line => {
      const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 簡単なマークダウン風の解析
      if (line.startsWith('# ')) {
        blocks.push({ id, type: 'heading1', content: line.substring(2) });
      } else if (line.startsWith('## ')) {
        blocks.push({ id, type: 'heading2', content: line.substring(3) });
      } else if (line.startsWith('### ')) {
        blocks.push({ id, type: 'heading3', content: line.substring(4) });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        blocks.push({ id, type: 'bulletList', content: line.substring(2) });
      } else {
        blocks.push({ id, type: 'paragraph', content: line });
      }
    });

    return blocks.length > 0 ? blocks : this.createDefaultBlocks();
  }

  /**
   * デフォルトブロックを作成
   */
  private createDefaultBlocks(): Block[] {
    return [{
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: 'クリップボードから読み込まれたコンテンツ'
    }];
  }

  /**
   * Teams向けメール用HTMLを生成（最適化されたスタイル）
   */
  blocksToTeamsHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => this.blockToHtml(block));
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>議事録</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6; 
      color: #323130;
      max-width: 100%; 
      margin: 0; 
      padding: 16px; 
      background-color: #ffffff;
    }
    h1 { 
      color: #323130; 
      margin-top: 0; 
      margin-bottom: 16px; 
      font-size: 24px;
      font-weight: 600;
    }
    h2 { 
      color: #323130; 
      border-bottom: 2px solid #0078d4; 
      padding-bottom: 8px; 
      margin-top: 24px; 
      margin-bottom: 12px;
      font-size: 20px;
      font-weight: 600;
    }
    h3 { 
      color: #323130; 
      margin-top: 20px; 
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 600;
    }
    p { 
      margin: 8px 0; 
      font-size: 14px;
    }
    ul { 
      margin: 8px 0; 
      padding-left: 20px; 
    }
    li { 
      margin: 4px 0; 
      font-size: 14px;
    }
    hr { 
      margin: 16px 0; 
      border: none; 
      height: 1px; 
      background-color: #edebe9; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 12px 0; 
      font-size: 14px;
    }
    th, td { 
      border: 1px solid #edebe9; 
      padding: 8px 12px; 
      text-align: left; 
    }
    th { 
      background-color: #f3f2f1; 
      font-weight: 600;
      color: #323130;
    }
    img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 4px; 
    }
    
    /* Teams最適化：重要事項スタイル */
    .important {
      background-color: #fff4ce;
      border-left: 4px solid #ffb900;
      padding: 12px;
      margin: 12px 0;
      border-radius: 4px;
      font-weight: 500;
    }
    
    /* Teams最適化：アクション項目スタイル */
    .action-item {
      background-color: #e1f5fe;
      border-left: 4px solid #0078d4;
      padding: 12px;
      margin: 12px 0;
      border-radius: 4px;
      font-weight: 500;
    }
    
    /* Teams最適化：強調表示テーブル */
    table.important {
      background-color: #fff4ce;
      border-left: 4px solid #ffb900;
      padding: 8px;
      margin: 12px 0;
      border-radius: 4px;
    }
    table.important th {
      background-color: rgba(255, 185, 0, 0.2);
      border-bottom: 2px solid #ffb900;
    }
    
    table.action-item {
      background-color: #e1f5fe;
      border-left: 4px solid #0078d4;
      padding: 8px;
      margin: 12px 0;
      border-radius: 4px;
    }
    table.action-item th {
      background-color: rgba(0, 120, 212, 0.2);
      border-bottom: 2px solid #0078d4;
    }
    
    /* Teams向け追加スタイル */
    .teams-header {
      background-color: #f3f2f1;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      border-left: 4px solid #0078d4;
    }
    
    .teams-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #edebe9;
      font-size: 12px;
      color: #605e5c;
    }
  </style>
</head>
<body>
${htmlParts.join('\n')}
<div class="teams-footer">
<p>この議事録は HTMLエディタ で作成されました</p>
</div>
</body>
</html>`;
  }

  /**
   * ブロック構造からHTMLを生成（F-001-5, F-003-1対応）
   */
  blocksToHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => this.blockToHtml(block));
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTMLエディタで作成されたドキュメント</title>
  <style>
    body { 
      font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; 
      line-height: 1.6; 
      color: #333;
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; }
    h2 { 
      color: #2c3e50; 
      border-bottom: 3px solid #3498db; 
      padding-bottom: 10px; 
      margin-top: 30px; 
    }
    h3 { color: #34495e; margin-top: 25px; }
    p { margin: 12px 0; }
    ul { margin: 10px 0; padding-left: 25px; }
    li { margin: 5px 0; }
    hr { margin: 24px 0; border: none; height: 2px; background-color: #ddd; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { background-color: #f8f9fa; font-weight: bold; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    
    /* 特別なブロックスタイル */
    .action-item {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .important {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    /* 強調表示時のテーブルヘッダースタイル */
    table.important th {
      background-color: rgba(255, 193, 7, 0.3) !important;
      border-bottom: 2px solid #ffc107;
      font-weight: bold;
    }
    table.action-item th {
      background-color: rgba(40, 167, 69, 0.2) !important;
      border-bottom: 2px solid #28a745;
      font-weight: bold;
    }
    
    /* 強調表示テーブル全体のスタイル */
    table.important {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    table.action-item {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
${htmlParts.join('\n')}
</body>
</html>`;
  }

  /**
   * プレビュー用にブロック構造からスタイル付きHTMLコンテンツを生成
   */
  blocksToPreviewHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => this.blockToHtml(block));
    
    return `<style>
    /* 特別なブロックスタイル */
    .action-item {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .important {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    /* 強調表示時のテーブルヘッダースタイル */
    .important table th {
      background-color: rgba(255, 193, 7, 0.3) !important;
      border-bottom: 2px solid #ffc107 !important;
      font-weight: bold;
    }
    .action-item table th {
      background-color: rgba(40, 167, 69, 0.2) !important;
      border-bottom: 2px solid #28a745 !important;
      font-weight: bold;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { 
      background-color: #f8f9fa; 
      font-weight: bold; 
    }
    </style>
${htmlParts.join('\n')}`;
  }

  /**
   * 単一ブロックをHTMLに変換
   */
  private blockToHtml(block: Block): string {
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
        const items = block.content.split('\n')
          .filter(item => item.trim())
          .map(item => `<li>${this.escapeHtml(item)}</li>`)
          .join('\n');
        return `<ul ${attrs}${classAttr}>\n${items}\n</ul>`;
      case 'horizontalRule':
        return `<hr ${attrs}${classAttr} />`;
      case 'image':
        return `<img ${attrs}${classAttr} src="${block.src || ''}" alt="${this.escapeHtml(block.content)}" />`;
      case 'table':
        const tableRows = block.tableData?.rows || [['セル1', 'セル2'], ['セル3', 'セル4']];
        const hasHeaderRow = block.tableData?.hasHeaderRow || false;
        const hasHeaderColumn = block.tableData?.hasHeaderColumn || false;
        
        let tableHtml = '';
        if (hasHeaderRow && tableRows.length > 0) {
          // ヘッダー行
          const headerCells = tableRows[0].map((cell, colIndex) => {
            const tag = hasHeaderColumn && colIndex === 0 ? 'th' : (colIndex === 0 ? 'th' : 'th');
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
        
        return `<table ${attrs}${classAttr}>${tableHtml}</table>`;
      default:
        return `<p ${attrs}${classAttr}>${this.escapeHtml(block.content)}</p>`;
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

// シングルトンインスタンスをエクスポート
export const clipboardService = new ClipboardService();
