/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */
/* eslint-disable no-script-url */

import React, { useState, useEffect } from 'react';
import './App.css';
import { TinyMCEEditor } from './tinymceEditor/components/TinyMCEEditor';
import { sendMail, sendPdfMail, MailSendRequest, PdfMailSendRequest } from './services/apiService';
import { HtmlExportService } from './tinymceEditor/services/htmlExportService';
import { PdfExportService } from './services/pdfExportService';

function App() {
  // emailTemplates removed: backend provides fixed recipient via settings
  const [importText, setImportText] = useState('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(window.innerHeight);
  const [currentStep, setCurrentStep] = useState<'url-input' | 'editor' | 'output' | 'bookmarklet-install'>('url-input');
  const [teamsUrl, setTeamsUrl] = useState('');

  // HtmlExportServiceは直接使用するため、useRefは不要

  // No client-side template loading. Backend uses DEFAULT_RECIPIENT_EMAIL from .env.

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      setEditorHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // TeamsのURLを編集してチャットページに変換する
  const convertTeamsUrl = (originalUrl: string): string => {
    try {
      // meetup-joinのURLからmeeting IDを抽出
      const meetingMatch = originalUrl.match(/19%3ameeting_([^%]+)%40thread\.v2/);
      if (!meetingMatch) {
        throw new Error('有効なTeams会議URLではありません');
      }
      
      const meetingId = meetingMatch[1];
      
      // 新しいチャットURLを構築
      const newUrl = `https://teams.microsoft.com/l/message/19:meeting_${meetingId}@thread.v2?context=%7B%22contextType%22%3A%22chat%22%7D`;
      
      return newUrl;
    } catch (error) {
      console.error('URL変換エラー:', error);
      throw error;
    }
  };

  const handleOpenTeamsChat = () => {
    if (!teamsUrl.trim()) {
      alert('Teams会議のURLを入力してください。');
      return;
    }

    try {
      const convertedUrl = convertTeamsUrl(teamsUrl);
      window.open(convertedUrl, '_blank');
      setCurrentStep('editor');
    } catch (error) {
      alert('URLの変換に失敗しました。正しいTeams会議URLを入力してください。');
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
      setCurrentStep('output'); // HTMLが読み込まれたら出力ステップに移行
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
  // recipient_email is optional; backend will use DEFAULT_RECIPIENT_EMAIL when empty
  recipient_email: '',
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
  // recipient_email is optional; backend will use DEFAULT_RECIPIENT_EMAIL when empty
  recipient_email: '',
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
    // エディターでコンテンツが変更されたら出力ステップに移行
    if (content.trim() && currentStep === 'editor') {
      setCurrentStep('output');
    }
  };

  // URL入力画面
  const renderUrlInputStep = () => (
    <div className="url-input-container">
      <div className="url-input-content">
        <h2>議事録編集ツール</h2>
        
          <p>
            ブックマークレットの登録がまだの方→
            <button 
              onClick={() => setCurrentStep('bookmarklet-install')} 
              className="text-button"
            >
              ブックマークレットの登録
            </button>
          </p>
        
        <div className="url-input-section">
          <h3>1. Teams会議URLを入力</h3>
          <p>新しいタブで開いたTeamsで「代わりにWebアプリを実行」を選択すると、Teamsチャットページが開きます。</p>
          <input
            type="url"
            value={teamsUrl}
            onChange={e => setTeamsUrl(e.target.value)}
            placeholder="https://teams.microsoft.com/l/meetup-join/..."
            className="url-input"
          />
          <button onClick={handleOpenTeamsChat} className="url-button">
            チャットページを開く
          </button>
        </div>
        
        <div className="url-input-section">
          <h3>2. Teamsチャットページでの操作</h3>
          <p><strong>「会議情報取得」ブックマークレット</strong>を実行して、会議情報を取得してください。</p>
          <p>クリップボードに会議情報が自動でコピーされて、議事録生成用のGenAIが新しいタブで開きます。</p>
        </div>
        <div className="url-input-section">
          <h3>3. GenAI ページでの操作</h3>
          <p><strong>文字起こし入力部</strong>にクリップボードの内容を貼り付けて、議事録の形式を選択して実行してください。</p>
          <p>文字起こしされた内容をコピーしてこのサイトに戻ってきてください。</p>
        </div>
          <button 
            onClick={() => setCurrentStep('editor')} 
            className="back-button"
          >
            エディタに移動する →
          </button>
      </div>
    </div>
  );

  // ▼▼▼ ここから追加 (新しい画面用の関数) ▼▼▼
  // ブックマークレット登録ページ
  const renderBookmarkletInstallStep = () => {
    // ▼▼▼ ブックマークレットのコードを定数として分離 ▼▼▼
    const bookmarkletCode = `javascript:(function(){const wait=(ms)=>new Promise(res=>setTimeout(res,ms));(async()=>{try{let detailBtn=document.querySelector('button[data-tid="chat-meeting-details"]');if(detailBtn){detailBtn.click();}
await wait(5000);let titleEl=document.querySelector('span[data-tid="calv2-sf-meeting-subject-view"]');let title=titleEl?.innerText||null;let participants=[...document.querySelectorAll('div.ms-TooltipHost')].map(el=>el.innerText);let summaryBtn=document.querySelector('div[data-tid="data-tid-まとめ"]');if(summaryBtn){summaryBtn.click();}
await wait(5000);let datetime=[...document.querySelectorAll('span.fui-StyledText')].map(el=>el.innerText).filter(t=>/\\d/.test(t));let transcriptBtn=document.querySelector('button[data-tid="Transcript"]');if(transcriptBtn){transcriptBtn.click();}
await wait(5000);const c=document.querySelector('[data-is-scrollable="true"]');let transcript='';if(c){let entries=[];let processedContent=new Set();const addEntries=(elements)=>{let newCount=0,skipCount=0;for(const e of elements){let s='（システム）',t='',msg='';const a=e.getAttribute('aria-label')||'';const m=a.match(/^(.+?)\\s+\\d/);if(m){s=m[1].trim();}else{const n=e.closest('[class*="rightColumn-"]')?.querySelector('[class*="itemDisplayName-"]');if(n)s=n.textContent.trim();}
const tsEl=e.closest('[class*="rightColumn-"]')?.querySelector('[id^="Header-timestamp-"]');if(tsEl)t=tsEl.textContent.trim();const msgEl=e.querySelector('[id^="sub-entry-"]');if(msgEl){msg=Array.from(msgEl.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');}
if(!msg)continue;const uniqueKey=\`\${s}|\${t}|\${msg}\`;if(processedContent.has(uniqueKey)){skipCount++;continue;}
processedContent.add(uniqueKey);newCount++;entries.push({speaker:s,time:t,content:msg});}
return{newCount,skipCount};};c.scrollTop=0;await wait(1000);let res=addEntries(c.querySelectorAll('div[class*="rightColumn-"]'));console.log(\`初回: 新規 \${res.newCount} 件, 重複スキップ \${res.skipCount} 件\`);const totalHeight=c.scrollHeight;const viewHeight=c.clientHeight;const scrollStep=viewHeight*0.8;let currentScroll=0,loop=0;while(currentScroll<totalHeight&&loop<100){loop++;currentScroll+=scrollStep;c.scrollTop=currentScroll;await wait(300);if(Math.abs(c.scrollTop-currentScroll)>100){console.log(\`位置修正: 目標 \${currentScroll} → 実際 \${c.scrollTop}\`);c.scrollTop=currentScroll;await wait(300);}
res=addEntries(c.querySelectorAll('div[class*="rightColumn-"]'));console.log(\`スクロール \${loop}: 新規 \${res.newCount} 件, 重複スキップ \${res.skipCount} 件\`);if(currentScroll>=totalHeight-viewHeight)break;}
c.scrollTop=c.scrollHeight;await wait(2000);res=addEntries(c.querySelectorAll('div[class*="rightColumn-"]'));console.log(\`最終: 新規 \${res.newCount} 件, 重複スキップ \${res.skipCount} 件\`);entries.sort((a,b)=>{const timeA=a.time.split(':').reduce((acc,time)=>60*acc+parseInt(time,10),0);const timeB=b.time.split(':').reduce((acc,time)=>60*acc+parseInt(time,10),0);return timeA-timeB;});let lastSpeaker='';for(const entry of entries){if(entry.speaker==='（システム）'&&lastSpeaker){transcript+=\`\${entry.content}\\n\\n\`;}else{if(entry.speaker!=='（システム）'){lastSpeaker=entry.speaker;}
transcript+=\`\${entry.speaker}\${entry.time?' ['+entry.time+']':''}:\\n\${entry.content}\\n\\n\`;}}
}
let result={title,participants,datetime,transcript};if(!transcript){alert("❌ 会議情報を取得できませんでした");}else{try{const jsonString=JSON.stringify(result,null,2);await navigator.clipboard.writeText(jsonString);const lineCount=transcript.split('\\n').filter(l=>l.includes(':')).length;alert(\`✅ 完了！会議情報を取得し、クリップボードにコピーしました\`);window.open('https://d3r0xupf0a2onu.cloudfront.net/use-case-builder/execute/6fadf23d-6d52-4029-a3bb-73a3b9f09cb2','_blank');}catch(clipboardError){const lineCount=transcript.split('\\n').filter(l=>l.includes(':')).length;alert(\`❌ クリップボードコピー失敗\`);window.open('https://d3r0xupf0a2onu.cloudfront.net/use-case-builder/execute/6fadf23d-6d52-4029-a3bb-73a3b9f09cb2','_blank');}}
console.log("最終結果:",result);}catch(e){console.error("詳細エラー:",e);alert(\`❌ 取得失敗: \${e.message||'unknown error'}\`);}})().catch(e=>{console.error("❌ 外側Promiseエラー:",e);});})();`;

    return (
      <div className="url-input-container">
        <div className="url-input-content">
          <h2>ブックマークレットの登録</h2>
          <p>お使いのブラウザ（PC）のブックマークバーに、緑のボタンをドラッグ＆ドロップして登録してください。</p>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid, no-script-url */}
          {/* ▼▼▼ hrefに定数を渡すように修正 ▼▼▼ */}
          <a 
            href={bookmarkletCode}
            className="bookmarklet-link"
            onClick={(e) => e.preventDefault()} // 誤クリックで実行されないようにする
          >
            会議情報取得
          </a>
          <p>ブックマークバーが出ていない、わからない人は ctrl+shift+B を押してください。</p>
          <p>ブックマークバーが表示されます。</p>
          <button 
            onClick={() => setCurrentStep('url-input')} 
            className="back-button"
          >
            ← URL入力に戻る
          </button>
        </div>
      </div>
    );
  };
  // ▲▲▲ ここまで追加 ▲▲▲

  // エディター画面
  const renderEditorStep = () => (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>HTMLエディタ</h1>
          <button 
            onClick={() => setCurrentStep('url-input')} 
            className="back-button"
          >
            ← URL入力に戻る
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>議事録データ読み込み</h3>
            <p className="instruction-text">
              Teamsチャットページで「会議情報取得」ブックマークレットを実行し、
              取得したHTMLをここに貼り付けてください。
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="ブックマークレットで取得したHTMLを貼り付けてください"
              rows={6}
              className="sidebar-textarea"
            />
            <button onClick={handleImportFromTextBox} className="sidebar-button">
              議事録を読み込み
            </button>
          </div>
        </div>
      </aside>
      
      <main className="editor-container">
        <TinyMCEEditor
          value={editorContent}
          onContentChange={handleContentChange}
          onSave={() => {
            console.log('TinyMCE editor save');
          }}
          height={editorHeight}
        />
      </main>
    </div>
  );

  // 出力画面
  const renderOutputStep = () => (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>HTMLエディタ</h1>
          <button 
            onClick={() => setCurrentStep('editor')} 
            className="back-button"
          >
            ← 編集に戻る
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>議事録データ読み込み</h3>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="追加のHTMLやマークダウンテキストを貼り付けてください"
              rows={4}
              className="sidebar-textarea"
            />
            <button onClick={handleImportFromTextBox} className="sidebar-button">
              追加読み込み
            </button>
          </div>
          
          <div className="sidebar-section">
            <h3>ダウンロード</h3>
            <button onClick={handleDownloadHtml} className="sidebar-button">
              HTML形式
            </button>
            <button onClick={handleDownloadPdf} className="sidebar-button">
              PDF形式
            </button>
          </div>
          
          <div className="sidebar-section">
            <h3>メール送信</h3>
            <button onClick={handleSendHtmlMail} className="sidebar-button">
              HTML添付
            </button>
            <button onClick={handleSendPdfMail} className="sidebar-button">
              PDF添付
            </button>
          </div>
        </div>
      </aside>
      
      <main className="editor-container">
        <TinyMCEEditor
          value={editorContent}
          onContentChange={handleContentChange}
          onSave={() => {
            console.log('TinyMCE editor save');
          }}
          height={editorHeight}
        />
      </main>
    </div>
  );

  return (
    <div className="app">
      {currentStep === 'url-input' && renderUrlInputStep()}
      {currentStep === 'editor' && renderEditorStep()}
      {currentStep === 'output' && renderOutputStep()}
      {/* ▼▼▼ ここを追加 ▼▼▼ */}
      {currentStep === 'bookmarklet-install' && renderBookmarkletInstallStep()}
    </div>
  );
}

export default App;
