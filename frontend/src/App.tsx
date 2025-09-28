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
import { 
  Department, 
  DepartmentWithDetails, 
  JobType,
  getAllDepartments, 
  getDepartmentWithDetails, 
  getCorrectionsForClipboardWithIssuer,
  createDepartmentMember,
  getAllJobTypes
} from './services/departmentService';
import { DepartmentManagement } from './components/DepartmentManagement';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getBookmarkletCode, BOOKMARKLET_NAME } from './utils/bookmarklet';

function App() {
  const [importText, setImportText] = useState('');
  const [meetingInfo, setMeetingInfo] = useState<any>({
    会議タイトル: '',
    参加者: [],
    会議日時: '',
    会議場所: '',
    要約: '',
    講評: '',
    発行者: '', // 発行者フィールドを追加
    部門: '',
    大分類: '',
    中分類: '',
    小分類: ''
  });
  const [activeTab, setActiveTab] = useState<'minutes' | 'info'>('minutes');
  const [editorContent, setEditorContent] = useState<string>('');
  // タブの高さ（px）
  const TAB_HEIGHT = 40;
  const [editorHeight, setEditorHeight] = useState<number>(window.innerHeight);
  const [currentStep, setCurrentStep] = useState<'url-input' | 'department-management' | 'editor' | 'output' | 'bookmarklet-install'>('url-input');
  const [teamsUrl, setTeamsUrl] = useState('');
  // 参加者の選択状態を管理
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  
  // 元データ管理の状態
  const [sourceDataText, setSourceDataText] = useState('');
  const [sourceDataFile, setSourceDataFile] = useState<File | null>(null);
  const [isSourceDataTextDisabled, setIsSourceDataTextDisabled] = useState(false);

  // 部門選択の状態
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithDetails | null>(null);
  
  // 職種リストの状態
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  
  // 部門選択の階層状態
  const [selectedBu, setSelectedBu] = useState<string>(''); // 選択された部
  const [availableBus, setAvailableBus] = useState<string[]>([]); // 利用可能な部のリスト
  const [availableKas, setAvailableKas] = useState<Department[]>([]); // 選択された部の課のリスト
  
  // 発行者選択の状態
  const [selectedIssuer, setSelectedIssuer] = useState<string>(''); // 選択された議事録発行者
  const [freeIssuerInput, setFreeIssuerInput] = useState<string>(''); // 自由入力欄
  const [showAllMembers, setShowAllMembers] = useState<boolean>(true); // 全メンバー表示フラグ

  // 作業中状態の管理
  const [isHtmlDownloading, setIsHtmlDownloading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  // HtmlExportServiceは直接使用するため、useRefは不要

  // メール送信時は部門のメールアドレスを使用

  // 共通バリデーション関数
  const validateAndExecute = async (
    meetingInfo: any, 
    operation: () => Promise<void>,
    operationName: string,
    setLoadingState?: (loading: boolean) => void
  ): Promise<void> => {
    // 必須項目チェック
    if (!meetingInfo?.会議タイトル?.trim()) {
      alert('会議タイトルは必須項目です。');
      return;
    }
    if (!meetingInfo?.会議日時?.trim()) {
      alert('会議日時は必須項目です。');
      return;
    }
    
    // 会議日時形式チェック
    if (!validateDateTimeFormat(meetingInfo.会議日時)) {
      alert('会議日時の形式が正しくありません。YYYY-MM-DD hh:mm:ss の形式で入力してください。\\n例: 2025-01-01 14:00:00');
      return;
    }

    try {
      // ローディング状態を開始
      if (setLoadingState) {
        setLoadingState(true);
      }
      
      await operation();
    } catch (error) {
      console.error(`${operationName}に失敗しました:`, error);
      alert(`${operationName}に失敗しました。`);
    } finally {
      // ローディング状態を終了
      if (setLoadingState) {
        setLoadingState(false);
      }
    }
  };

  // 日時形式を検証するヘルパー関数
  const validateDateTimeFormat = (datetime: string): boolean => {
    if (!datetime || typeof datetime !== 'string') return true; // 空の場合は検証をスキップ
    
    // YYYY-MM-DD hh:mm:ss 形式の正規表現
    const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    
    if (!dateTimePattern.test(datetime)) {
      return false;
    }
    
    // 実際の日付として有効かチェック
    const datePart = datetime.split(' ')[0];
    const timePart = datetime.split(' ')[1];
    
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    // 基本的な範囲チェック
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (hour < 0 || hour > 23) return false;
    if (minute < 0 || minute > 59) return false;
    if (second < 0 || second > 59) return false;
    
    // Date オブジェクトで実際に有効な日付かチェック
    const date = new Date(year, month - 1, day, hour, minute, second);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day &&
           date.getHours() === hour &&
           date.getMinutes() === minute &&
           date.getSeconds() === second;
  };

  // ファイル名をサニタイズするヘルパー関数
  const sanitizeFilename = (filename: string): string => {
    // ファイル名に使用できない文字を除去またはアンダーバーに置き換え
    let sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_')  // 無効な文字をアンダーバーに置き換え
      .replace(/\s+/g, '_')           // 連続するスペースをアンダーバーに置き換え
      .replace(/_{2,}/g, '_')         // 連続するアンダーバーを単一に
      .replace(/^_+|_+$/g, '');       // 先頭と末尾のアンダーバーを除去
    
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

  // PDFファイル名を生成するヘルパー関数（【社外秘】_会議日（YYYY-MM-DD）_会議タイトル）
  const generatePdfFilename = (meetingInfo: any): string => {
    // 会議タイトルを取得
    const meetingTitle = meetingInfo?.['会議タイトル'] || meetingInfo?.title || '議事録';
    
    // 機密レベルを取得（デフォルトは「社外秘」）
    const confidentialLevel = meetingInfo?.['機密レベル'] || '社外秘';
    
    // 会議日時を取得してフォーマット
    const meetingDateTime = meetingInfo?.['会議日時'] || meetingInfo?.datetime || '';
    let meetingDate = '';
    
    if (meetingDateTime) {
      try {
        // 様々な日時フォーマットに対応
        if (meetingDateTime.includes(' ')) {
          // "YYYY-MM-DD HH:MM:SS" または "YYYY-MM-DD HH:MM" 形式
          meetingDate = meetingDateTime.split(' ')[0];
        } else {
          // "YYYY-MM-DD" 形式
          meetingDate = meetingDateTime;
        }
        
        // 日付の妥当性チェック（簡易）
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(meetingDate)) {
          meetingDate = '';
        }
      } catch (error) {
        // 日付が不正な場合は空文字列
        meetingDate = '';
      }
    }
    
    // ファイル名を構築
    const filename = meetingDate 
      ? `【${confidentialLevel}】_${meetingDate}_${meetingTitle}`
      : `【${confidentialLevel}】_${meetingTitle}`;
    
    return sanitizeFilename(filename);
  };

  // 選択した参加者を除外する関数
  const excludeSelectedParticipants = () => {
    if (!meetingInfo || selectedParticipants.size === 0) return;
    
    const parts = Array.isArray(meetingInfo.参加者)
      ? meetingInfo.参加者
      : (typeof meetingInfo.参加者 === 'string' ? meetingInfo.参加者.split(/\r?\n/).filter(Boolean) : []);
    
    const newParts = parts.filter((_: string, idx: number) => !selectedParticipants.has(idx));
    setMeetingInfo({...meetingInfo, 参加者: newParts});
    setSelectedParticipants(new Set());
  };

  // 選択した参加者以外を除外する関数
  const excludeUnselectedParticipants = () => {
    if (!meetingInfo || selectedParticipants.size === 0) return;
    
    const parts = Array.isArray(meetingInfo.参加者)
      ? meetingInfo.参加者
      : (typeof meetingInfo.参加者 === 'string' ? meetingInfo.参加者.split(/\r?\n/).filter(Boolean) : []);
    
    const newParts = parts.filter((_: string, idx: number) => selectedParticipants.has(idx));
    setMeetingInfo({...meetingInfo, 参加者: newParts});
    setSelectedParticipants(new Set());
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

  // 参加者リストが変更されたときに選択状態をリセット
  useEffect(() => {
    setSelectedParticipants(new Set());
  }, [meetingInfo?.参加者]);

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

  // XML解析を補助するヘルパー関数群

  const parseXmlData = (text: string): any => {
    // XML形式のデータを解析
    const result: any = {};
    
    // 各フィールドをXMLタグから抽出
    const fields = [
      '会議タイトル', '参加者', '会議日時', '会議場所', 
      '部', '課', '職種', '大分類', '中分類', '小分類', '要約', '講評', '発行者', '議事録'
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
              // カンマ区切りの場合（半角カンマ,と全角カンマ、の両方に対応）
              result[field] = value.split(/[,、]/).map(item => item.trim()).filter(item => item);
            }
          } catch (e) {
            // パースできない場合は文字列のまま
            result[field] = value;
          }
        } else {
          // 要約・講評フィールドは/nを\nに変換
          if (field === '要約' || field === '講評') {
            value = value.replace(/\/n/g, '\n');
          }
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

  const parseHtmlWithMeetingInfo = (html: string): any => {
    // HTMLから会議情報を抽出
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const meetingInfoContainer = tempDiv.querySelector('.meeting-info-container');
    if (!meetingInfoContainer) {
      return null; // 会議情報がない場合
    }
    
    const result: any = {};
    
    // 各要素から会議情報を抽出
    const titleEl = meetingInfoContainer.querySelector('.meeting-info-title');
    if (titleEl) result['会議タイトル'] = titleEl.textContent?.trim() || '';
    
    const datetimeEl = meetingInfoContainer.querySelector('.meeting-info-datetime');
    if (datetimeEl) {
      const datetimeText = datetimeEl.textContent?.trim() || '';
      result['会議日時'] = datetimeText.replace(/^会議日時:\s*/, '');
    }
    
    const locationEl = meetingInfoContainer.querySelector('.meeting-info-location');
    if (locationEl) {
      const locationText = locationEl.textContent?.trim() || '';
      result['会議場所'] = locationText.replace(/^場所:\s*/, '');
    }
    
    const departmentEl = meetingInfoContainer.querySelector('.meeting-info-department-value');
    if (departmentEl) result['部'] = departmentEl.textContent?.trim() || '';

    const sectionEl = meetingInfoContainer.querySelector('.meeting-info-section-value');
    if (sectionEl) result['課'] = sectionEl.textContent?.trim() || '';

    const jobTypeEl = meetingInfoContainer.querySelector('.meeting-info-jobtype-value');
    if (jobTypeEl) result['職種'] = jobTypeEl.textContent?.trim() || '';

    // 分類情報の抽出を追加
    const category1El = meetingInfoContainer.querySelector('.meeting-info-category1-value');
    if (category1El) result['大分類'] = category1El.textContent?.trim() || '';

    const category2El = meetingInfoContainer.querySelector('.meeting-info-category2-value');
    if (category2El) result['中分類'] = category2El.textContent?.trim() || '';

    const category3El = meetingInfoContainer.querySelector('.meeting-info-category3-value');
    if (category3El) result['小分類'] = category3El.textContent?.trim() || '';
    
    const participantsEl = meetingInfoContainer.querySelector('.meeting-info-participants');
    if (participantsEl) {
      const participantsHtml = participantsEl.innerHTML;
      // <br/>や<br>で区切られた参加者リストを配列に変換
      // HTMLタグを除去してテキストのみを取得
      let participants = participantsHtml
        .split(/<br\s*\/?>/i)  // <br/>、<br>、<BR/>等に対応
        .map(p => p.replace(/<[^>]*>/g, '').trim())  // HTMLタグを除去
        .filter(p => p);  // 空文字列を除去
      
      // 分割がうまくいかない場合は、textContentから改行で分割を試行
      if (participants.length <= 1 && participantsEl.textContent) {
        const textParticipants = participantsEl.textContent.trim().split(/\n/).filter(p => p.trim());
        if (textParticipants.length > 1) {
          participants = textParticipants.map(p => p.trim());
        }
      }
      
      result['参加者'] = participants;
    }
    
    const summaryEl = meetingInfoContainer.querySelector('.meeting-info-summary');
    if (summaryEl) {
      const summaryHtml = summaryEl.innerHTML;
      // <br/>を改行に変換し、その他のHTMLタグを除去
      result['要約'] = summaryHtml
        .replace(/<br\s*\/?>/gi, '\n')  // <br>を改行に変換
        .replace(/\/n/g, '\n')          // /n を \n に統一
        .replace(/\\n/g, '\n')          // \n を \n に統一
        .replace(/<[^>]*>/g, '')        // その他のHTMLタグを除去
        .trim();
    }
    
    // 講評フィールドを抽出
    const reviewEl = meetingInfoContainer.querySelector('.meeting-info-review');
    if (reviewEl) {
      const reviewHtml = reviewEl.innerHTML;
      // <br/>を改行に変換し、その他のHTMLタグを除去
      result['講評'] = reviewHtml
        .replace(/<br\s*\/?>/gi, '\n')  // <br>を改行に変換
        .replace(/\/n/g, '\n')          // /n を \n に統一
        .replace(/\\n/g, '\n')          // \n を \n に統一
        .replace(/<[^>]*>/g, '')        // その他のHTMLタグを除去
        .trim();
    }
    
    // 発行者フィールドを抽出
    const issuerEl = meetingInfoContainer.querySelector('.meeting-info-issuer-value');
    if (issuerEl) {
      result['発行者'] = issuerEl.textContent?.trim() || '';
    }
    
    // 議事録部分を抽出
    const minutesEl = tempDiv.querySelector('.meeting-minutes-content');
    if (minutesEl) {
      result['議事録'] = minutesEl.innerHTML;
    }
    
    return result;
  };

  const handleOpenTeamsChat = () => {
    if (!teamsUrl.trim()) {
      alert('Teams会議のURLを入力してください。');
      return;
    }

    // https://teams.microsoft.com/meet/ から始まるURLの場合は特別なメッセージを表示
    if (teamsUrl.trim().startsWith('https://teams.microsoft.com/meet/')) {
      alert('このリンクの会議チャットには自動で移動できません。Webブラウザ上でTeamsを手動で開き、会議チャットを開いた状態でブックマークレット「会議情報取得」を実行してください。');
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

  // テキスト処理ロジックを共通化
  const processImportText = async (textContent: string) => {
    if (!textContent.trim()) {
      throw new Error('インポートするテキストが空です。');
    }

    // XML形式かHTMLの会議情報かをチェック
    const trimmed = textContent.trim();
    let parsedData: any = null;
    
    if (trimmed.includes('<会議タイトル>') || trimmed.includes('<議事録>')) {
      try {
        // XML形式として解析
        parsedData = parseXmlData(trimmed);
      } catch (e) {
        console.error('XML解析エラー:', e);
        parsedData = null;
      }
    } else if (trimmed.includes('meeting-info-container')) {
      try {
        // HTML会議情報として解析
        parsedData = parseHtmlWithMeetingInfo(trimmed);
      } catch (e) {
        console.error('HTML会議情報解析エラー:', e);
        parsedData = null;
      }
    }

    if (parsedData && (parsedData.議事録 || parsedData['議事録'])) {
      // XML/HTML会議情報形式とみなし、会議情報と議事録をセット
      // /nを\nに変換するヘルパー関数
      const convertSlashNToNewline = (text: string): string => {
        return text ? text.replace(/\/n/g, '\n') : '';
      };
      
      const info = {
        会議タイトル: parsedData['会議タイトル'] || parsedData['title'] || '',
        参加者: parsedData['参加者'] || parsedData['participants'] || [],
        会議日時: parsedData['会議日時'] || parsedData['datetime'] || '',
        会議場所: parsedData['会議場所'] || parsedData['会議場所'] || '',
        要約: convertSlashNToNewline(parsedData['要約'] || parsedData['summary'] || ''),
        講評: convertSlashNToNewline(parsedData['講評'] || parsedData['review'] || ''),
        発行者: parsedData['発行者'] || parsedData['issuer'] || parsedData['Issuer'] || '',
        機密レベル: parsedData['機密レベル'] || '社外秘', // デフォルトは「社外秘」
        // 以下は読み取り専用で表示する分類情報
        部: parsedData['部'] || parsedData['department'] || '',
        課: parsedData['課'] || '',
        職種: parsedData['職種'] || '',
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
      console.log('Importing text to TinyMCE editor:', textContent);
      
      // マークダウンの場合はHTMLに変換
      let processedContent = textContent;
      if (textContent.includes('#') || textContent.includes('|')) {
        processedContent = convertMarkdownToHtml(textContent);
      }
      
      // HTMLをクリーンアップして安全な形式に変換
      processedContent = sanitizeHtml(processedContent);
      
      setEditorContent(processedContent);
      setImportText(''); // 読み込み後クリア
      setCurrentStep('editor'); // HTMLが読み込まれたら編集ステップに移行
    }
  };

  const handleImportFromTextBox = async () => {
    if (!importText.trim()) {
      alert('インポートするテキストを入力してください。');
      return;
    }

    try {
      await processImportText(importText);
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      alert('データのインポートに失敗しました。XML形式、HTML会議情報形式、またはHTML形式で入力してください。');
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

  // ファイルドラッグ&ドロップのハンドラー関数
  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const htmlFile = files.find(file => 
      file.type === 'text/html' || 
      file.name.toLowerCase().endsWith('.html') || 
      file.name.toLowerCase().endsWith('.htm')
    );
    
    if (htmlFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          setImportText(content);
          // ファイル読み込み後、自動的に議事録読み込み処理を実行
          // setImportTextの更新を待つために少し遅延を入れる
          setTimeout(async () => {
            try {
              await processImportText(content);
            } catch (error) {
              console.error('HTMLファイルの自動処理に失敗しました:', error);
              alert('HTMLファイルの自動処理に失敗しました。手動で「議事録を読み込み」ボタンを押してください。');
            }
          }, 100);
        }
      };
      reader.readAsText(htmlFile, 'UTF-8');
    } else {
      alert('HTMLファイル（.html または .htm）をドロップしてください。');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 部門選択関連の関数
  const loadDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts);
      
      // 部の一覧を抽出（重複除去）
      const busSet = new Set(depts.map(dept => dept.bu_name));
      setAvailableBus(Array.from(busSet));
    } catch (error) {
      console.error('部門の取得に失敗しました:', error);
      alert('部門の取得に失敗しました。');
    }
  };

  // 職種リストを読み込む関数
  const loadJobTypes = async () => {
    try {
      const types = await getAllJobTypes();
      setJobTypes(types);
    } catch (error) {
      console.error('職種の取得に失敗しました:', error);
      alert('職種の取得に失敗しました。');
    }
  };

  const handleBuSelect = (buName: string) => {
    setSelectedBu(buName);
    // 選択された部の課一覧を抽出
    const kasInBu = departments.filter(dept => dept.bu_name === buName);
    setAvailableKas(kasInBu);
  };

  const handleBackToBuSelection = () => {
    setSelectedBu('');
    setAvailableKas([]);
    setSelectedDepartment(null);
  };

  const handleDepartmentSelect = async (departmentId: number) => {
    try {
      const department = await getDepartmentWithDetails(departmentId);
      setSelectedDepartment(department);
    } catch (error) {
      console.error('部門の詳細取得に失敗しました:', error);
      alert('部門の詳細取得に失敗しました。');
    }
  };

  const handleOpenChatWithCorrections = async () => {
    if (!selectedDepartment) {
      alert('部門を選択してください。');
      return;
    }

    // 発行者を確定する
    let finalIssuer = selectedIssuer;
    if (!finalIssuer && freeIssuerInput.trim()) {
      // 自由入力欄に入力がある場合はそれを発行者とし、メンバーに追加
      finalIssuer = freeIssuerInput.trim();
      try {
        await createDepartmentMember(selectedDepartment.id, finalIssuer);
        console.log(`新しいメンバーを追加しました: ${finalIssuer}`);
      } catch (error) {
        console.log(`メンバーは既に存在するか、追加に失敗しました: ${error}`);
        // エラーでも続行（既存メンバーの可能性があるため）
      }
    }

    if (!finalIssuer) {
      alert('議事録発行者を選択または入力してください。');
      return;
    }

    try {
      const clipboardData = await getCorrectionsForClipboardWithIssuer(selectedDepartment.id, finalIssuer);
      
      // JSON形式でクリップボードにコピー
      const jsonData = JSON.stringify(clipboardData, null, 2);
      await navigator.clipboard.writeText(jsonData);
      
      // チャットページを開く
      handleOpenTeamsChat();
    } catch (error) {
      console.error('クリップボードデータのコピーに失敗しました:', error);
      alert('クリップボードデータのコピーに失敗しました。');
    }
  };

  // 部門選択ステップが表示される際に部門一覧を読み込む
  React.useEffect(() => {
    if (currentStep === 'url-input') {
      loadDepartments();
      loadJobTypes();
    }
  }, [currentStep]);

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 元データファイルドラッグ&ドロップのハンドラー関数
  const handleSourceDataFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const supportedFile = files.find(file => {
      const name = file.name.toLowerCase();
      return name.endsWith('.doc') || name.endsWith('.docx') || 
             name.endsWith('.xls') || name.endsWith('.xlsx') || 
             name.endsWith('.pdf');
    });
    
    if (supportedFile) {
      setSourceDataFile(supportedFile);
      setSourceDataText(''); // ファイルがアップロードされたらテキストをクリア
      setIsSourceDataTextDisabled(true); // テキスト入力を無効化
    } else {
      alert('対応ファイル形式: Word(.doc, .docx), Excel(.xls, .xlsx), PDF(.pdf)');
    }
  };

  // 元データテキスト変更ハンドラー
  const handleSourceDataTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceDataText(e.target.value);
    if (e.target.value.trim()) {
      setSourceDataFile(null); // テキストが入力されたらファイルをクリア
    }
  };

  // 元データクリアハンドラー
  const handleClearSourceData = () => {
    setSourceDataText('');
    setSourceDataFile(null);
    setIsSourceDataTextDisabled(false);
  };

  const handleDownloadHtml = async () => {
    await validateAndExecute(meetingInfo, async () => {
      let contentToExport = editorContent;
      if (meetingInfo) {
        contentToExport = HtmlExportService.buildCombinedFragment(meetingInfo, editorContent);
      }

      // 新しい形式でファイル名を生成（【社外秘】_会議日（YYYY-MM-DD）_会議タイトル）
      const filename = generatePdfFilename(meetingInfo);

      await HtmlExportService.downloadHtml(
        contentToExport,
        `${filename}.html`,
        'エクスポートされたドキュメント'
      );
    }, 'HTMLダウンロード', setIsHtmlDownloading);
  };

  const handleDownloadPdf = async () => {
    await validateAndExecute(meetingInfo, async () => {
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
      
      // 新しい形式でファイル名を生成（【社外秘】_会議日（YYYY-MM-DD）_会議タイトル）
      const safeFilename = generatePdfFilename(meetingInfo);
      a.download = `${safeFilename}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('PDFファイルをダウンロードしました。');
    }, 'PDFダウンロード', setIsPdfDownloading);
  };

  // HTML添付送信はフロントで廃止。PDF送信はJSONを送るフローとする。

  const handleSendPdfMail = async () => {
    await validateAndExecute(meetingInfo, async () => {
      // 元データの準備
      let sourceDataFileAttachment: any = undefined;
      let sourceDataTextContent: string | undefined = undefined;

      if (sourceDataFile && sourceDataFile instanceof File) {
        // ファイルがアップロードされている場合
        const fileReader = new FileReader();
        sourceDataFileAttachment = await new Promise((resolve, reject) => {
          fileReader.onload = () => {
            const base64Content = (fileReader.result as string).split(',')[1]; // data:... 部分を除去
            resolve({
              name: sourceDataFile.name,
              content: base64Content,
              mimeType: sourceDataFile.type || 'application/octet-stream'
            });
          };
          fileReader.onerror = reject;
          fileReader.readAsDataURL(sourceDataFile);
        });
      } else if (sourceDataText && sourceDataText.trim()) {
        // テキストが入力されている場合
        sourceDataTextContent = sourceDataText.trim();
      }

      // 元データの有無チェック
      const hasSourceData = sourceDataFileAttachment || sourceDataTextContent;
      if (!hasSourceData) {
        // 元データがない場合は確認ダイアログを表示
        const shouldSend = window.confirm('元データがありませんがメール送信していいですか？');
        if (!shouldSend) {
          return; // ユーザーが「いいえ」を選択した場合は送信をキャンセル
        }
      }

      // フロントは構造化データ（meetingInfo + editorContent + 元データ）をサーバに渡す
      const pdfMailRequest: PdfMailSendRequest = {
        subject: '議事録',
        recipient_email: '',
        meetingInfo: meetingInfo || {},
        minutesHtml: editorContent || '',
        sourceDataText: sourceDataTextContent,
        sourceDataFile: sourceDataFileAttachment,
      };

      await sendPdfMail(pdfMailRequest);
      
      const attachmentInfo = sourceDataFileAttachment ? 
        ` + 元データファイル (${sourceDataFileAttachment.name})` : 
        (sourceDataTextContent ? ' + 元データテキスト' : '');
      alert(`PDF${attachmentInfo}添付メールを送信しました。`);
    }, 'PDF添付メール送信', setIsEmailSending);
  };

  // URL入力画面
  const renderUrlInputStep = () => (
    <div className="url-input-container">
      <div className="url-input-content">
        <h2>議事録編集ツール</h2>
        <p>注意：12:00~12:30は更新をしている場合があるため使用を控えてください </p>
        

        <div className="url-input-section">
          <h3>0. ブックマークレットの登録</h3>
          <p>
            ブックマークレットの登録がまだの方→
            <button 
              onClick={() => setCurrentStep('bookmarklet-install')} 
              className="text-button"
            >
              ブックマークレットの登録
            </button>
          </p>
          <p>ブックマークレットが<strong>「会議情報取得ver05」</strong>でない方は再登録してください。更新日: 2025年9月24日
          </p>
        </div>
        
        <div className="url-input-section">
          <h3>1. 部門選択</h3>
          <button 
            onClick={() => setCurrentStep('department-management')}
            className="manage-link-button"
          >
            部門管理ページ
          </button>
          <p>部門に合った誤字修正を適用するため部門を選択してください。</p>
          
          {/* 部門選択UI */}
          <div className="department-selection-inline">
            {departments.length === 0 ? (
              <p>部門を読み込み中...</p>
            ) : (
              <>
                {!selectedBu ? (
                  // 部の選択
                  <div className="bu-selection-inline">
                    <p>部を選択：</p>
                    <div className="department-buttons-inline">
                      {availableBus.map((buName) => (
                        <button
                          key={buName}
                          onClick={() => handleBuSelect(buName)}
                          className="department-button-small"
                        >
                          {buName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // 課の選択
                  <div className="ka-selection-inline">
                    <div className="breadcrumb-inline">
                      <button onClick={handleBackToBuSelection} className="breadcrumb-button-small">
                        部門選択に戻る
                      </button>
                      <span> / 課を選択：</span>
                    </div>
                    
                    <div className="department-buttons-inline">
                      {availableKas.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => handleDepartmentSelect(dept.id)}
                          className={`department-button-small ${selectedDepartment?.id === dept.id ? 'selected' : ''}`}
                        >
                          {dept.ka_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDepartment && (
                  <div className="selected-department-inline">                    
                    {/* 発行者選択セクション */}
                    <div className="issuer-selection">
                      {selectedIssuer && !showAllMembers ? (
                        // 発行者が選択されている場合：タイトル部分に変更ボタンを表示
                        <div className="issuer-header">
                          <button
                            onClick={() => setShowAllMembers(true)}
                            className="change-issuer-button"
                          >
                            議事録発行者を変更する
                          </button>
                        </div>
                      ) : (
                        // 発行者が未選択、または全メンバー表示モード：選択を促すメッセージを表示
                        <p><strong>議事録発行者を選択してください：</strong></p>
                      )}
                      
                      {/* 既存メンバーからの選択 */}
                      {selectedDepartment.members && selectedDepartment.members.length > 0 && (
                        <div className="member-buttons">
                          {selectedIssuer && !showAllMembers ? (
                            // 発行者が選択されている場合：選択された発行者のみ表示
                            <div className="selected-issuer-display">
                              <div className="department-buttons-inline">
                                <button
                                  className="department-button-small selected"
                                  disabled
                                >
                                  {selectedIssuer}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 発行者が未選択、または全メンバー表示モード：全メンバー表示
                            <div className="department-buttons-inline">
                              {selectedDepartment.members.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => {
                                    setSelectedIssuer(member.member_name);
                                    setFreeIssuerInput(''); // 自由入力をクリア
                                    setShowAllMembers(false); // 選択後は選択されたメンバーのみ表示
                                  }}
                                  className={`department-button-small ${selectedIssuer === member.member_name ? 'selected' : ''}`}
                                >
                                  {member.member_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 自由入力欄 */}
                      <div className="free-issuer-input">
                        <p>または新しい発行者名を入力：</p>
                        <input
                          type="text"
                          value={freeIssuerInput}
                          onChange={(e) => {
                            setFreeIssuerInput(e.target.value);
                            if (e.target.value.trim()) {
                              setSelectedIssuer(''); // 既存選択をクリア
                              setShowAllMembers(true); // 自由入力時は全メンバー表示状態に戻す
                            }
                          }}
                          placeholder="発行者名を入力"
                          className="issuer-input"
                        />
                        {freeIssuerInput.trim() && (
                          <p className="note-text">※ 入力された名前は部門メンバーとして自動登録されます</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="url-input-section">
          <h3>2. Teams会議URLを入力</h3>
          <p>会議に参加するリンクをテキストボックスに張り付けて、【チャットページを開く】ボタンを押してください。</p>
          <input
            type="url"
            value={teamsUrl}
            onChange={e => setTeamsUrl(e.target.value)}
            placeholder="https://teams.microsoft.com/l/meetup-join/..."
            className="url-input"
          />
          {!selectedDepartment && (
            <p className="warning-text">※ 部門を選択してからチャットページを開いてください</p>
          )}
          {selectedDepartment && !selectedIssuer && !freeIssuerInput.trim() && (
            <p className="warning-text">※ 議事録発行者を選択または入力してください</p>
          )}
          <button 
            onClick={selectedDepartment ? handleOpenChatWithCorrections : handleOpenTeamsChat} 
            className="url-button"
            disabled={!selectedDepartment || (!selectedIssuer && !freeIssuerInput.trim())}
          >
            {selectedDepartment ? 'チャットページを開く' : 'チャットページを開く'}
          </button>


          <p>新しいタブで開いたTeamsで「代わりにWebアプリを実行」を選択すると、Teamsチャットページが開きます。</p>
        </div>
        
        <div className="url-input-section">
          <h3>3. Teamsチャットページでの操作</h3>
          <p><strong>「会議情報取得」ブックマークレット</strong>を実行して、会議情報を取得してください。</p>
          <p>クリップボードに会議情報が自動でコピーされて、議事録生成用のGenAIが新しいタブで開きます。</p>

          <button onClick={() => window.open("https://d3r0xupf0a2onu.cloudfront.net/use-case-builder/execute/7abad9ce-a83f-4ec6-91fe-4e843ec0add1", "_blank")} className="back-button">
            議事録生成用のGenAIを開く
          </button>
        </div>
        <div className="url-input-section">
          <h3>4. GenAI ページでの操作</h3>
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

  // ブックマークレット登録ページ
  const renderBookmarkletInstallStep = () => {
    const bookmarkletCode = getBookmarkletCode();

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
            {BOOKMARKLET_NAME}
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
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              placeholder="GenAIで生成された会議情報、またはHTMLを貼り付けてください（HTMLファイルのドラッグ&ドロップも可能）"
              rows={4}
              className="sidebar-textarea"
            />
            <button onClick={handleImportFromTextBox} className="sidebar-button">
              議事録を読み込み
            </button>
          </div>

          <div className="sidebar-section">
            <h3>元データ入力</h3>
            <textarea
              value={sourceDataText}
              onChange={handleSourceDataTextChange}
              onDrop={handleSourceDataFileDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              disabled={isSourceDataTextDisabled}
              placeholder={isSourceDataTextDisabled ? 
                'ファイルがアップロードされているため、テキスト入力は無効化されています。' : 
                'テキストデータを入力するか、Word・Excel・PDFファイルをドラッグ&ドロップしてください。'}
              rows={3}
              className="sidebar-textarea"
              style={{
                backgroundColor: isSourceDataTextDisabled ? '#f5f5f5' : 'white',
                color: isSourceDataTextDisabled ? '#666' : 'black'
              }}
            />
            {sourceDataFile && (
              <div className="source-data-file-info">
                <p>アップロード済み: {sourceDataFile.name}</p>
                <button onClick={handleClearSourceData} className="sidebar-button-secondary">
                  クリア
                </button>
              </div>
            )}
            {!sourceDataFile && sourceDataText.trim() && (
              <div className="source-data-text-info">
                <p>テキストデータ: {sourceDataText.length}文字</p>
                <button onClick={handleClearSourceData} className="sidebar-button-secondary">
                  クリア
                </button>
              </div>
            )}
          </div>
          
          <div className="sidebar-section">
            <h3>ダウンロード</h3>
            <LoadingSpinner 
              isLoading={isHtmlDownloading} 
              message="HTMLファイルを準備中..."
            >
              <button 
                onClick={handleDownloadHtml} 
                className="sidebar-button"
                disabled={isHtmlDownloading || isPdfDownloading || isEmailSending}
              >
                HTML形式
              </button>
            </LoadingSpinner>
            <LoadingSpinner 
              isLoading={isPdfDownloading} 
              message="PDFファイルを生成中..."
            >
              <button 
                onClick={handleDownloadPdf} 
                className="sidebar-button"
                disabled={isHtmlDownloading || isPdfDownloading || isEmailSending}
              >
                PDF形式
              </button>
            </LoadingSpinner>
          </div>
          
          <div className="sidebar-section">
            <h3>メール送信</h3>
            {selectedDepartment?.email_address ? (
              <LoadingSpinner 
                isLoading={isEmailSending} 
                message="メールを送信中..."
              >
                <button 
                  onClick={handleSendPdfMail} 
                  className="sidebar-button"
                  disabled={isHtmlDownloading || isPdfDownloading || isEmailSending}
                >
                  PDF添付
                </button>
              </LoadingSpinner>
            ) : (
              <div>
                <button className="sidebar-button disabled" disabled>
                  PDF添付
                </button>
                <p className="warning-text small">
                  ⚠ メールアドレスを登録してください
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <main className="editor-container">
        <div className="tabbed-editor">
          <div className="tabs" style={{height: TAB_HEIGHT}}>
            <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>会議情報</button>
            <button className={activeTab === 'minutes' ? 'active' : ''} onClick={() => setActiveTab('minutes')}>議事録</button>
            </div>
            <div className="tab-body">
              {activeTab === 'info' ? (
              <div className="meeting-info-editor">
                
                  <label>機密レベル</label>
                  <div className="confidential-level-container">
                    <button
                      type="button"
                      onClick={() => setMeetingInfo({...meetingInfo, 機密レベル: '社外秘'})}
                      className={`confidential-button confidential-button-public ${(meetingInfo.機密レベル || '社外秘') === '社外秘' ? 'active' : ''}`}
                    >
                      社外秘
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingInfo({...meetingInfo, 機密レベル: '秘'})}
                      className={`confidential-button confidential-button-secret ${meetingInfo.機密レベル === '秘' ? 'active' : ''}`}
                    >
                      秘
                    </button>
                  </div>
                  <label>会議タイトル</label>
                  <input type="text" value={meetingInfo.会議タイトル || ''} onChange={e => setMeetingInfo({...meetingInfo, 会議タイトル: e.target.value})} />
                  <label>会議日時 (YYYY-MM-DD hh:mm:ss)</label>
                  <input 
                    type="text" 
                    placeholder="2025-01-01 14:00:00" 
                    value={meetingInfo.会議日時 || ''} 
                    onChange={e => setMeetingInfo({...meetingInfo, 会議日時: e.target.value})} 
                  />
                  <label>会議場所</label>
                  <input type="text" value={meetingInfo.会議場所 || ''} onChange={e => setMeetingInfo({...meetingInfo, 会議場所: e.target.value})} />
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px'}}>
                    <label style={{margin: 0}}>参加者</label>
                    <button
                      type="button"
                      onClick={excludeSelectedParticipants}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      disabled={selectedParticipants.size === 0}
                    >
                      選択した参加者を除外
                    </button>
                    <button
                      type="button"
                      onClick={excludeUnselectedParticipants}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      disabled={selectedParticipants.size === 0}
                    >
                      選択した参加者以外を除外
                    </button>
                  </div>
                  {/* Participants editor: show per-person inputs with add/remove to ensure array is sent */}
                  {(() => {
                    // normalize to array for rendering
                    const parts = Array.isArray(meetingInfo.参加者)
                      ? meetingInfo.参加者
                      : (typeof meetingInfo.参加者 === 'string' ? meetingInfo.参加者.split(/\r?\n/).filter(Boolean) : []);
                    return (
                      <div className="participants-editor" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                        {parts.map((p: string, idx: number) => (
                          <div key={idx} style={{display: 'flex', alignItems: 'center', marginBottom: 6, justifyContent: 'flex-start', width: '10%'}}>
                            <input
                              type="checkbox"
                              checked={selectedParticipants.has(idx)}
                              onChange={e => {
                                const newSelected = new Set(selectedParticipants);
                                if (e.target.checked) {
                                  newSelected.add(idx);
                                } else {
                                  newSelected.delete(idx);
                                }
                                setSelectedParticipants(newSelected);
                              }}
                              style={{marginRight: 8}}
                            />
                            <input
                              type="text"
                              value={p}
                              onChange={e => {
                                const newParts = parts.slice();
                                newParts[idx] = e.target.value;
                                setMeetingInfo({...meetingInfo, 参加者: newParts});
                              }}
                              style={{flex: '1 1 auto', minWidth: '500px'}}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newParts = parts.slice();
                            newParts.push('');
                            setMeetingInfo({...meetingInfo, 参加者: newParts});
                            // 新しい参加者が追加されたので選択状態をリセット
                            setSelectedParticipants(new Set());
                          }}
                        >参加者を追加</button>
                      </div>
                    );
                  })()}
                  <label>要約</label>
                  <textarea rows={6} value={meetingInfo.要約 || ''} onChange={e => setMeetingInfo({...meetingInfo, 要約: e.target.value})} />
                  <label>講評</label>
                  <textarea rows={6} value={meetingInfo.講評 || ''} onChange={e => setMeetingInfo({...meetingInfo, 講評: e.target.value})} />
                  <label>発行者</label>
                  <input type="text" value={meetingInfo.発行者 || ''} onChange={e => setMeetingInfo({...meetingInfo, 発行者: e.target.value})} />
                  
                  
                  {/* 表示はするが編集不可の分類フィールド */}
                  <label>部</label>
                  <input type="text" value={meetingInfo.部 || ''} onChange={e => setMeetingInfo({...meetingInfo, 部: e.target.value})} />
                  <label>課</label>
                  <input type="text" value={meetingInfo.課 || ''} onChange={e => setMeetingInfo({...meetingInfo, 課: e.target.value})} />
                  <label>職種</label>
                  <select 
                    value={meetingInfo.職種 || ''} 
                    onChange={e => setMeetingInfo({...meetingInfo, 職種: e.target.value})}
                  >
                    <option value="">-- 職種を選択 --</option>
                    {jobTypes.map(jobType => (
                      <option key={jobType.id} value={jobType.name}>
                        {jobType.name}
                      </option>
                    ))}
                  </select>
                  <label>大分類</label>
                  <input type="text" value={meetingInfo.大分類 || ''} onChange={e => setMeetingInfo({...meetingInfo, 大分類: e.target.value})} />
                  <label>中分類</label>
                  <input type="text" value={meetingInfo.中分類 || ''} onChange={e => setMeetingInfo({...meetingInfo, 中分類: e.target.value})} />
                  <label>小分類</label>
                  <input type="text" value={meetingInfo.小分類 || ''} onChange={e => setMeetingInfo({...meetingInfo, 小分類: e.target.value})} />
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
      </main>
    </div>
  );

  return (
    <div className="app">
      {currentStep === 'url-input' && renderUrlInputStep()}
      {currentStep === 'department-management' && (
        <DepartmentManagement onBack={() => setCurrentStep('url-input')} />
      )}
      {currentStep === 'editor' && renderEditorStep()}
      {/* ▼▼▼ ここを追加 ▼▼▼ */}
      {currentStep === 'bookmarklet-install' && renderBookmarkletInstallStep()}
    </div>
  );
}

export default App;
