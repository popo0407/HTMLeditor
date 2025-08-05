/**
 * Wordファイル出力サービス
 * 
 * 開発憲章の「関心の分離」に従い、
 * Wordファイル出力を独立したサービスで管理
 */

export class WordExportService {
  /**
   * HTMLコンテンツをWordファイルとしてダウンロード
   * @param htmlContent HTMLコンテンツ
   * @param filename ファイル名（.docx拡張子なし）
   * @param title ドキュメントタイトル
   */
  static async downloadWord(
    htmlContent: string,
    filename: string = 'document',
    title: string = 'エクスポートされたドキュメント'
  ): Promise<void> {
    try {
      // バックエンドAPIにリクエスト
      const response = await fetch('/api/word/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: htmlContent,
          filename: filename,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // レスポンスからBlobを取得
      const blob = await response.blob();
      
      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Wordファイルのダウンロードが完了しました');
    } catch (error) {
      console.error('Wordファイルのダウンロードに失敗しました:', error);
      throw new Error('Wordファイルの作成に失敗しました');
    }
  }

  /**
   * HTMLコンテンツをWordファイルとしてBlobで返す
   * @param htmlContent HTMLコンテンツ
   * @param title ドキュメントタイトル
   * @returns WordファイルのBlob
   */
  static async createWordBlob(
    htmlContent: string,
    title: string = 'エクスポートされたドキュメント'
  ): Promise<Blob> {
    try {
      const response = await fetch('/api/word/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: htmlContent,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Wordファイルの作成に失敗しました:', error);
      throw new Error('Wordファイルの作成に失敗しました');
    }
  }

  /**
   * HTMLコンテンツをクリップボードにWordファイルとしてコピー
   * @param htmlContent HTMLコンテンツ
   * @param title ドキュメントタイトル
   */
  static async copyToClipboardAsWord(
    htmlContent: string,
    title: string = 'エクスポートされたドキュメント'
  ): Promise<void> {
    try {
      const blob = await this.createWordBlob(htmlContent, title);
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': blob
        })
      ]);

      console.log('Wordファイルをクリップボードにコピーしました');
    } catch (error) {
      console.error('Wordファイルのクリップボードへのコピーに失敗しました:', error);
      throw new Error('Wordファイルのクリップボードへのコピーに失敗しました');
    }
  }
} 