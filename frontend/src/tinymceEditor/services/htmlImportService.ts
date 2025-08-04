export class HtmlImportService {
  static async loadFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(this.sanitizeHtml(content));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  static loadFromString(html: string): string {
    return this.sanitizeHtml(html);
  }

  private static sanitizeHtml(html: string): string {
    // 簡易的なHTMLサニタイズ
    // 実際の実装ではDOMPurifyなどのライブラリを使用することを推奨
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // ファイルの検証
  static validateFile(file: File): boolean {
    const allowedTypes = ['text/html', 'application/xhtml+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.html')) {
      throw new Error('HTMLファイルのみ対応しています');
    }

    if (file.size > maxSize) {
      throw new Error('ファイルサイズが大きすぎます（最大10MB）');
    }

    return true;
  }

  // HTMLの解析と検証
  static parseHtml(html: string): { title: string; content: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.querySelector('title')?.textContent || '無題のドキュメント';
    const body = doc.querySelector('body');
    
    if (!body) {
      throw new Error('HTMLにbody要素が見つかりません');
    }

    return {
      title,
      content: body.innerHTML
    };
  }

  // エラーハンドリング付き読み込み
  static async loadWithErrorHandling(file: File): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      this.validateFile(file);
      const content = await this.loadFromFile(file);
      const parsed = this.parseHtml(content);
      
      return {
        success: true,
        content: parsed.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    }
  }
} 