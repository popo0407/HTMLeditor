/**
 * クリップボード操作サービス
 * 
 * 責務:
 * - クリップボードからのデータ読み込み
 * - クリップボードへのデータ書き込み
 * - ファイル操作（ダウンロード）
 * 
 * 開発憲章の「単一責任の原則」に従い、クリップボード操作のみを担当
 */

import { Block } from '../types';
import { HtmlParserService } from './htmlParserService';
import { HtmlGenerator } from '../utils/htmlGenerator';

class ClipboardService {
  private htmlParser = new HtmlParserService();
  private previewCache = new Map<string, string>();
  private lastBlocksKey = '';
  private lastCalendarDataKey = '';
  private lastGanttHtml = '';

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
          return this.htmlParser.parseWithFallback(htmlText);
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
      return this.htmlParser.parseWithFallback(htmlText);
    } catch (error) {
      console.error('サンプルHTML読み込みエラー:', error);
      // フォールバック：ハードコードされたサンプルHTML
      return this.htmlParser.parseWithFallback(this.getHardcodedSampleHtml());
    }
  }

  /**
   * ハードコードされたサンプルHTML
   */
  private getHardcodedSampleHtml(): string {
    return `<h1 data-block-type="heading1" data-block-id="block-20250123-001">会議 議事録</h1> <h2 data-block-type="heading2" data-block-id="block-20250123-002">トピック一覧</h2> <p data-block-type="paragraph" data-block-id="block-20250123-003">① 新メンバー紹介：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-004">② 情報共有：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-005">③ 購入計画：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-006">④ ツール紹介：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-007">⑤ サイト：ダミーテキスト</p> <p data-block-type="paragraph" data-block-id="block-20250123-008">⑥ 活用事例紹介：ダミーテキスト</p> <h2 data-block-type="heading2" data-block-id="block-20250123-009">①新メンバー紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-010"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-011"><strong>共有内容:</strong> ダミーテキストです。</p> <p data-block-type="paragraph" data-block-id="block-20250123-012"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-013"><strong>対応の有無:</strong> 対応不要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-014">②情報共有</h2> <p data-block-type="paragraph" data-block-id="block-20250123-015"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-016"><strong>共有内容:</strong></p> <table data-block-type="table" data-block-id="block-20250123-017"> <thead> <tr> <th>項目</th> <th>進捗状況</th> <th>今後の予定</th> </tr> </thead> <tbody> <tr> <td>ダミー項目1</td> <td>ダミー進捗</td> <td>7月9日9時頃にダミー作業予定</td> </tr> <tr> <td>ダミー項目2</td> <td>ダミー進捗</td> <td>7月8日ダミーレビュー後、海外展開（7月28日～次週予定）</td> </tr> <tr> <td>ダミー項目3</td> <td>ダミー進捗</td> <td>ダミー対応が必要</td> </tr> </tbody> </table> <p data-block-type="paragraph" data-block-id="block-20250123-018"><strong>その他:</strong> ダミー数値。</p> <p data-block-type="paragraph" data-block-id="block-20250123-019"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-020"><strong>対応の有無:</strong> ダミー対応が必要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-021">③snowflakeクレジット購入計画</h2> <p data-block-type="paragraph" data-block-id="block-20250123-022"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-023"><strong>共有内容:</strong> 2026年度ダミー計画についてダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-024"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-025"><strong>対応の有無:</strong> 8月末までにダミー対応が必要</p> <h2 data-block-type="heading2" data-block-id="block-20250123-026">④AI活用ツール紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-027"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-028"><strong>共有内容:</strong> ダミーAIツールを紹介。</p> <ul data-block-type="bulletList" data-block-id="block-20250123-029"> <li><strong>ダミー機能1:</strong> ダミーテキスト</li> <li><strong>ダミー機能2:</strong> ダミーテキスト</li> <li><strong>ダミー機能3:</strong> ダミーテキスト</li> <li><strong>ダミー機能4:</strong> ダミーテキスト</li> </ul> <p data-block-type="paragraph" data-block-id="block-20250123-030"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-031"><strong>対応の有無:</strong> ダミー共有予定</p> <h2 data-block-type="heading2" data-block-id="block-20250123-032">⑤SharePointサイト</h2> <p data-block-type="paragraph" data-block-id="block-20250123-033"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-034"><strong>共有内容:</strong> 5月30日ダミー作業完了。ダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-035"><strong>質問・コメント:</strong> 特になし</p> <p data-block-type="paragraph" data-block-id="block-20250123-036"><strong>対応の有無:</strong> ダミー対応を依頼</p> <h2 data-block-type="heading2" data-block-id="block-20250123-037">⑥活用事例紹介</h2> <p data-block-type="paragraph" data-block-id="block-20250123-038"><strong>担当者:</strong> ダミー担当者</p> <p data-block-type="paragraph" data-block-id="block-20250123-039"><strong>共有内容:</strong></p> <h3 data-block-type="heading3" data-block-id="block-20250123-040">ダミー事例1</h3> <p data-block-type="paragraph" data-block-id="block-20250123-041">ダミーテキストです。</p> <h3 data-block-type="heading3" data-block-id="block-20250123-042">ダミー事例2</h3> <p data-block-type="paragraph" data-block-id="block-20250123-043">ダミーテキストです。</p> <p data-block-type="paragraph" data-block-id="block-20250123-044"><strong>技術的補足:</strong> ダミーテキスト。</p> <p data-block-type="paragraph" data-block-id="block-20250123-045"><strong>質問・コメント:</strong> ダミー質問あり。</p> <p data-block-type="paragraph" data-block-id="block-20250123-046"><strong>対応の有無:</strong> ダミー共有予定</p> <h2 data-block-type="heading2" data-block-id="block-20250123-047">次回への持ち越し・確認事項</h2> <p data-block-type="paragraph" data-block-id="block-20250123-048">次回8月5日のダミー会議を予定。</p> <h2 data-block-type="heading2" data-block-id="block-20250123-049">備考・全体コメント</h2> <p data-block-type="paragraph" data-block-id="block-20250123-050">ダミーテキストです。</p> <script id="schedule-data" type="application/json"> [ { "id": "evt-20250708-01", "title": "早期レビュー", "start": "2025-07-08", "end": "2025-07-08" }, { "id": "evt-20250709-01", "title": "削除", "start": "2025-07-09", "end": "2025-07-09" }, { "id": "evt-20250711-01", "title": "完了", "start": "2025-07-11", "end": "2025-07-11" }, { "id": "evt-20250728-01", "title": "展開開始", "start": "2025-07-28", "end": "2025-08-04" }, { "id": "evt-20250805-01", "title": "会議", "start": "2025-08-05", "end": "2025-08-05" }, { "id": "evt-20250831-01", "title": "締切", "start": "2025-08-31", "end": "2025-08-31" } ] </script>`;
  }

  /**
   * テキストをブロックに変換
   */
  private parseTextToBlocks(text: string): Block[] {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return this.createDefaultBlocks();
    }
    
    return lines.map((line, index) => ({
      id: `text-${Date.now()}-${index}`,
      type: 'paragraph' as const,
      content: line.trim()
    }));
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
   * ブロックをTeams用HTMLに変換
   */
  blocksToTeamsHtml(blocks: Block[]): string {
    const htmlParts = blocks.map(block => HtmlGenerator.generateBlockHtml(block));
    return this.generateHtmlTemplate(htmlParts);
  }

  /**
   * ブロックをHTMLに変換
   */
  async blocksToHtml(blocks: Block[]): Promise<string> {
    const htmlParts = await Promise.all(blocks.map(async block => {
      return HtmlGenerator.generateBlockHtml(block);
    }));
    
    return this.generateHtmlTemplate(htmlParts);
  }

  /**
   * プレビュー用HTMLを生成
   */
  async generatePreviewHtml(blocks: Block[]): Promise<string> {
    return HtmlGenerator.generatePreviewHtml(blocks);
  }

  /**
   * HTMLテンプレートを生成
   */
  private generateHtmlTemplate(htmlParts: string[], title: string = 'HTMLエディタで作成されたドキュメント'): string {
    const styles = this.generateCommonHtmlStyles();
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  ${htmlParts.join('\n')}
</body>
</html>`;
  }

  /**
   * 共通HTMLスタイルを生成
   */
  private generateCommonHtmlStyles(): string {
    return `
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
  `;
  }

  /**
   * テキストからブロックをインポート
   */
  importFromText(htmlText: string): Block[] {
    try {
      return this.htmlParser.parseWithFallback(htmlText);
    } catch (error) {
      console.error('テキストからのインポートに失敗:', error);
      return this.createDefaultBlocks();
    }
  }

  /**
   * HTMLをクリップボードにコピー
   */
  async copyHtmlToClipboard(blocks: Block[]): Promise<boolean> {
    try {
      const html = await this.blocksToHtml(blocks);
      await navigator.clipboard.writeText(html);
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
      const html = await this.blocksToHtml(blocks);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
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
    return HtmlGenerator.generatePreviewHtml(blocks);
  }
}

// シングルトンインスタンスをエクスポート
export const clipboardService = new ClipboardService();
