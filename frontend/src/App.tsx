/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { WordLikeEditor } from './wordEditor/components/WordLikeEditor';
import { getEmailTemplates, sendMail, MailSendRequest } from './services/apiService';
import { HtmlExportService } from './wordEditor/services/htmlExportService';
import { EditorContent } from './wordEditor/types/wordEditorTypes';

interface EmailTemplates {
  default_recipient: string;
  subject_templates: string[];
  default_subject: string;
  body_templates: string[];
}

function App() {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedBodyTemplate, setSelectedBodyTemplate] = useState<string>('');
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [importText, setImportText] = useState('');
  const [editorContent, setEditorContent] = useState<EditorContent>({
    content: '',
    formats: {
      heading: 'p',
      emphasis: 'normal',
      inline: { bold: false, underline: false },
      paragraph: { indent: 0 },
      table: {
        rows: 0,
        cols: 0,
        hasHeaderRow: false,
        hasHeaderCol: false,
        cellMerges: [],
        styles: {
          borderColor: '#000000',
          backgroundColor: '#ffffff',
          headerBackgroundColor: '#f0f0f0',
          alignment: 'left',
          cellPadding: 8,
        },
      },
    },
  });

  const htmlExportService = useRef(new HtmlExportService());

  // メールテンプレートの読み込み
  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
      if (templates.subject_templates.length > 0) {
        setSelectedSubject(templates.subject_templates[0]);
      }
      if (templates.body_templates.length > 0) {
        setSelectedBodyTemplate(templates.body_templates[0]);
      }
      setCustomRecipient(templates.default_recipient || '');
    } catch (error) {
      console.error('メールテンプレートの読み込みに失敗しました:', error);
    }
  };

  const handleImportFromTextBox = async () => {
    if (!importText.trim()) {
      alert('インポートするテキストを入力してください。');
      return;
    }

    try {
      // HTMLまたはマークダウンテキストを処理
      console.log('Importing text to Word editor:', importText);
      
      // マークダウンの場合はHTMLに変換
      let processedContent = importText;
      if (importText.includes('#') || importText.includes('|')) {
        processedContent = convertMarkdownToHtml(importText);
      }
      
      // HTMLをクリーンアップして安全な形式に変換
      processedContent = sanitizeHtml(processedContent);
      
      setEditorContent(prev => ({
        ...prev,
        content: processedContent,
      }));
      setImportText(''); // 読み込み後クリア
    } catch (error) {
      console.error('テキストのインポートに失敗しました:', error);
      alert('テキストのインポートに失敗しました。');
    }
  };

  // マークダウンをHTMLに変換する関数
  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // 見出しの変換
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 太字の変換
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // 斜体の変換
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // リストの変換
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');
    
    // 段落の変換（空行で区切られたテキストを段落に）
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/^(?!<[h|li|ul|ol|table])(.*$)/gim, '<p>$1</p>');
    
    // 基本的な表の変換（簡易版）
    const tableRegex = /\|(.+)\|/g;
    if (tableRegex.test(html)) {
      html = html.replace(/\|(.+)\|/g, (match: string, content: string) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`;
      });
      html = html.replace(/(<tr>.*<\/tr>)/gs, '<table border="1">$1</table>');
    }
    
    return html;
  };

  // HTMLをクリーンアップする関数
  const sanitizeHtml = (html: string): string => {
    // 許可するタグのみを残す
    const allowedTags = [
      'h1', 'h2', 'h3',
      'p', 'div',
      'strong', 'b', 'em', 'i', 'u',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ];
    
    // 基本的なXSS対策
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    html = html.replace(/javascript:/gi, '');
    html = html.replace(/on\w+\s*=/gi, '');
    
    // 許可されていないタグを削除（許可されているタグは残す）
    const allowedTagsSet = new Set(allowedTags);
    
    // 開始タグと終了タグの両方を処理
    html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();
      if (allowedTagsSet.has(lowerTagName)) {
        return match; // 許可されているタグはそのまま残す
      }
      return ''; // 許可されていないタグは削除
    });
    
    return html;
  };

  const handleDownloadHtml = async () => {
    try {
      // WordライクエディタからHTMLを取得してダウンロード
      console.log('Downloading HTML from Word editor');
      const filename = prompt('ファイル名を入力してください:', 'document.html') || 'document.html';
      htmlExportService.current.downloadHtml(editorContent, filename);
    } catch (error) {
      console.error('HTMLのダウンロードに失敗しました:', error);
      alert('HTMLのダウンロードに失敗しました。');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      // WordライクエディタからHTMLを取得してクリップボードにコピー
      console.log('Copying HTML to clipboard from Word editor');
      await htmlExportService.current.copyToClipboard(editorContent);
      alert('HTMLがクリップボードにコピーされました。');
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      alert('クリップボードへのコピーに失敗しました。');
    }
  };

  const handleSendMail = async () => {
    if (!emailTemplates) {
      alert('メールテンプレートが読み込まれていません。');
      return;
    }

    if (!customRecipient.trim()) {
      alert('宛先を入力してください。');
      return;
    }

    try {
      const mailRequest: MailSendRequest = {
        recipient_email: customRecipient,
        subject: selectedSubject,
        html_content: selectedBodyTemplate,
      };

      await sendMail(mailRequest);
      alert('メールが正常に送信されました。');
    } catch (error) {
      console.error('メール送信に失敗しました:', error);
      alert('メール送信に失敗しました。');
    }
  };

  const handleContentChange = (content: string) => {
    console.log('Word editor content changed:', content);
    setEditorContent(prev => ({
      ...prev,
      html: content,
      text: content.replace(/<[^>]*>/g, ''),
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>HTMLエディタ</h1>
          <div className="header-import-box">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="ここにHTMLやマークダウンテキストを貼り付けてください"
              rows={4}
              style={{ width: '400px', resize: 'vertical', marginRight: '8px' }}
            />
            <button onClick={handleImportFromTextBox} className="header-button">
              読み込み
            </button>
          </div>
          <div className="header-buttons">
            <button onClick={handleDownloadHtml} className="header-button">
              HTMLダウンロード
            </button>
            <button onClick={handleCopyToClipboard} className="header-button">
              クリップボードにコピー
            </button>
            <button onClick={handleSendMail} className="header-button">
              メール送信
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          {/* Wordライクエディタのみ */}
            <WordLikeEditor
              initialContent={editorContent.content}
              onContentChange={handleContentChange}
              onSave={() => {
                console.log('Word editor save');
              }}
              onTableInsert={() => {
                console.log('Word editor table insert');
              }}
              onHtmlImport={(html) => {
                console.log('Word editor HTML import:', html);
              }}
            />
        </div>
      </main>

      {/* メール送信設定 */}
      {emailTemplates && (
        <div className="email-settings">
          <div className="email-setting-item">
            <label>宛先:</label>
            <input
              type="email"
              value={customRecipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              placeholder={emailTemplates.default_recipient || 'メールアドレスを入力'}
            />
          </div>
          <div className="email-setting-item">
            <label>件名:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {emailTemplates.subject_templates.map((template, index) => (
                <option key={index} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
          <div className="email-setting-item">
            <label>本文冒頭:</label>
            <select
              value={selectedBodyTemplate}
              onChange={(e) => setSelectedBodyTemplate(e.target.value)}
            >
              {emailTemplates.body_templates.map((template, index) => (
                <option key={index} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
