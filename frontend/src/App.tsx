/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */
/* eslint-disable no-script-url */

import React, { useState, useEffect } from 'react';
import './App.css';
import { TinyMCEEditor } from './tinymceEditor/components/TinyMCEEditor';
import { sendPdfMail, PdfMailSendRequest } from './services/apiService';
import { HtmlExportService } from './tinymceEditor/services/htmlExportService';

function App() {
  // emailTemplates removed: backend provides fixed recipient via settings
  const [importText, setImportText] = useState('');
  const [meetingInfo, setMeetingInfo] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'minutes' | 'info'>('minutes');
  const [editorContent, setEditorContent] = useState<string>('');
  // タブの高さ（px）
  const TAB_HEIGHT = 40;
  const [editorHeight, setEditorHeight] = useState<number>(window.innerHeight);
  const [currentStep, setCurrentStep] = useState<'url-input' | 'editor' | 'output' | 'bookmarklet-install'>('url-input');
  const [teamsUrl, setTeamsUrl] = useState('');

  // HtmlExportServiceは直接使用するため、useRefは不要

  // No client-side template loading. Backend uses DEFAULT_RECIPIENT_EMAIL from .env.

  // ファイル名をサニタイズする関数
  const sanitizeFilename = (filename: string): string => {
    if (!filename) {
      return '議事録';
    }
    
    // Windows/Linux/macOSで禁止されている文字を置き換え
    const forbiddenChars = /[<>:"/\\|?*]/g;
    let sanitized = filename.replace(forbiddenChars, '_');
    
    // 制御文字を削除
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1f]/g, '_');
    
    // 先頭・末尾のドット、スペースを削除
    sanitized = sanitized.replace(/^[. ]+|[. ]+$/g, '');
    
    // 空文字列の場合はデフォルト名を返す
    if (!sanitized) {
      return '議事録';
    }
    
    // 長すぎる場合は切り詰め（拡張子分を考慮して200文字以内）
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }
    
    return sanitized;
  };

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      if (meetingInfo) {
        setEditorHeight(window.innerHeight - TAB_HEIGHT-50);
      } else {
        setEditorHeight(window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    // meetingInfoの変化でも高さを再計算
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [meetingInfo]);

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

  // XML/JSON解析を補助するヘルパー関数群
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const escapeJsonString = (text: string): string => {
    // JSON文字列内の制御文字を適切にエスケープ
    return text
      .replace(/\\/g, '\\\\')  // バックスラッシュをエスケープ
      .replace(/"/g, '\\"')    // ダブルクォートをエスケープ（ただし、既にエスケープされていない場合のみ）
      .replace(/\n/g, '\\n')   // 改行をエスケープ
      .replace(/\r/g, '\\r')   // キャリッジリターンをエスケープ
      .replace(/\t/g, '\\t');  // タブをエスケープ
  };

  const parseXmlData = (text: string): any => {
    // XML形式のデータを解析
    const result: any = {};
    
    // 各フィールドをXMLタグから抽出
    const fields = [
      '会議タイトル', '参加者', '会議日時', '会議場所', 
      '部門', '大分類', '中分類', '小分類', '要約', '議事録'
    ];
    
    fields.forEach(field => {
      const regex = new RegExp(`<${field}>(.*?)</${field}>`, 's');
      const match = text.match(regex);
      
      if (match) {
        let value = match[1].trim();
        
        // 参加者フィールドは配列として処理
        if (field === '参加者') {
          // XML内で配列が文字列として格納されている場合の処理
          try {
            // JSON配列形式の場合
            if (value.startsWith('[') && value.endsWith(']')) {
              result[field] = JSON.parse(value);
            } else {
              // カンマ区切りの場合
              result[field] = value.split(',').map(item => item.trim()).filter(item => item);
            }
          } catch (e) {
            // パースできない場合は文字列のまま
            result[field] = value;
          }
        } else {
          result[field] = value;
        }
      }
    });

    // 議事録フィールドが存在する場合のみ有効なデータとして扱う
    if (result['議事録']) {
      return result;
    }
    
    throw new Error('有効なXML構造が見つかりません');
  };

  const parseFlexibleJson = (text: string): any => {
    // より寛容なJSON解析：正規表現を使って主要フィールドを抽出
    const result: any = {};
    
    // 議事録フィールドを抽出（HTMLタグが含まれていても対応）
    // dotallフラグの代わりに[\s\S]を使用
    const minutesMatch = text.match(/"議事録"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/) ||
                        text.match(/'議事録'\s*:\s*'((?:[^'\\]|\\[\s\S])*)'/) ||
                        text.match(/"議事録"\s*:\s*`((?:[^`\\]|\\[\s\S])*)`/);
    
    if (minutesMatch) {
      result['議事録'] = minutesMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }

    // その他の主要フィールドを抽出
    const fields = ['会議タイトル', '会議日時', '会議場所', '参加者', '要約', '部門', '大分類', '中分類', '小分類'];
    
    fields.forEach(field => {
      const fieldMatch = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)"`, 'g')) ||
                         text.match(new RegExp(`'${field}'\\s*:\\s*'((?:[^'\\\\]|\\\\[\\s\\S])*)'`, 'g'));
      
      if (fieldMatch && fieldMatch[0]) {
        // マッチした結果から値部分を抽出
        const valueMatch = fieldMatch[0].match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)"`, '')) ||
                          fieldMatch[0].match(new RegExp(`'${field}'\\s*:\\s*'((?:[^'\\\\]|\\\\[\\s\\S])*)'`, ''));
        if (valueMatch) {
          result[field] = valueMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
      }
    });

    // 議事録フィールドが存在する場合のみ有効なJSONとして扱う
    if (result['議事録']) {
      return result;
    }
    
    throw new Error('有効なJSON構造が見つかりません');
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
      // まず、貼り付けがXMLかJSONかを判定
      const trimmed = importText.trim();
      let parsedData: any = null;
      
      // XML形式かどうかをチェック
      if (trimmed.includes('<会議タイトル>') || trimmed.includes('<議事録>')) {
        try {
          // XML形式として解析
          parsedData = parseXmlData(trimmed);
        } catch (e) {
          console.error('XML解析エラー:', e);
          parsedData = null;
        }
      } else {
        // JSON解析の前処理と複数の解析方法を試行
        try {
          // 方法1: 通常のJSON.parse
          parsedData = JSON.parse(trimmed);
        } catch (e) {
          try {
            // 方法2: HTMLエンティティをデコードしてからJSON.parse
            const decodedText = decodeHtmlEntities(trimmed);
            parsedData = JSON.parse(decodedText);
          } catch (e2) {
            try {
              // 方法3: JSON文字列内の改行とHTMLタグを適切にエスケープ
              const escapedText = escapeJsonString(trimmed);
              parsedData = JSON.parse(escapedText);
            } catch (e3) {
              try {
                // 方法4: より寛容な解析（正規表現を使って構造を抽出）
                parsedData = parseFlexibleJson(trimmed);
              } catch (e4) {
                parsedData = null;
              }
            }
          }
        }
      }

      if (parsedData && (parsedData.議事録 || parsedData['議事録'])) {
        // XML/JSON形式とみなし、会議情報と議事録をセット
        const info = {
          会議タイトル: parsedData['会議タイトル'] || parsedData['title'] || '',
          参加者: parsedData['参加者'] || parsedData['participants'] || [],
          会議日時: parsedData['会議日時'] || parsedData['datetime'] || '',
          会議場所: parsedData['会議場所'] || parsedData['会議場所'] || '',
          要約: parsedData['要約'] || parsedData['summary'] || '',
          // 以下は読み取り専用で表示する分類情報
          部門: parsedData['部門'] || parsedData['department'] || '',
          大分類: parsedData['大分類'] || parsedData['category1'] || '',
          中分類: parsedData['中分類'] || parsedData['category2'] || '',
          小分類: parsedData['小分類'] || parsedData['category3'] || '',
        };

        const minutesHtml = parsedData['議事録'] || '';

        setMeetingInfo(info);
        setEditorContent(minutesHtml);
        setActiveTab('info');
        setImportText('');
        setCurrentStep('editor');
      } else {
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
      }
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      alert('データのインポートに失敗しました。XML/JSON形式またはHTML形式で入力してください。');
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
      let contentToExport = editorContent;
      if (meetingInfo) {
        contentToExport = HtmlExportService.buildCombinedFragment(meetingInfo, editorContent);
      }

      // ファイル名を会議タイトルに基づいて生成
      const meetingTitle = meetingInfo?.会議タイトル || meetingInfo?.title || '議事録';
      const filename = sanitizeFilename(meetingTitle);

      HtmlExportService.downloadHtml(
        contentToExport,
        `${filename}.html`,
        'エクスポートされたドキュメント'
      );
    } catch (error) {
      console.error('HTMLダウンロードに失敗しました:', error);
      alert('HTMLダウンロードに失敗しました。');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      // meetingInfo + minutesHtml をそのままバックエンドに送りテンプレート統一
      const API_BASE_URL = process.env.REACT_APP_API_URL;
      const payload = {
        meetingInfo: meetingInfo || null,
        minutesHtml: editorContent || '',
        filename: 'document',
        title: 'エクスポートされたドキュメント'
      };
      const resp = await fetch(`${API_BASE_URL}/pdf/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `status ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 会議タイトルからファイル名を生成
      const meetingTitle = meetingInfo?.title || meetingInfo?.['会議タイトル'] || '議事録';
      const safeFilename = sanitizeFilename(meetingTitle);
      a.download = `${safeFilename}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('PDFファイルをダウンロードしました。');
    } catch (error) {
      console.error('PDFファイルのダウンロードに失敗しました:', error);
      alert('PDFファイルのダウンロードに失敗しました。');
    }
  };

  // HTML添付送信はフロントで廃止。PDF送信はJSONを送るフローとする。

  const handleSendPdfMail = async () => {
    try {
      // フロントは構造化データ（meetingInfo + editorContent）をサーバに渡す
      const pdfMailRequest: PdfMailSendRequest = {
        subject: '議事録',
        recipient_email: '',
        meetingInfo: meetingInfo || {},
        minutesHtml: editorContent || '',
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
    // JSON会議情報がある場合はタブ編集中の切替を行わず、タブUIを保持する
    if (!meetingInfo && content.trim() && currentStep === 'editor') {
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
return{newCount,skipCount};};c.scrollTop=0;await wait(1000);let res=addEntries(c.querySelectorAll('div[class*="rightColumn-"]'));console.log(\`初回: 新規 \${res.newCount} 件, 重複スキップ \${res.skipCount} 件\`);const totalHeight=c.scrollHeight;const viewHeight=c.clientHeight;const scrollStep=viewHeight*1.5;let currentScroll=0,loop=0;while(currentScroll<totalHeight&&loop<100){loop++;currentScroll+=scrollStep;c.scrollTop=currentScroll;await wait(300);if(Math.abs(c.scrollTop-currentScroll)>100){console.log(\`位置修正: 目標 \${currentScroll} → 実際 \${c.scrollTop}\`);c.scrollTop=currentScroll;await wait(300);}
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
              取得したHTMLまたはXML/JSONデータをここに貼り付けてください。
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="XML/JSONデータまたはHTMLを貼り付けてください&#10;&#10;XML形式例:&#10;<会議タイトル>会議名</会議タイトル>&#10;<参加者>['田中太郎','佐藤花子']</参加者>&#10;<議事録>HTMLコンテンツ</議事録>"
              rows={6}
              className="sidebar-textarea"
            />
            <button onClick={handleImportFromTextBox} className="sidebar-button">
              議事録を読み込み
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
            <button onClick={handleSendPdfMail} className="sidebar-button">
              PDF添付
            </button>
          </div>
        </div>
      </aside>
      
      <main className="editor-container">
        {meetingInfo ? (
          <div className="tabbed-editor">
            <div className="tabs" style={{height: TAB_HEIGHT}}>
              <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>会議情報</button>
              <button className={activeTab === 'minutes' ? 'active' : ''} onClick={() => setActiveTab('minutes')}>議事録</button>
            </div>
            <div className="tab-body">
              {activeTab === 'info' ? (
                <div className="meeting-info-editor">
                  <label>会議タイトル</label>
                  <input type="text" value={meetingInfo.会議タイトル || ''} onChange={e => setMeetingInfo({...meetingInfo, 会議タイトル: e.target.value})} />
                  <label>会議日時</label>
                  <input type="text" value={meetingInfo.会議日時 || ''} onChange={e => setMeetingInfo({...meetingInfo, 会議日時: e.target.value})} />
                  <label>会議場所</label>
                  <input type="text" value={meetingInfo.会議場所 || ''} onChange={e => setMeetingInfo({...meetingInfo, 会議場所: e.target.value})} />
                  <label>参加者</label>
                  <textarea rows={4} value={Array.isArray(meetingInfo.参加者) ? meetingInfo.参加者.join('\n') : meetingInfo.参加者 || ''} onChange={e => setMeetingInfo({...meetingInfo, 参加者: e.target.value})} />
                  <label>要約</label>
                  <textarea rows={6} value={meetingInfo.要約 || ''} onChange={e => setMeetingInfo({...meetingInfo, 要約: e.target.value})} />
                  {/* 表示はするが編集不可の分類フィールド */}
                  <label>部門(編集不可)</label>
                  <input type="text" value={meetingInfo.部門 || ''} readOnly />
                  <label>大分類(編集不可)</label>
                  <input type="text" value={meetingInfo.大分類 || ''} readOnly />
                  <label>中分類(編集不可)</label>
                  <input type="text" value={meetingInfo.中分類 || ''} readOnly />
                  <label>小分類(編集不可)</label>
                  <input type="text" value={meetingInfo.小分類 || ''} readOnly />
                </div>
              ) : (
                <div className="minutes-editor-wrapper">
                  <TinyMCEEditor
                    value={editorContent}
                    onContentChange={setEditorContent}
                    height={editorHeight}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <TinyMCEEditor
            value={editorContent}
            onContentChange={setEditorContent}
            height={editorHeight}
          />
        )}
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
