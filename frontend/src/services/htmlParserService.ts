/**
 * HTML解析サービス
 * 
 * 責務:
 * - HTMLテキストの解析
 * - HTMLからブロック構造への変換
 * - スケジュールデータの抽出
 * 
 * 開発憲章の「単一責任の原則」に従い、HTML解析のみを担当
 */

import { Block, BlockType, CalendarData, TableData } from '../types';
import { calendarService } from './calendarService';

export class HtmlParserService {
  /**
   * HTMLテキストをブロック構造に変換
   */
  parseHtmlToBlocks(html: string): Block[] {
    // コンソールログのような内容の場合は警告
    if (html.includes('App.tsx:') || html.includes('clipboardService.ts:') || html.includes('console.log')) {
      console.warn('HTMLにコンソールログが含まれています。正しいHTMLをコピーしてください。');
      throw new Error('HTMLにコンソールログが含まれています。正しいHTMLをコピーしてください。');
    }
    
    const parser = new DOMParser();
    const blocks: Block[] = [];

    console.log('HTML解析開始:', html.substring(0, 200) + '...');

    // HTMLの正規化
    const normalizedHtml = this.normalizeHtml(html);
    const doc = parser.parseFromString(normalizedHtml, 'text/html');

    // スケジュールデータの抽出
    const scheduleEvents = this.extractScheduleData(html);

    // 既存のブロック構造を探す
    const existingBlocks = doc.querySelectorAll('[data-block-type]');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('HTML全体:', doc.body.innerHTML.substring(0, 500));
      console.log('data-block-type属性を持つ要素:', Array.from(existingBlocks).map(el => ({
        tagName: el.tagName,
        blockType: el.getAttribute('data-block-type'),
        content: el.textContent?.substring(0, 50)
      })));
    }
    
    if (existingBlocks.length > 0) {
      // 既存のブロック構造から復元
      console.log('既存のブロック構造から復元');
      existingBlocks.forEach((element, index) => {
        const blockType = element.getAttribute('data-block-type') as BlockType;
        const blockId = element.getAttribute('data-block-id') || `restored-${Date.now()}-${index}`;

        // 段落で<br>タグが含まれている場合は分割
        if (blockType === 'paragraph' && element.innerHTML.includes('<br')) {
          console.log(`段落ブロック ${index + 1} に<br>タグを検出。分割します。`);
          const paragraphBlocks = this.extractParagraphBlocks(element);
          blocks.push(...paragraphBlocks);
          console.log(`分割結果: ${paragraphBlocks.length}個のブロック`);
        } else {
          let block: Block = {
            id: blockId,
            type: blockType,
            content: this.extractContentFromElement(element, blockType),
            src: element.getAttribute('src') || undefined,
          };
          // テーブルの場合、より詳細にパース
          if (blockType === 'table') {
            const tableData = this.parseTableElement(element as HTMLTableElement);
            block.tableData = tableData;
            block.content = this.extractTableContent(element as HTMLTableElement);
          }
          blocks.push(block);
          console.log(`ブロック ${index + 1} 作成:`, blockType, block.content.substring(0, 50) + '...');
        }
      });
    } else {
      // 通常のHTMLから変換
      console.log('通常のHTMLから変換開始');
      if (doc) {
        console.log('body要素の直接の子要素:', Array.from(doc.body.children).map(child => child.tagName));
        this.parseHtmlElements(doc.body, blocks);
        console.log('変換完了、ブロック数:', blocks.length);
        blocks.forEach((block, index) => {
          console.log(`ブロック ${index + 1}:`, block.type, block.content.substring(0, 100));
        });
      }
    }

