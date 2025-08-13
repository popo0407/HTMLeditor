/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import { TinyMCEEditor } from './tinymceEditor/components/TinyMCEEditor';
import { getEmailTemplates, sendMail, sendPdfMail, MailSendRequest, PdfMailSendRequest } from './services/apiService';
import { HtmlExportService } from './tinymceEditor/services/htmlExportService';
import { PdfExportService } from './services/pdfExportService';
import ScrapingPage from './features/scraping/ScrapingPage';

interface EmailTemplates {
  default_recipient: string;
  subject_templates: string[];
  default_subject: string;
  body_templates: string[];
}

function App() {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates | null>(null);
  const [importText, setImportText] = useState('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(window.innerHeight);
  const [currentView, setCurrentView] = useState<'editor' | 'scraping'>('editor');

  // HtmlExportServiceは直接使用するため、useRefは不要

  // メールテンプレートの読み込み
  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
    } catch (error) {
      console.error('メールテンプレートの読み込みに失敗しました:', error);
    }
  };

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      setEditorHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // 表のスタイルを強制的に黒色に変更
    sanitized = sanitized
      .replace(/border:\s*[^;]+/gi, 'border: 1px solid #000')
      .replace(/border-color:\s*[^;]+/gi, 'border-color: #000')
      .replace(/<table([^>]*)>/gi, '<table$1 style="border-collapse: collapse; width: 100%; margin: 16px 0;">')
      .replace(/<td([^>]*)>/gi, '<td$1 style="border: 1px solid #000; padding: 8px;">')
      .replace(/<th([^>]*)>/gi, '<th$1 style="border: 1px solid #000; padding: 8px; background-color: #f8f9fa; font-weight: bold;">');
    
    return sanitized;
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

  const handleDownloadPdf = async () => {
    try {
      await PdfExportService.downloadPdf(
        editorContent,
        'document',
        'エクスポートされたドキュメント'
      );
      alert('PDFファイルをダウンロードしました。');
    } catch (error) {
      console.error('PDFファイルのダウンロードに失敗しました:', error);
      alert('PDFファイルのダウンロードに失敗しました。');
    }
  };

  const handleSendHtmlMail = async () => {
    try {
      const mailRequest: MailSendRequest = {
        recipient_email: emailTemplates?.default_recipient || '',
        html_content: editorContent,
      };

      await sendMail(mailRequest);
      alert('HTML添付メールを送信しました。');
    } catch (error) {
      console.error('HTMLメール送信に失敗しました:', error);
      alert('HTMLメール送信に失敗しました。');
    }
  };

  const handleSendPdfMail = async () => {
    try {
      const pdfMailRequest: PdfMailSendRequest = {
        recipient_email: emailTemplates?.default_recipient || '',
        html_content: editorContent,
      };

      await sendPdfMail(pdfMailRequest);
      alert('PDF添付メールを送信しました。');
    } catch (error) {
      console.error('PDFメール送信に失敗しました:', error);
      alert('PDFメール送信に失敗しました。');
    }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
  };

  return (
    <div className="app">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>HTMLエディタ</h1>
          </div>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>機能選択</h3>
              <button 
                onClick={() => setCurrentView('editor')} 
                className={`sidebar-button ${currentView === 'editor' ? 'active' : ''}`}
              >
                HTMLエディタ
              </button>
              <button 
                onClick={() => setCurrentView('scraping')} 
                className={`sidebar-button ${currentView === 'scraping' ? 'active' : ''}`}
              >
                テキスト読み込み
              </button>
            </div>
            
            {currentView === 'editor' && (
              <div className="sidebar-section">
                <h3>テキスト読み込み</h3>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="HTMLやマークダウンテキストを貼り付けてください"
                  rows={4}
                  className="sidebar-textarea"
                />
                <button onClick={handleImportFromTextBox} className="sidebar-button">
                  読み込み
                </button>
              </div>
            )}
            
            {currentView === 'editor' && (
              <>
                <div className="sidebar-section">
                  <h3>ダウンロード</h3>
                  <button onClick={handleDownloadHtml} className="sidebar-button">
                    HTML
                  </button>
                  <button onClick={handleDownloadPdf} className="sidebar-button">
                    PDF
                  </button>
                </div>
                
                <div className="sidebar-section">
                  <h3>メール送信</h3>
                  <button onClick={handleSendHtmlMail} className="sidebar-button">
                    HTML
                  </button>
                  <button onClick={handleSendPdfMail} className="sidebar-button">
                    PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
        
        <main className="editor-container">
          {currentView === 'editor' ? (
            <TinyMCEEditor
              value={editorContent}
              onContentChange={handleContentChange}
              onSave={() => {
                console.log('TinyMCE editor save');
              }}
              height={editorHeight}
            />
          ) : (
            <ScrapingPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
