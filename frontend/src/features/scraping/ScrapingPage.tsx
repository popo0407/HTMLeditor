/**
 * スクレイピング機能ページコンポーネント
 * 
 * 開発憲章の「features」配置に従い、
 * フォームと結果表示を統合した機能実装
 */

import React, { useState } from 'react';
import ScrapingForm from './components/ScrapingForm';
import ResultDisplay from './components/ResultDisplay';
import { ScrapingRequest, ScrapingResponse } from '../../types/scrapingTypes';
import { scrapingApiService } from '../../services/scrapingService';
import './ScrapingPage.css';

const ScrapingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScrapingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCopyStatus, setAutoCopyStatus] = useState<string | null>(null);

  // 環境変数の確認（デバッグ用）
  React.useEffect(() => {
    console.log('=== ScrapingPage初期化時の環境変数確認 ===');
    console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('利用可能なREACT_APP_環境変数:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  }, []);

  const handleScrapingSubmit = async (request: ScrapingRequest) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setAutoCopyStatus(null);

    try {
      console.log('スクレイピング開始:', request);
      const result = await scrapingApiService.executeScraping(request);
      setResponse(result);
      console.log('スクレイピング完了:', result);
      
      // スクレイピング完了後は自動コピーを行わず、完了通知のみ表示
      setAutoCopyStatus('completed');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'スクレイピング処理中にエラーが発生しました';
      setError(errorMessage);
      console.error('スクレイピングエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // クリップボードにコピーする関数
  const copyToClipboard = async (text: string, dataType: string) => {
    try {
      // ドキュメントのフォーカス状態を確認
      const hasFocus = document.hasFocus();
      const isVisible = document.visibilityState === 'visible';
      console.log(`フォーカス状態チェック: hasFocus=${hasFocus}, visibilityState=${document.visibilityState}`);
      
      if (!hasFocus || !isVisible) {
        console.log('ドキュメントがフォーカスされていない、または非表示状態のため、フォールバック方式を使用');
        return await fallbackCopyToClipboard(text);
      }

      // モダンなクリップボードAPIを試行
      if (navigator.clipboard && window.isSecureContext) {
        console.log('モダンAPI試行中...');
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // フォールバック: 古いブラウザやHTTP環境用
      console.log('フォールバック方式試行中...');
      return await fallbackCopyToClipboard(text);
      
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
      
      // エラーが発生した場合はフォールバック方式を試行
      try {
        console.log('エラー後のフォールバック方式を試行');
        return await fallbackCopyToClipboard(text);
      } catch (fallbackError) {
        console.error('フォールバック方式も失敗:', fallbackError);
        return false;
      }
    }
  };

  // フォールバック用のクリップボードコピー関数
  const fallbackCopyToClipboard = async (text: string): Promise<boolean> => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('フォールバック方式でコピー成功');
        return true;
      } else {
        console.log('フォールバック方式でコピー失敗');
        return false;
      }
    } catch (error) {
      console.error('フォールバック方式でエラー:', error);
      return false;
    }
  };

  const handleClearResults = () => {
    setResponse(null);
    setError(null);
    setAutoCopyStatus(null);
  };

  // バックエンドの.envに記載のURLを新しいタブで開く関数
  const openBackendUrl = () => {
    console.log('=== 環境変数デバッグ ===');
    console.log('process.env:', process.env);
    console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // 環境変数から取得を試行
    let backendUrl = process.env.REACT_APP_BACKEND_URL;
    
    // 環境変数が読み込まれない場合の一時的な対処法
    if (!backendUrl) {
      console.warn('環境変数が読み込まれていないため、ハードコードされたURLを使用します');
      backendUrl = 'http://localhost:8080/test_login.html';
    }
    
    if (backendUrl) {
      console.log('バックエンドURLを開きます:', backendUrl);
      window.open(backendUrl, '_blank');
    } else {
      console.error('BACKEND_URLが設定されていません。');
      console.error('利用可能な環境変数:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
    }
  };

  return (
    <div className="scraping-page">
      <div className="scraping-page-header">
        <h1>Webページデータ取得</h1>
        <p>指定されたWebページからデータを自動取得し、クリップボードにコピーできます。</p>
      </div>

      {error && (
        <div className="error-notification">
          <div className="error-content">
            <strong>エラーが発生しました:</strong>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="error-dismiss"
            aria-label="エラーを閉じる"
          >
            ×
          </button>
        </div>
      )}

      <div className="scraping-content">
        <ScrapingForm 
          onSubmit={handleScrapingSubmit}
          isLoading={isLoading}
        />
        
        {/* 会議情報のクリップボードコピーボタン */}
        {response && response.formatted_output && autoCopyStatus === 'completed' && (
          <div className="quick-copy-section">
            <div className="quick-copy-header">
              <h4>📋 会議情報のクリップボードコピー</h4>
              <p>スクレイピングが完了しました。このボタンをクリックして会議情報をクリップボードにコピーしてください。</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const copySuccess = await copyToClipboard(response.formatted_output!, 'formatted');
                  if (copySuccess) {
                    setAutoCopyStatus('success');
                    // 成功時は3秒後に通知をクリア
                    setTimeout(() => setAutoCopyStatus(null), 3000);
                    
                    // バックエンドの.envに記載のURLを新しいタブで開く
                    openBackendUrl();
                  } else {
                    setAutoCopyStatus('failed');
                    // 失敗時は通知を手動で閉じるまで表示し続ける
                  }
                } catch (error) {
                  setAutoCopyStatus('failed');
                  // 失敗時は通知を手動で閉じるまで表示し続ける
                }
              }}
              className="quick-copy-button"
              disabled={isLoading}
            >
              📋 会議情報をクリップボードにコピー
            </button>
          </div>
        )}
        
        {response && (
          <ResultDisplay 
            response={response}
            onClear={handleClearResults}
          />
        )}
      </div>
    </div>
  );
};

export default ScrapingPage;
