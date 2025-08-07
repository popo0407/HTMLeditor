/**
 * PDFファイル出力サービス
 * 
 * 開発憲章の「関心の分離」に従い、
 * PDFファイル出力を独立したサービスで管理
 */

export class PdfExportService {
  /**
   * HTMLコンテンツをPDFファイルとしてダウンロード
   * @param htmlContent HTMLコンテンツ
   * @param filename ファイル名（.pdf拡張子なし）
   * @param title ドキュメントタイトル
   */
  static async downloadPdf(
    htmlContent: string,
    filename: string = 'document',
    title: string = 'エクスポートされたドキュメント'
  ): Promise<void> {
    try {
      // バックエンドAPIにリクエスト（絶対URLを使用）
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';
      const response = await fetch(`${API_BASE_URL}/api/pdf/export`, {
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
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('PDFファイルのダウンロードが完了しました');
    } catch (error) {
      console.error('PDFファイルのダウンロードに失敗しました:', error);
      throw new Error('PDFファイルの作成に失敗しました');
    }
  }

  /**
   * HTMLコンテンツをPDFファイルとしてBlobで返す
   * @param htmlContent HTMLコンテンツ
   * @param title ドキュメントタイトル
   * @returns PDFファイルのBlob
   */
  static async createPdfBlob(
    htmlContent: string,
    title: string = 'エクスポートされたドキュメント'
  ): Promise<Blob> {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';
      const response = await fetch(`${API_BASE_URL}/api/pdf/export`, {
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
      console.error('PDFファイルの作成に失敗しました:', error);
      throw new Error('PDFファイルの作成に失敗しました');
    }
  }
} 