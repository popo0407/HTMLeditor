// PDF CSSはpublic/pdf.cssからfetchで取得

export class HtmlExportService {
  // pdf.cssをfetchしてHTMLを生成（非同期）
  static async exportToHtml(content: string, title: string = 'エクスポートされたドキュメント'): Promise<string> {
    let css = '';
    try {
      const res = await fetch('/pdf.css');
      if (res.ok) {
        css = await res.text();
      } else {
        css = '';
      }
    } catch (e) {
      css = '';
    }
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          ${css}
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

  static async downloadHtml(
    content: string,
    filename: string = "document.html",
    title?: string
  ): Promise<void> {
    const html = await this.exportToHtml(content, title);
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
  static async exportWithOptions(
    content: string,
    options: {
      format: 'html' | 'text';
      filename?: string;
      title?: string;
    }
  ): Promise<void> {
    const { format, filename, title } = options;
    if (format === 'html') {
      await this.downloadHtml(content, filename || 'document.html', title);
    } else if (format === 'text') {
      this.downloadText(content, filename || 'document.txt');
    }
  }

  // クリップボードにコピー
  static async copyToClipboard(content: string, format: 'html' | 'text' = 'html'): Promise<void> {
    if (format === 'html') {
      // HTMLとしてコピー
      const html = await this.exportToHtml(content);
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([this.exportToText(content)], { type: 'text/plain' })
        })
      ]);
    } else {
      // プレーンテキストとしてコピー
      const text = this.exportToText(content);
      await navigator.clipboard.writeText(text);
    }
  }

  // 会議情報と議事録を結合して出力するHTMLフラグメントを作成
  static buildCombinedFragment(meetingInfo: {
  会議タイトル?: string;
  参加者?: string[] | string;
  会議日時?: string;
  会議場所?: string;
  要約?: string;
  部門?: string;
  大分類?: string; // (廃止予定: 出力から除外)
  中分類?: string; // (廃止予定: 出力から除外)
  小分類?: string; // (廃止予定: 出力から除外)
  } | null | undefined, minutesHtml: string): string {
    if (!meetingInfo) return minutesHtml || '';

    const title = meetingInfo.会議タイトル || '';
    const datetime = meetingInfo.会議日時 || '';
    const location = meetingInfo.会議場所 || '';
  const summary = (meetingInfo.要約 || '').toString();
  // 出力では部門のみ使用
  const department = meetingInfo.部門 || '';
    let participants: string[] | string = meetingInfo.参加者 || [];
    if (typeof participants === 'string') {
      participants = participants.split(/\r?\n/).filter(Boolean);
    }

    const participantsHtml = Array.isArray(participants)
      ? participants.map(p => HtmlExportService.escapeHtml(p)).join('<br/>')
      : HtmlExportService.escapeHtml(String(participants));

    const summaryHtml = HtmlExportService.escapeHtml(summary).replace(/\r?\n/g, '<br/>');


    const departmentHtml = department ? `<h3>部門</h3><p>${HtmlExportService.escapeHtml(department)}</p>` : '';

    const fragment = `
      <h1>${HtmlExportService.escapeHtml(title)}</h1>
      <h3>会議日時: ${HtmlExportService.escapeHtml(datetime)}</h3>
      <h3>場所: ${HtmlExportService.escapeHtml(location)}</h3>
      ${departmentHtml}
      <h3>参加者</h3>
      <p>${participantsHtml}</p>
      <h3>会議概要</h3>
      <p>${summaryHtml}</p>
      ${minutesHtml || ''}
    `;

    return fragment;
  }

  private static escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}