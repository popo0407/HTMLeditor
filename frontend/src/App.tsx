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
      // WordライクエディタにHTMLをインポート
      console.log('Importing text to Word editor:', importText);
      setEditorContent(prev => ({
        ...prev,
        content: importText,
      }));
      setImportText(''); // 読み込み後クリア
    } catch (error) {
      console.error('テキストのインポートに失敗しました:', error);
      alert('テキストのインポートに失敗しました。');
    }
  };

  const handleImportFromText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
    } catch (error) {
      console.error('クリップボードからの読み込みに失敗しました:', error);
      alert('クリップボードからの読み込みに失敗しました。');
    }
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
              placeholder="ここにHTMLやテキストを貼り付けてください"
              rows={3}
              style={{ width: '350px', resize: 'vertical', marginRight: '8px' }}
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
