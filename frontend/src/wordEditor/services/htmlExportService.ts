/**
 * HTML出力サービス
 * 
 * 開発憲章の「関心の分離」に従い、
 * HTML出力機能を独立したサービスとして実装
 */

import { EditorContent, EditorFormats, TableData } from '../types/wordEditorTypes';

export interface HtmlExportOptions {
  includeStyles?: boolean;
  selfContained?: boolean;
  minify?: boolean;
}

export class HtmlExportService {
  /**
   * エディタコンテンツをHTMLに変換
   */
  exportToHtml(content: EditorContent, options: HtmlExportOptions = {}): string {
    const { includeStyles = true, selfContained = true, minify = false } = options;
    
    let html = content.content;
    
    // 見出し・強調スタイルの適用
    html = this.applyFormats(html, content.formats);
    
    // 表のHTML出力は別途処理する必要があります
    // 現在のEditorContentにはtableDataが含まれていないため、
    // 表データは別の方法で管理されています
    
    if (selfContained) {
      html = this.wrapInDocument(html, includeStyles);
    }
    
    if (minify) {
      html = this.minifyHtml(html);
    }
    
    return html;
  }

  /**
   * 見出し・強調スタイルを適用
   */
  private applyFormats(html: string, formats: EditorFormats): string {
    // 見出しレベルの適用
    if (formats.heading && formats.heading !== 'p') {
      const headingTag = formats.heading;
      html = html.replace(/<p>(.*?)<\/p>/g, `<${headingTag}>$1</${headingTag}>`);
    }
    
    // 強調スタイルの適用（より確実に）
    if (formats.emphasis && formats.emphasis !== 'normal') {
      const emphasisClass = formats.emphasis;
      // 既存のクラスがある場合は追加、ない場合は新規作成
      html = html.replace(/<p([^>]*)>(.*?)<\/p>/g, (match, attributes, content) => {
        if (attributes.includes('class=')) {
          // 既存のクラスがある場合
          return match.replace(/class="([^"]*)"/, `class="$1 ${emphasisClass}"`);
        } else {
          // クラスがない場合
          return `<p class="${emphasisClass}">${content}</p>`;
        }
      });
    }
    
    return html;
  }

  /**
   * 完全なHTMLドキュメントにラップ
   */
  private wrapInDocument(html: string, includeStyles: boolean): string {
    const styles = includeStyles ? this.getStyles() : '';
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wordライクエディタ出力</title>
    ${styles}
</head>
<body>
    <div class="word-editor-content">
        ${html}
    </div>
</body>
</html>`;
  }

  /**
   * CSSスタイルを取得
   */
  private getStyles(): string {
    return `<style>
/* Wordライクエディタスタイル */
.word-editor-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #374151;
}

/* 見出しスタイル */
.word-editor-content h1 {
    font-size: 32px;
    font-weight: 900;
    color: #111827;
    margin: 32px 0 20px 0;
    line-height: 1.1;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 12px;
    position: relative;
}

.word-editor-content h2 {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    margin: 28px 0 16px 0;
    line-height: 1.2;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 8px;
    position: relative;
}

.word-editor-content h3 {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 24px 0 12px 0;
    line-height: 1.3;
    position: relative;
}

.word-editor-content p {
    margin: 16px 0;
    line-height: 1.7;
    font-size: 16px;
}

/* 強調スタイル */
.word-editor-content .important {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-left: 6px solid #f59e0b;
    padding: 20px 24px;
    margin: 20px 0;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
    position: relative;
    font-weight: 600;
}

.word-editor-content .action-item {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-left: 6px solid #3b82f6;
    padding: 20px 24px;
    margin: 20px 0;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    position: relative;
    font-weight: 600;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .word-editor-content {
        padding: 16px;
    }

    .word-editor-content h1 {
        font-size: 28px;
    }

    .word-editor-content h2 {
        font-size: 24px;
    }

    .word-editor-content h3 {
        font-size: 20px;
    }
}
</style>`;
  }

  /**
   * HTMLを最小化
   */
  private minifyHtml(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();
  }

  /**
   * HTMLファイルとしてダウンロード
   */
  downloadHtml(content: EditorContent, filename: string = 'document.html'): void {
    const html = this.exportToHtml(content, { selfContained: true, includeStyles: true });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * クリップボードにコピー
   */
  copyToClipboard(content: EditorContent): Promise<void> {
    const html = this.exportToHtml(content, { selfContained: false, includeStyles: false });
    return navigator.clipboard.writeText(html);
  }

  /**
   * 表をHTMLにエクスポート
   */
  private exportTableToHtml(tableData: TableData): string {
    const { rows, headers, styles } = tableData;
    
    if (!rows || rows.length === 0) {
      return '';
    }
    
    // デフォルトスタイルを設定
    const defaultStyles = {
      borderColor: '#000000',
      backgroundColor: '#ffffff',
      headerBackgroundColor: '#f0f0f0',
      alignment: 'left' as const,
      cellPadding: 8,
    };
    
    const finalStyles = styles || defaultStyles;
    
    const tableStyle = `
      border-collapse: collapse;
      width: 100%;
      border: 1px solid ${finalStyles.borderColor};
      background-color: ${finalStyles.backgroundColor};
      margin: 20px 0;
    `;
    
    const cellStyle = `
      border: 1px solid ${finalStyles.borderColor};
      padding: ${finalStyles.cellPadding}px;
      text-align: ${finalStyles.alignment};
    `;
    
    const headerStyle = `
      ${cellStyle}
      background-color: ${finalStyles.headerBackgroundColor};
      font-weight: bold;
    `;
    
    let html = `<table style="${tableStyle}">`;
    
    // ヘッダー行
    if (headers && headers.some(header => header.trim() !== '')) {
      html += '<thead><tr>';
      headers.forEach(header => {
        html += `<th style="${headerStyle}">${this.escapeHtml(header)}</th>`;
      });
      html += '</tr></thead>';
    }
    
    // データ行
    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td style="${cellStyle}">${this.escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
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