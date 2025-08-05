/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import { TinyMCEEditor } from './tinymceEditor/components/TinyMCEEditor';
import { getEmailTemplates, sendMail, MailSendRequest } from './services/apiService';
import { HtmlExportService } from './tinymceEditor/services/htmlExportService';
import { WordExportService } from './services/wordExportService';

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
  const [editorContent, setEditorContent] = useState<string>('');

  // HtmlExportServiceは直接使用するため、useRefは不要

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
      console.log('Importing text to TinyMCE editor:', importText);
      
      // マークダウンの場合はHTMLに変換
      let processedContent = importText;
      if (importText.includes('#') || importText.includes('|')) {
        processedContent = convertMarkdownToHtml(importText);
      }
      
      // HTMLをクリーンアップして安全な形式に変換
      processedContent = sanitizeHtml(processedContent);
      
      setEditorContent(processedContent);
      setImportText(''); // 読み込み後クリア
    } catch (error) {
      console.error('テキストのインポートに失敗しました:', error);
      alert('テキストのインポートに失敗しました。');
    }
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // 見出しの変換
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 太字と斜体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // リスト
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // リストの整形
    html = html.replace(/<li>.*?<\/li>/g, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    return html;
  };

  const sanitizeHtml = (html: string): string => {
    // 基本的なHTMLサニタイズ
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const handleDownloadHtml = async () => {
    try {
      HtmlExportService.downloadHtml(
        editorContent,
        'document.html',
        'エクスポートされたドキュメント'
      );
    } catch (error) {
      console.error('HTMLダウンロードに失敗しました:', error);
      alert('HTMLダウンロードに失敗しました。');
    }
  };

  const handleDownloadWord = async () => {
    try {
      await WordExportService.downloadWord(
        editorContent,
        'document',
        'エクスポートされたドキュメント'
      );
      alert('Wordファイルをダウンロードしました。');
    } catch (error) {
      console.error('Wordファイルのダウンロードに失敗しました:', error);
      alert('Wordファイルのダウンロードに失敗しました。');
    }
  };

  const handleSendMail = async () => {
    if (!customRecipient.trim()) {
      alert('宛先を入力してください。');
      return;
    }

    try {
      const mailRequest: MailSendRequest = {
        to: customRecipient,
        subject: selectedSubject,
        html_content: selectedBodyTemplate + '\n\n' + editorContent,
        body: selectedBodyTemplate + '\n\n' + editorContent,
        text: editorContent.replace(/<[^>]*>/g, ''),
      };

      await sendMail(mailRequest);
      alert('メールを送信しました。');
    } catch (error) {
      console.error('メール送信に失敗しました:', error);
      alert('メール送信に失敗しました。');
    }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>HTMLエディタ (TinyMCE版)</h1>
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
            <button onClick={handleDownloadWord} className="header-button">
              Wordダウンロード
            </button>
            <button onClick={handleSendMail} className="header-button">
              メール送信
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          {/* TinyMCEエディタ */}
          <TinyMCEEditor
            value={editorContent}
            onContentChange={handleContentChange}
            onSave={() => {
              console.log('TinyMCE editor save');
            }}
            height={600}
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
