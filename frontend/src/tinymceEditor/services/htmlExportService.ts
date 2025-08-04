export class HtmlExportService {
  static exportToHtml(content: string, title: string = 'エクスポートされたドキュメント'): string {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .important { 
            background-color: #fff3cd; 
            color: #856404; 
            padding: 8px; 
            border-radius: 4px; 
            margin: 8px 0;
          }
          .action-item { 
            background-color: #d1ecf1; 
            color: #0c5460; 
            padding: 8px; 
            border-radius: 4px; 
            margin: 8px 0;
          }
          .custom-table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 16px 0; 
          }
          .custom-table td, 
          .custom-table th { 
            border: 1px solid #ddd; 
            padding: 8px; 
          }
          .custom-table th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.25em; }
          p { margin-bottom: 16px; }
          ul, ol { margin-bottom: 16px; padding-left: 24px; }
          li { margin-bottom: 4px; }
          blockquote {
            border-left: 4px solid #ddd;
            margin: 16px 0;
            padding-left: 16px;
            color: #666;
          }
          code {
            background-color: #f6f8fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
          }
          pre code {
            background-color: transparent;
            padding: 0;
          }
          @media print {
            body { max-width: none; }
            .important, .action-item { 
              border: 1px solid #ccc; 
              break-inside: avoid; 
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  static downloadHtml(
    content: string,
    filename: string = "document.html",
    title?: string
  ): void {
    const html = this.exportToHtml(content, title);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // プレーンテキストとしてエクスポート
  static exportToText(content: string): string {
    // HTMLタグを除去してプレーンテキストに変換
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  // プレーンテキストとしてダウンロード
  static downloadText(content: string, filename: string = "document.txt"): void {
    const text = this.exportToText(content);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // エクスポートオプション付き
  static exportWithOptions(
    content: string,
    options: {
      format: 'html' | 'text';
      filename?: string;
      title?: string;
    }
  ): void {
    const { format, filename, title } = options;
    
    if (format === 'html') {
      this.downloadHtml(content, filename || 'document.html', title);
    } else if (format === 'text') {
      this.downloadText(content, filename || 'document.txt');
    }
  }

  // クリップボードにコピー
  static copyToClipboard(content: string, format: 'html' | 'text' = 'html'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (format === 'html') {
        // HTMLとしてコピー
        const html = this.exportToHtml(content);
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([this.exportToText(content)], { type: 'text/plain' })
          })
        ]).then(resolve).catch(reject);
      } else {
        // プレーンテキストとしてコピー
        const text = this.exportToText(content);
        navigator.clipboard.writeText(text).then(resolve).catch(reject);
      }
    });
  }
} 