    // スケジュールデータが見つかった場合、カレンダーブロックを自動追加
    // （既存のブロック構造にカレンダーブロックがない場合のみ）
    if (scheduleEvents.length > 0 && !blocks.some(block => block.type === 'calendar')) {
      const now = new Date();
      
      const calendarBlock: Block = {
        id: `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'calendar',
        content: `カレンダー (${scheduleEvents.length}件のイベント)`,
        calendarData: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          weeks: [],
          events: scheduleEvents
        } as CalendarData
      };
      
      blocks.push(calendarBlock);
    }

    return blocks.length > 0 ? blocks : this.createDefaultBlocks();
  }

  /**
   * HTMLの正規化処理
   */
  private normalizeHtml(html: string): string {
    let normalized = html;
    
    // HTMLエンティティのデコード
    normalized = this.decodeHtmlEntities(normalized);
    
    // 不要な空白と改行の削除
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // 不完全なHTMLの修正
    if (!normalized.includes('<html>')) {
      normalized = `<html><body>${normalized}</body></html>`;
    }
    
    return normalized;
  }

  /**
   * HTMLエンティティのデコード
   */
  private decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * 正規表現によるHTML要素の抽出
   */
  private extractHtmlElementsWithRegex(html: string): string[] | null {
    const elementRegex = /<[^>]+>/g;
    const matches = html.match(elementRegex);
    return matches || null;
  }

  /**
   * 段落ブロックの分割処理
   */
  private extractParagraphBlocks(element: Element): Block[] {
    const blocks: Block[] = [];
    const content = element.innerHTML;
    
    // <br>タグで分割
    const parts = content.split(/<br\s*\/?>/gi);
    
    parts.forEach((part, index) => {
      if (part.trim()) {
        const block: Block = {
          id: `paragraph-${Date.now()}-${index}`,
          type: 'paragraph',
          content: this.extractParagraphContent(part.trim())
        };
        blocks.push(block);
      }
    });
    
    return blocks;
  }

  /**
   * 段落コンテンツの抽出
   */
  private extractParagraphContent(content: string): string {
    // HTMLタグを除去
    content = content.replace(/<[^>]*>/g, '');
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&#39;/g, "'");
    
    return content.trim();
  }

  /**
   * HTML要素の解析
   */
  private parseHtmlElements(element: Element, blocks: Block[]): void {
    for (const child of Array.from(element.children)) {
      const block = this.elementToBlock(child);
      if (block) {
        blocks.push(block);
      }
      
      // 子要素も再帰的に解析
      if (child.children.length > 0) {
        this.parseHtmlElements(child, blocks);
      }
    }
  }

  /**
   * HTML要素をブロックに変換
   */
  private elementToBlock(element: Element): Block | null {
    const tagName = element.tagName.toLowerCase();
    let blockType: BlockType;
    let content = '';

    switch (tagName) {
      case 'h1':
        blockType = 'heading1';
        break;
      case 'h2':
        blockType = 'heading2';
        break;
      case 'h3':
        blockType = 'heading3';
        break;
      case 'p':
        blockType = 'paragraph';
        break;
      case 'hr':
        blockType = 'horizontalRule';
        break;
      case 'img':
        blockType = 'image';
        break;
      case 'table':
        blockType = 'table';
        break;
      case 'ul':
      case 'ol':
        // リストは段落として扱う
        blockType = 'paragraph';
        content = this.extractListContent(element);
        break;
      default:
        return null;
    }

    if (!content) {
      content = element.textContent?.trim() || '';
    }

    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      content: content,
      src: element.getAttribute('src') || undefined,
    };
  }

  /**
   * 要素からコンテンツを抽出
   */
  private extractContentFromElement(element: Element, blockType: BlockType): string {
    switch (blockType) {
      case 'table':
        return this.extractTableContent(element as HTMLTableElement);
      case 'image':
        return element.getAttribute('alt') || element.textContent?.trim() || '';
      default:
        return element.textContent?.trim() || '';
    }
  }

  /**
   * スケジュールデータの抽出
   */
  private extractScheduleData(html: string): any[] {
    return calendarService.extractScheduleFromHTML(html);
  }

  /**
   * テーブルコンテンツの抽出
   */
  private extractTableContent(table: HTMLTableElement): string {
    const rows: string[] = [];
    
    for (const row of Array.from(table.rows)) {
      const cells: string[] = [];
      for (const cell of Array.from(row.cells)) {
        cells.push(cell.textContent?.trim() || '');
      }
      rows.push(cells.join('\t'));
    }
    
    return rows.join('\n');
  }

  /**
   * テーブル要素の詳細パース
   */
  private parseTableElement(table: HTMLTableElement): TableData {
    const rows: string[][] = [];
    const hasHeaderRow = table.querySelector('thead') !== null;
    const hasHeaderColumn = false; // 簡易実装
    
    for (const row of Array.from(table.rows)) {
      const cells: string[] = [];
      for (const cell of Array.from(row.cells)) {
        cells.push(cell.textContent?.trim() || '');
      }
      rows.push(cells);
    }
    
    return {
      rows,
      hasHeaderRow,
      hasHeaderColumn
    };
  }

  /**
   * リストコンテンツの抽出
   */
  private extractListContent(element: Element): string {
    const items: string[] = [];
    
    for (const item of Array.from(element.querySelectorAll('li'))) {
      items.push(item.textContent?.trim() || '');
    }
    
    return items.join('\n');
  }

  /**
   * デフォルトブロックの作成
   */
  private createDefaultBlocks(): Block[] {
    return [
      {
        id: `default-${Date.now()}-1`,
        type: 'heading1',
        content: '新しいドキュメント'
      },
      {
        id: `default-${Date.now()}-2`,
        type: 'paragraph',
        content: 'ここに内容を入力してください。'
      }
    ];
  }

  /**
   * フォールバック解析
   */
  parseWithFallback(html: string): Block[] {
    try {
      return this.parseHtmlToBlocks(html);
    } catch (error) {
      console.warn('HTML解析に失敗、フォールバック処理を実行:', error);
      return this.parseWithRegex(html);
    }
  }

  /**
   * 正規表現による解析
   */
  private parseWithRegex(html: string): Block[] {
    const blocks: Block[] = [];
    const elements = this.extractHtmlElementsWithRegex(html);
    
    if (elements) {
      elements.forEach((element, index) => {
        const block = this.parseAsPlainText(element);
        if (block) {
          block.id = `regex-${Date.now()}-${index}`;
          blocks.push(block);
        }
      });
    }
    
    return blocks.length > 0 ? blocks : this.createDefaultBlocks();
  }

  /**
   * プレーンテキストとして解析
   */
  private parseAsPlainText(html: string): Block | null {
    // HTMLタグを除去
    const text = html.replace(/<[^>]*>/g, '').trim();
    
    if (!text) return null;
    
    return {
      id: `text-${Date.now()}`,
      type: 'paragraph',
      content: text
    };
  }
} 