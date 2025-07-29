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

import { Block, BlockType, CalendarData, TableData } from '../types';
import { calendarService } from './calendarService';

class ClipboardService {
  private previewCache = new Map<string, string>();
  private lastBlocksKey = '';
  private lastCalendarDataKey = '';
  private lastGanttHtml = ''; // 前回生成したガントチャートHTMLを保存

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
          console.log('クリップボードからHTMLを読み取り:', htmlText.substring(0, 200));
          return this.parseHtmlWithFallback(htmlText);
        }
      }
      
      // HTMLがない場合はプレーンテキストにフォールバック
      const text = await navigator.clipboard.readText();
      console.log('クリップボードからテキストを読み取り:', text.substring(0, 200));
      
      if (text.trim()) {
        // コンソールログのような内容の場合は警告
        if (text.includes('App.tsx:') || text.includes('clipboardService.ts:') || text.includes('console.log')) {
          console.warn('クリップボードにコンソールログが含まれています。HTMLをコピーしてください。');
          throw new Error('クリップボードにコンソールログが含まれています。HTMLをコピーしてください。');
        }
        
        return this.parseTextToBlocks(text);
      }
      
      throw new Error('クリップボードにコンテンツが見つかりません');
      
    } catch (error) {
      console.error('クリップボード読み込みエラー:', error);
      throw new Error('クリップボードの読み込みに失敗しました。ブラウザでクリップボードのアクセス許可が必要です。');
    }
  }

  /**
   * 開発環境用：サンプルHTMLを読み込み
   */
  private async loadSampleHtml(): Promise<Block[]> {
    try {
      const response = await fetch('/sample-clipboard-html.html');
      if (!response.ok) {
        throw new Error('サンプルHTMLファイルが見つかりません');
      }
      const htmlText = await response.text();
      return this.parseHtmlWithFallback(htmlText);
    } catch (error) {
      console.error('サンプルHTML読み込みエラー:', error);
      // フォールバック：ハードコードされたサンプルHTML
      return this.parseHtmlWithFallback(this.getHardcodedSampleHtml());
    }
  }

  /**
   * ハードコードされたサンプルHTML
   */
  private getHardcodedSampleHtml(): string {
    return `<h1 data-block-type="heading1" data-block-id="block-20250123-001">会議 議事録</h1> <h2 data-block-type="heading2" data-block-id="block-20250123-002">トピック一覧</h2> <p data-block-type="paragraph" data-block-id="block-20250123-003">① 新メンバー紹介：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-004">② 情報共有：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-005">③ 購入計画：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-006">④ ツール紹介：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-007">⑤ サイト：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-008">⑥ 活用事例紹介：ダミーテキスト</p> <h2 data-block-type="heading2" data-block-id="block-20250123-009">①新メンバー紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-010"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-011"><strong>共有内容:</strong> ダミーテキストです。</p> <p data-block-type="paragraph" data-block-id="block-20250123-012"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-013"><strong>対応の有無:</strong> 対応不要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-014">②情報共有</h2> <p data-block-type="paragraph" data-block-id="block-20250123-015"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-016"><strong>共有内容:</strong></p> <table data-block-type="table" data-block-id="block-20250123-017"> <thead> <tr> <th>項目</th> <th>進捗状況</th> <th>今後の予定</th> </tr> </thead> <tbody> <tr> <td>ダミー項目1</td> <td>ダミー進捗</td> <td>7月9日9時頃にダミー作業予定</td> </tr> <tr> <td>ダミー項目2</td> <td>ダミー進捗</td> <td>7月8日ダミーレビュー後、海外展開（7月28日～次週予定）</td> </tr> <tr> <td>ダミー項目3</td> <td>ダミー進捗</td> <td>ダミー対応が必要</td> </tr> </tbody> </table> <p data-block-type="paragraph" data-block-id="block-20250123-018"><strong>その他:</strong> ダミー数値。</p> <p data-block-type="paragraph" data-block-id="block-20250123-019"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-020"><strong>対応の有無:</strong> ダミー対応が必要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-021">③snowflakeクレジット購入計画</h2> <p data-block-type="paragraph" data-block-id="block-20250123-022"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-023"><strong>共有内容:</strong> 2026年度ダミー計画についてダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-024"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-025"><strong>対応の有無:</strong> 8月末までにダミー対応が必要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-026">④AI活用ツール紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-027"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-028"><strong>共有内容:</strong> ダミーAIツールを紹介。</p> <ul data-block-type="bulletList" data-block-id="block-20250123-029"> <li><strong>ダミー機能1:</strong> ダミーテキスト</li> <li><strong>ダミー機能2:</strong> ダミーテキスト</li> <li><strong>ダミー機能3:</strong> ダミーテキスト</li> <li><strong>ダミー機能4:</strong> ダミーテキスト</li> </ul> <p data-block-type="paragraph" data-block-id="block-20250123-030"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-031"><strong>対応の有無:</strong> ダミー共有予定</p> <h2 data-block-type="heading2" data-block-id="block-20250123-032">⑤SharePointサイト</h2> <p data-block-type="paragraph" data-block-id="block-20250123-033"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-034"><strong>共有内容:</strong> 5月30日ダミー作業完了。ダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-035"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-036"><strong>対応の有無:</strong> ダミー対応を依頼</p> <h2 data-block-type="heading2" data-block-id="block-20250123-037">⑥活用事例紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-038"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-039"><strong>共有内容:</strong></p> <h3 data-block-type="heading3" data-block-id="block-20250123-040">ダミー事例1</h3> <p data-block-type="paragraph" data-block-id="block-20250123-041">ダミーテキストです。</p> <h3 data-block-type="heading3" data-block-id="block-20250123-042">ダミー事例2</h3> <p data-block-type="paragraph" data-block-id="block-20250123-043">ダミーテキストです。</p> <p data-block-type="paragraph" data-block-id="block-20250123-044"><strong>技術的補足:</strong> ダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-045"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-046"><strong>対応の有無:</strong> ダミー共有予定</p> <h2 data-block-type="heading2" data-block-id="block-20250123-047">次回への持ち越し・確認事項</h2> <p data-block-type="paragraph" data-block-id="block-20250123-048">次回8月5日のダミー会議を予定。</p> <h2 data-block-type="heading2" data-block-id="block-20250123-049">備考・全体コメント</h2> <p data-block-type="paragraph" data-block-id="block-20250123-050">ダミーテキストです。</p> <script id="schedule-data" type="application/json"> [ { "id": "evt-20250708-01", "title": "早期レビュー", "start": "2025-07-08", "end": "2025-07-08" }, { "id": "evt-20250709-01", "title": "削除", "start": "2025-07-09", "end": "2025-07-09" }, { "id": "evt-20250711-01", "title": "完了", "start": "2025-07-11", "end": "2025-07-11" }, { "id": "evt-20250728-01", "title": "展開開始", "start": "2025-07-28", "end": "2025-08-04" }, { "id": "evt-20250805-01", "title": "会議", "start": "2025-08-05", "end": "2025-08-05" }, { "id": "evt-20250831-01", "title": "締切", "start": "2025-08-31", "end": "2025-08-31" } ] </script>`;
  }

  /**
   * HTMLテキストをブロック構造に変換
   */
  private parseHtmlToBlocks(html: string): Block[] {
    // コンソールログのような内容の場合は警告
    if (html.includes('App.tsx:') || html.includes('clipboardService.ts:') || html.includes('console.log')) {
      console.warn('HTMLにコンソールログが含まれています。正しいHTMLをコピーしてください。');
      throw new Error('HTMLにコンソールログが含まれています。正しいHTMLをコピーしてください。');
    }
    
    const parser = new DOMParser();
    const blocks: Block[] = [];

    console.log('HTML解析開始:', html.substring(0, 200) + '...');

    // HTMLの正規化処理
    const processedHtml = this.normalizeHtml(html);
    console.log('正規化後のHTML（最初の200文字）:', processedHtml.substring(0, 200));

    // スケジュールデータを自動検出（<script>タグ内のJSONを含む）
    const scheduleEvents = this.extractScheduleData(processedHtml);
    console.log('検出されたスケジュールイベント数:', scheduleEvents.length);
    
    // data-block-type属性の検出を改善
    const hasDataBlockType = processedHtml.includes('data-block-type');
    console.log('data-block-type属性の検出:', hasDataBlockType);

    let doc: Document | null = null;
    let existingBlocks: NodeListOf<Element> = document.querySelectorAll(''); // 空のNodeList

    if (hasDataBlockType) {
      // まず通常のHTML解析を試行
      try {
        doc = parser.parseFromString(processedHtml, 'text/html');
        existingBlocks = doc.querySelectorAll('[data-block-type]');
        console.log('通常のHTML解析結果 - ブロック要素数:', existingBlocks.length);
        
        if (existingBlocks.length === 0) {
          // 正規表現による抽出を試行
          const htmlElements = this.extractHtmlElementsWithRegex(processedHtml);
          if (htmlElements && htmlElements.length > 0) {
            const completeHtml = `<!DOCTYPE html><html><body>${htmlElements.join('')}</body></html>`;
            doc = parser.parseFromString(completeHtml, 'text/html');
            existingBlocks = doc.querySelectorAll('[data-block-type]');
            console.log('正規表現抽出後のブロック要素数:', existingBlocks.length);
          }
        }
      } catch (error) {
        console.warn('HTML解析に失敗しました:', error);
        existingBlocks = document.querySelectorAll(''); // 空のNodeList
      }
    } else {
      // 通常のHTML解析
      try {
        doc = parser.parseFromString(processedHtml, 'text/html');
        existingBlocks = doc.querySelectorAll('[data-block-type]');
      } catch (error) {
        console.warn('通常のHTML解析に失敗しました:', error);
        existingBlocks = document.querySelectorAll(''); // 空のNodeList
      }
    }
    
    console.log('既存のブロック構造要素数:', existingBlocks.length);
    if (existingBlocks.length > 0 && doc) {
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
    
    // エスケープされた引用符を修正
    if (html.includes('\\"')) {
      console.log('エスケープされた引用符を検出しました。修正します。');
      normalized = html.replace(/\\"/g, '"');
    }
    
    // 前後の空白を削除
    normalized = normalized.trim();
    
    // 自己終了タグの正規化
    normalized = normalized.replace(/<br\s*\/?>/gi, '<br />');
    
    return normalized;
  }

  /**
   * HTMLエンティティをデコード
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * 正規表現によるHTML要素抽出
   */
  private extractHtmlElementsWithRegex(html: string): string[] | null {
    // 複数のパターンでHTML要素を抽出
    let htmlElements = html.match(/<[^>]*data-block-type="[^"]*"[^>]*>(?:.*?<\/[^>]*>|)/g);
    console.log('パターン1の結果:', htmlElements ? htmlElements.length : 0);
    
    // 最初のパターンで見つからない場合、より緩いパターンを試行
    if (!htmlElements || htmlElements.length === 0) {
      htmlElements = html.match(/<[^>]*data-block-type="[^"]*"[^>]*>.*?<\/[^>]*>/g);
      console.log('パターン2の結果:', htmlElements ? htmlElements.length : 0);
    }
    
    // さらに緩いパターンを試行
    if (!htmlElements || htmlElements.length === 0) {
      htmlElements = html.match(/<[^>]*data-block-type="[^"]*"[^>]*>/g);
      console.log('パターン3の結果:', htmlElements ? htmlElements.length : 0);
    }
    
    // さらに緩いパターンを試行（エスケープされた文字列に対応）
    if (!htmlElements || htmlElements.length === 0) {
      htmlElements = html.match(/<[^>]*data-block-type="[^"]*"[^>]*>.*?<\/[^>]*>/g);
      console.log('パターン4の結果:', htmlElements ? htmlElements.length : 0);
    }
    
    return htmlElements;
  }

  /**
   * 段落要素を<br>タグで分割して複数のブロックに変換
   */
  private extractParagraphBlocks(element: Element): Block[] {
    let content = element.innerHTML || '';
    
    // <br>タグを改行文字に変換
    content = content.replace(/<br\s*\/?>/gi, '\n');
    
    // HTMLタグを除去してテキストのみを取得
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // HTMLエンティティをデコード
    text = this.decodeHtmlEntities(text);
    
    // 前後の空白を削除
    text = text.trim();
    
    // 改行で分割
    const lines = text.split('\n').filter(line => line.trim());
    
    // 各行を個別のブロックとして作成
    const blocks: Block[] = [];
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (cleanLine.length > 0) {
        blocks.push({
          id: `paragraph-${Date.now()}-${index}`,
          type: 'paragraph',
          content: cleanLine
        });
      }
    });
    
    return blocks;
  }

  /**
   * フォールバック機能付きHTML解析
   */
  private parseHtmlWithFallback(html: string): Block[] {
    try {
      return this.parseHtmlToBlocks(html);
    } catch (error) {
      console.warn('DOMParserでの解析に失敗:', error);
    }
    try {
      return this.parseWithRegex(html);
    } catch (error) {
      console.warn('正規表現での解析に失敗:', error);
    }
    try {
      return this.parseAsPlainText(html);
    } catch (error) {
      console.warn('プレーンテキストとしての解析に失敗:', error);
    }
    console.warn('すべてのパース方法が失敗しました。デフォルトブロックを返します。');
    return this.createDefaultBlocks();
  }

  /**
   * 正規表現によるHTML解析
   */
  private parseWithRegex(html: string): Block[] {
    const normalizedHtml = this.normalizeHtml(html);
    const blocks: Block[] = [];
    
    // bulletListの抽出
    const listMatches = normalizedHtml.match(/<ul[^>]*data-block-type="bulletList"[^>]*>(.*?)<\/ul>/gs);
    if (listMatches) {
      listMatches.forEach((match, index) => {
        const listItems = match.match(/<li[^>]*>(.*?)<\/li>/gs);
        if (listItems) {
          const content = listItems
            .map(item => {
              let text = item.replace(/<li[^>]*>/, '').replace(/<\/li>/, '');
              text = this.decodeHtmlEntities(text);
              text = text.trim();
              text = text.replace(/\s+/g, ' ');
              return text;
            })
            .filter(text => text.length > 0)
            .join('\n');
          
          blocks.push({
            id: `bulletList-${Date.now()}-${index}`,
            type: 'bulletList',
            content: content
          });
        }
      });
    }
    
    // paragraphの抽出
    const paragraphMatches = normalizedHtml.match(/<p[^>]*data-block-type="paragraph"[^>]*>(.*?)<\/p>/gs);
    if (paragraphMatches) {
      paragraphMatches.forEach((match, index) => {
        let content = match.replace(/<p[^>]*data-block-type="paragraph"[^>]*>/, '').replace(/<\/p>/, '');
        content = content.replace(/<br\s*\/?>/gi, '\n');
        content = this.decodeHtmlEntities(content);
        content = content.trim();
        
        // <br>タグで分割
        const lines = content.split('\n').filter(line => line.trim());
        lines.forEach((line, lineIndex) => {
          const cleanLine = line.trim();
          if (cleanLine.length > 0) {
            blocks.push({
              id: `paragraph-${Date.now()}-${index}-${lineIndex}`,
              type: 'paragraph',
              content: cleanLine
            });
          }
        });
      });
    }
    
    return blocks;
  }

  /**
   * プレーンテキストとしての解析
   */
  private parseAsPlainText(html: string): Block[] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const lines = text.split('\n').filter(line => line.trim());
    const blocks: Block[] = [];
    
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (cleanLine.length > 0) {
        blocks.push({
          id: `paragraph-${Date.now()}-${index}`,
          type: 'paragraph',
          content: cleanLine
        });
      }
    });
    
    return blocks;
  }

  /**
   * HTML要素を再帰的に解析してブロックに変換
   */
  private parseHtmlElements(element: Element, blocks: Block[]): void {
    // 直接の子要素のみを処理（再帰的処理を避ける）
    const directChildren = Array.from(element.children);
    console.log('直接の子要素数:', directChildren.length);
    
    directChildren.forEach((child, index) => {
      console.log(`子要素 ${index + 1}:`, child.tagName, child.textContent?.substring(0, 50));
      
      const block = this.elementToBlock(child);
      if (block) {
        console.log(`ブロック作成:`, block.type, block.content.substring(0, 50));
        blocks.push(block);
      } else {
        // 認識できない要素の場合、テキストコンテンツがあれば段落として扱う
        if (child.textContent && child.textContent.trim()) {
          const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const paragraphBlock = {
            id,
            type: 'paragraph' as BlockType,
            content: child.textContent.trim()
          };
          console.log(`段落ブロック作成:`, paragraphBlock.content.substring(0, 50));
          blocks.push(paragraphBlock);
        }
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
        return { id, type: 'heading1', content: this.decodeHtmlEntities(element.textContent || '') };
      case 'h2':
        return { id, type: 'heading2', content: this.decodeHtmlEntities(element.textContent || '') };
      case 'h3':
        return { id, type: 'heading3', content: this.decodeHtmlEntities(element.textContent || '') };
      case 'h4':
      case 'h5':
      case 'h6':
        // h4-h6も見出しとして扱う（h3と同じ）
        return { id, type: 'heading3', content: this.decodeHtmlEntities(element.textContent || '') };
      case 'p':
        // 段落の内容をより詳細に処理（HTMLタグを含む）
        return { id, type: 'paragraph', content: this.extractParagraphContent(element) };
      case 'ul':
      case 'ol':
        return { id, type: 'bulletList', content: this.extractListContent(element) };
      case 'hr':
        return { id, type: 'horizontalRule', content: '' };
      case 'img':
        return { 
          id, 
          type: 'image', 
          content: this.decodeHtmlEntities(element.getAttribute('alt') || ''),
          src: element.getAttribute('src') || undefined
        };
      case 'table':
        return { 
          id, 
          type: 'table', 
          content: this.extractTableContent(element as HTMLTableElement)
        };
      case 'div':
      case 'span':
      case 'section':
      case 'article':
        // コンテナ要素でもテキストコンテンツがあれば段落として扱う
        if (element.textContent && element.textContent.trim()) {
          return { id, type: 'paragraph', content: this.extractParagraphContent(element) };
        }
        return null;
      default:
        // 不明な要素は段落として扱う
        if (element.textContent && element.textContent.trim()) {
          return { id, type: 'paragraph', content: this.decodeHtmlEntities(element.textContent.trim()) };
        }
        return null;
    }
  }

  /**
   * プレーンテキストをブロック構造に変換
   */
  private parseTextToBlocks(text: string): Block[] {
    // HTMLが含まれている場合はHTML解析を試行
    if (text.includes('<') && text.includes('>')) {
      console.log('テキストにHTMLタグが含まれています。HTML解析を試行します。');
      return this.parseHtmlToBlocks(text);
    }
    
    // 通常のテキスト処理
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
   * 要素からブロック固有のコンテンツを抽出
   */
  private extractContentFromElement(element: Element, blockType: BlockType): string {
    switch (blockType) {
      case 'bulletList':
        return this.extractListContent(element);
      case 'table':
        return this.extractTableContent(element as HTMLTableElement);
      case 'paragraph':
        // 段落の場合はHTML書式を保持
        return this.extractParagraphContent(element);
      default:
        // 見出しやその他の要素はテキストコンテンツを返す
        return this.decodeHtmlEntities(element.textContent || '');
    }
  }

  /**
   * HTMLからスケジュールデータを抽出
   */
  private extractScheduleData(html: string): any[] {
    try {
      // <script id="schedule-data" type="application/json">...</script> の検出
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const scheduleScript = doc.querySelector('script#schedule-data[type="application/json"]');
      
      if (scheduleScript && scheduleScript.textContent) {
        const scheduleData = JSON.parse(scheduleScript.textContent.trim());
        if (Array.isArray(scheduleData)) {
          return scheduleData.map((event: any) => ({
            id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: event.title || 'イベント',
            start: event.start || new Date().toISOString().split('T')[0],
            end: event.end || event.start || new Date().toISOString().split('T')[0],
            color: event.color || '#0078d4'
          }));
        }
      }
      
      // 既存のcalendarService.extractScheduleFromHTMLも試行
      const legacyData = calendarService.extractScheduleFromHTML(html);
      if (legacyData.length > 0) {
        return legacyData;
      }
      
      return [];
    } catch (error) {
      console.warn('スケジュールデータの抽出に失敗:', error);
      return [];
    }
  }

  /**
   * テーブル要素から構造化されたコンテンツを抽出
   */
  private extractTableContent(table: HTMLTableElement): string {
    const rows: string[] = [];
    
    // ヘッダー行を処理
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      const headers = Array.from(headerRow.querySelectorAll('th'))
        .map(th => th.textContent?.trim() || '');
      rows.push(headers.join('\t'));
    }
    
    // データ行を処理
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'))
        .map(td => td.textContent?.trim() || '');
      rows.push(cells.join('\t'));
    });
    
    // ヘッダーがない場合、全ての行を処理
    if (!headerRow) {
      const allRows = table.querySelectorAll('tr');
      allRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'))
          .map(cell => cell.textContent?.trim() || '');
        rows.push(cells.join('\t'));
      });
    }
    
    return rows.join('\n');
  }

  /**
   * テーブル要素をTableData構造に変換
   */
  private parseTableElement(table: HTMLTableElement): TableData {
    const rows: string[][] = [];
    let hasHeaderRow = false;
    let hasHeaderColumn = false;
    
    // theadがある場合はヘッダー行として扱う
    const thead = table.querySelector('thead');
    if (thead) {
      hasHeaderRow = true;
      const headerRows = thead.querySelectorAll('tr');
      headerRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('th, td'))
          .map(cell => cell.textContent?.trim() || '');
        rows.push(cells);
      });
    }
    
    // tbodyの行を処理
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const bodyRows = tbody.querySelectorAll('tr');
      bodyRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'))
          .map(cell => cell.textContent?.trim() || '');
        rows.push(cells);
      });
    }
    
    // thead/tbodyがない場合、全ての行を処理
    if (!thead && !tbody) {
      const allRows = table.querySelectorAll('tr');
      allRows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('td, th'))
          .map(cell => cell.textContent?.trim() || '');
        rows.push(cells);
        
        // 最初の行がthのみの場合はヘッダー行として扱う
        if (index === 0 && cells.every(cell => row.querySelectorAll('th').length > 0)) {
          hasHeaderRow = true;
        }
      });
    }
    
    // 最初の列がthのみの場合はヘッダー列として扱う
    if (rows.length > 0) {
      const hasThInFirstColumn = Array.from(table.querySelectorAll('tr'))
        .every(row => row.querySelector('th:first-child'));
      
      if (hasThInFirstColumn) {
        hasHeaderColumn = true;
      }
    }
    
    return {
      rows,
      hasHeaderRow,
      hasHeaderColumn
    };
  }

  /**
   * 段落要素から内容を抽出（太字などの書式を保持）
   */
  /**
   * リスト要素からコンテンツを抽出
   */
  private extractListContent(element: Element): string {
    const listItems = Array.from(element.querySelectorAll('li'))
      .map(li => {
        let text = li.textContent || '';
        text = this.decodeHtmlEntities(text); // HTMLエンティティをデコード
        text = text.trim();
        text = text.replace(/\s+/g, ' '); // 連続する空白を単一の空白に置換
        return text;
      })
      .filter(text => text.length > 0)
      .join('\n');
    return listItems;
  }

  /**
   * 段落要素からコンテンツを抽出
   */
  private extractParagraphContent(element: Element): string {
    let content = element.innerHTML || '';
    content = content.replace(/<br\s*\/?>/gi, '\n');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    text = this.decodeHtmlEntities(text);
    text = text.trim();
    text = text.replace(/\n{3,}/g, '\n\n');
    return text;
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
      border-bottom: 2px solid #ffc107 !important;
      font-weight: bold;
    }
    table.action-item th {
      background-color: rgba(40, 167, 69, 0.2) !important;
      border-bottom: 2px solid #28a745 !important;
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
   * プレビューと同じHTMLを生成（保存・コピー用）
   */
  async generatePreviewHtml(blocks: Block[]): Promise<string> {
    const htmlParts = await Promise.all(blocks.map(async block => {
      const html = await this.blockToHtml(block);
      return html;
    }));
    
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
    th { 
      background-color: #f8f9fa; 
      font-weight: bold; 
    }
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
      border-bottom: 2px solid #ffc107 !important;
      font-weight: bold;
    }
    table.action-item th {
      background-color: rgba(40, 167, 69, 0.2) !important;
      border-bottom: 2px solid #28a745 !important;
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
   * 単一ブロックをHTMLに変換
   */
  private async blockToHtml(block: Block): Promise<string> {
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
      case 'calendar':
        // カレンダーブロックの処理
        if (block.calendarData && block.calendarData.events && block.calendarData.events.length > 0) {
          // スケジュール変更の有無を確認（外部から渡されたフラグを使用）
          const isScheduleChanged = (this as any).isScheduleChanged;
          
          if (isScheduleChanged) {
            // スケジュール変更がある場合のみガントチャートを生成
            try {
              const { ganttService } = await import('./ganttService');
              const events = block.calendarData.events.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end || event.start,
                color: event.color || '#3498db'
              }));
              console.log('ガントチャート生成開始:', events);
              const htmlContent = await ganttService.generateGanttChart(events);
              console.log('ガントチャート生成成功');
              
              // 生成したガントチャートHTMLを保存
              this.lastGanttHtml = htmlContent;
              
              return `<div ${attrs}${classAttr} style="width: 100%;">
                <div style="width: 100%; height: 600px; overflow: auto;">${htmlContent}</div>
              </div>`;
            } catch (error) {
              console.error('ガントチャート生成に失敗:', error);
              const jsonData = JSON.stringify(block.calendarData, null, 2);
              return `<pre ${attrs}${classAttr} style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px;">
エラー: ${error instanceof Error ? error.message : '不明なエラー'}
データ: ${this.escapeHtml(jsonData)}
              </pre>`;
            }
          } else {
            // スケジュール変更がない場合は前回生成したガントチャートHTMLを再利用
            if (this.lastGanttHtml) {
              console.log('スケジュール変更なしのため、前回のガントチャートHTMLを再利用');
              return `<div ${attrs}${classAttr} style="width: 100%;">
                <div style="width: 100%; height: 600px; overflow: auto;">${this.lastGanttHtml}</div>
              </div>`;
            } else {
              // 前回のガントチャートHTMLがない場合は新規生成
              console.log('前回のガントチャートHTMLがないため、新規生成します');
              try {
                const { ganttService } = await import('./ganttService');
                const events = block.calendarData.events.map(event => ({
                  id: event.id,
                  title: event.title,
                  start: event.start,
                  end: event.end || event.start,
                  color: event.color || '#3498db'
                }));
                console.log('ガントチャート生成開始:', events);
                const htmlContent = await ganttService.generateGanttChart(events);
                console.log('ガントチャート生成成功');
                
                // 生成したガントチャートHTMLを保存
                this.lastGanttHtml = htmlContent;
                
                return `<div ${attrs}${classAttr} style="width: 100%;">
                  <div style="width: 100%; height: 600px; overflow: auto;">${htmlContent}</div>
                </div>`;
              } catch (error) {
                console.error('ガントチャート生成に失敗:', error);
                const jsonData = JSON.stringify(block.calendarData, null, 2);
                return `<pre ${attrs}${classAttr} style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px;">
エラー: ${error instanceof Error ? error.message : '不明なエラー'}
データ: ${this.escapeHtml(jsonData)}
                </pre>`;
              }
            }
          }
        } else {
          return `<div ${attrs}${classAttr}>スケジュールデータがありません</div>`;
        }
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

  /**
   * テキストボックスからHTMLテキストを読み込み
   */
  importFromText(htmlText: string): Block[] {
    try {
      if (!htmlText.trim()) {
        throw new Error('テキストが入力されていません');
      }
      
      console.log('=== テキスト読み込み開始 ===');
      console.log('入力テキスト長さ:', htmlText.length);
      console.log('入力テキストプレビュー:', htmlText.substring(0, 200));
      
      const blocks = this.parseHtmlWithFallback(htmlText);
      
      console.log('解析結果:', blocks.length, '個のブロック');
      blocks.forEach((block, index) => {
        console.log(`ブロック ${index}:`, block.type, block.content.substring(0, 50));
      });
      
      return blocks;
    } catch (error) {
      console.error('テキスト読み込みエラー:', error);
      throw new Error('テキストの読み込みに失敗しました。');
    }
  }

  /**
   * HTMLをクリップボードにコピー
   */
  async copyHtmlToClipboard(blocks: Block[]): Promise<boolean> {
    try {
      // プレビューと同じHTMLを生成
      const html = await this.generatePreviewHtml(blocks);
      await navigator.clipboard.writeText(html);
      console.log('HTMLをクリップボードにコピーしました');
      return true;
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
      return false;
    }
  }

  /**
   * HTMLファイルをダウンロード
   */
  async downloadHtmlFile(blocks: Block[], filename: string = 'document.html'): Promise<boolean> {
    try {
      // プレビューと同じHTMLを生成
      const html = await this.generatePreviewHtml(blocks);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('HTMLファイルをダウンロードしました:', filename);
      return true;
    } catch (error) {
      console.error('HTMLファイルのダウンロードに失敗:', error);
      return false;
    }
  }

  /**
   * ブロックをプレビュー用HTMLに変換
   */
  async blocksToPreviewHtml(blocks: Block[]): Promise<string> {
    try {
      // プレビュー用のシンプルなHTMLを生成（完全なHTMLドキュメントではなく、コンテンツのみ）
      const htmlParts = await Promise.all(blocks.map(async block => {
        const html = await this.blockToPreviewHtml(block);
        return html;
      }));
      
      const result = `<div class="preview-content">${htmlParts.join('\n')}</div>`;
      console.log('clipboardService.blocksToPreviewHtml 生成結果:', result);
      console.log('preview-contentクラスが含まれているか:', result.includes('preview-content'));
      return result;
    } catch (error) {
      console.error('プレビューHTML生成に失敗:', error);
      return '<div class="preview-content"><p>プレビューの生成に失敗しました</p></div>';
    }
  }

  /**
   * 単一ブロックをプレビュー用HTMLに変換
   */
  private async blockToPreviewHtml(block: Block): Promise<string> {
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
        
        return `<table ${attrs}${classAttr}>\n${tableHtml}\n</table>`;
      case 'calendar':
        // カレンダーは特別な処理が必要
        if (block.calendarData) {
          return `<div ${attrs}${classAttr}>カレンダー: ${this.escapeHtml(block.content)}</div>`;
        }
        return `<div ${attrs}${classAttr}>カレンダー: ${this.escapeHtml(block.content)}</div>`;
      default:
        return `<p ${attrs}${classAttr}>${this.escapeHtml(block.content)}</p>`;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const clipboardService = new ClipboardService();
