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
  講評?: string;
  発行者?: string;
  部?: string;
  課?: string;
  職種?: string;
  大分類?: string;
  中分類?: string;
  小分類?: string;
  機密レベル?: string;
  } | null | undefined, minutesHtml: string): string {
    if (!meetingInfo) return minutesHtml || '';

    const title = meetingInfo.会議タイトル || '';
    const datetime = meetingInfo.会議日時 || '';
    const location = meetingInfo.会議場所 || '';
  const summary = (meetingInfo.要約 || '').toString();
  const review = (meetingInfo.講評 || '').toString();
  const issuer = meetingInfo.発行者 || '';
  const bu = meetingInfo.部 || '';
  const ka = meetingInfo.課 || '';
  const jobType = meetingInfo.職種 || '';
  const category1 = meetingInfo.大分類 || '';
  const category2 = meetingInfo.中分類 || '';
  const category3 = meetingInfo.小分類 || '';
    let participants: string[] | string = meetingInfo.参加者 || [];
    if (typeof participants === 'string') {
      participants = participants.split(/\r?\n/).filter(Boolean);
    }

    const participantsHtml = Array.isArray(participants)
      ? participants.map(p => HtmlExportService.escapeHtml(p)).join('<br/>')
      : HtmlExportService.escapeHtml(String(participants));

    // 改行処理のヘルパー関数（\n と /n の両方に対応）
    const processLineBreaks = (text: string): string => {
      if (!text) return '';
      return HtmlExportService.escapeHtml(String(text))
        .replace(/\/n/g, '<br/>')   // /n を <br/> に変換
        .replace(/\\n/g, '<br/>')   // \n を <br/> に変換
        .replace(/\r?\n/g, '<br/>'); // 実際の改行を <br/> に変換
    };

    const summaryHtml = processLineBreaks(summary);
    const reviewHtml = processLineBreaks(review);

    const buHtml = bu ? `<h3 class="meeting-info-department">部</h3><p class="meeting-info-department-value">${HtmlExportService.escapeHtml(bu)}</p>` : '';
    const kaHtml = ka ? `<h3 class="meeting-info-section">課</h3><p class="meeting-info-section-value">${HtmlExportService.escapeHtml(ka)}</p>` : '';
    const jobTypeHtml = jobType ? `<h3 class="meeting-info-jobtype">職種</h3><p class="meeting-info-jobtype-value">${HtmlExportService.escapeHtml(jobType)}</p>` : '';
    const category1Html = category1 ? `<h3 class="meeting-info-category1">大分類</h3><p class="meeting-info-category1-value">${HtmlExportService.escapeHtml(category1)}</p>` : '';
    const category2Html = category2 ? `<h3 class="meeting-info-category2">中分類</h3><p class="meeting-info-category2-value">${HtmlExportService.escapeHtml(category2)}</p>` : '';
    const category3Html = category3 ? `<h3 class="meeting-info-category3">小分類</h3><p class="meeting-info-category3-value">${HtmlExportService.escapeHtml(category3)}</p>` : '';

    const issuerHtml = issuer ? `<h3 class="meeting-info-issuer">発行者</h3><p class="meeting-info-issuer-value">${HtmlExportService.escapeHtml(issuer)}</p>` : '';

    const fragment = `
      <div class="meeting-info-container">
        <h1 class="meeting-info-title">${HtmlExportService.escapeHtml(title)}</h1>
        <h3 class="meeting-info-datetime">会議日時: ${HtmlExportService.escapeHtml(datetime)}</h3>
        <h3 class="meeting-info-location">場所: ${HtmlExportService.escapeHtml(location)}</h3>
        ${buHtml}
        ${kaHtml}
        ${jobTypeHtml}
        ${category1Html}
        ${category2Html}
        ${category3Html}
        <h3 class="meeting-info-participants-label">参加者</h3>
        <p class="meeting-info-participants">${participantsHtml}</p>
        <h3 class="meeting-info-summary-label">会議概要</h3>
        <p class="meeting-info-summary">${summaryHtml}</p>
        <h3 class="meeting-info-review-label">講評</h3>
        <p class="meeting-info-review">${reviewHtml}</p>
        ${issuerHtml}
      </div>
      <div class="meeting-minutes-content">
        ${minutesHtml || ''}
      </div>
    `;

    return fragment;
  }

  // XML形式で出力
  static buildXmlFragment(meetingInfo: {
    会議タイトル?: string;
    参加者?: string[] | string;
    会議日時?: string;
    会議場所?: string;
    要約?: string;
    講評?: string;
    発行者?: string;
    部?: string;
    課?: string;
    職種?: string;
    大分類?: string;
    中分類?: string;
    小分類?: string;
    機密レベル?: string;
  } | null | undefined, minutesHtml: string): string {
    if (!meetingInfo) return '';

    const title = meetingInfo.会議タイトル || '';
    const datetime = meetingInfo.会議日時 || '';
    const location = meetingInfo.会議場所 || '';
    const summary = (meetingInfo.要約 || '').toString();
    const review = (meetingInfo.講評 || '').toString();
    const issuer = meetingInfo.発行者 || '';
    const bu = meetingInfo.部 || '';
    const ka = meetingInfo.課 || '';
    const jobType = meetingInfo.職種 || '';
    const category1 = meetingInfo.大分類 || '';
    const category2 = meetingInfo.中分類 || '';
    const category3 = meetingInfo.小分類 || '';

    let participants: string[] | string = meetingInfo.参加者 || [];
    if (typeof participants === 'string') {
      participants = participants.split(/\r?\n/).filter(Boolean);
    }

    // 参加者を配列として出力
    const participantsArray = Array.isArray(participants) ? participants : [String(participants)];
    const participantsXml = participantsArray.map(p => this.escapeXml(p)).join(',');

    const xml = `<会議タイトル>${this.escapeXml(title)}</会議タイトル>
<参加者>${participantsXml}</参加者>
<会議日時>${this.escapeXml(datetime)}</会議日時>
<会議場所>${this.escapeXml(location)}</会議場所>
<部>${this.escapeXml(bu)}</部>
<課>${this.escapeXml(ka)}</課>
<職種>${this.escapeXml(jobType)}</職種>
<大分類>${this.escapeXml(category1)}</大分類>
<中分類>${this.escapeXml(category2)}</中分類>
<小分類>${this.escapeXml(category3)}</小分類>
<要約>${this.escapeXml(summary)}</要約>
<講評>${this.escapeXml(review)}</講評>
<発行者>${this.escapeXml(issuer)}</発行者>
<議事録>${this.escapeXml(minutesHtml)}</議事録>`;

    return xml;
  }

  // XMLとしてクリップボードにコピー
  static async copyXmlToClipboard(meetingInfo: any, minutesHtml: string): Promise<void> {
    const xmlContent = this.buildXmlFragment(meetingInfo, minutesHtml);
    await navigator.clipboard.writeText(xmlContent);
  }

  private static escapeXml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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