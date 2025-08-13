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

  const handleScrapingSubmit = async (request: ScrapingRequest) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('スクレイピング開始:', request);
      const result = await scrapingApiService.executeScraping(request);
      setResponse(result);
      console.log('スクレイピング完了:', result);
      
      // スクレイピング完了時に自動的に構造化データをクリップボードにコピー
      if (result.formatted_output) {
        try {
          const copySuccess = await copyToClipboard(result.formatted_output, 'formatted');
          if (copySuccess) {
            setAutoCopyStatus('success');
            console.log('✅ 構造化データを自動的にクリップボードにコピーしました');
            // 成功時は3秒後に通知をクリア
            setTimeout(() => {
              setAutoCopyStatus(null);
            }, 3000);
          } else {
            setAutoCopyStatus('failed');
            console.warn('⚠️ 自動コピーに失敗しました - フォーカス状態または権限の問題の可能性');
            // 失敗時は通知を手動で閉じるまで表示し続ける
          }
        } catch (copyError) {
          setAutoCopyStatus('failed');
          console.warn('⚠️ 自動コピーでエラーが発生しました:', copyError);
          // 失敗時は通知を手動で閉じるまで表示し続ける
        }
      }
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

      {autoCopyStatus && (
        <div className={`auto-copy-notification ${autoCopyStatus}`}>
          <div className="auto-copy-content">
            {autoCopyStatus === 'success' ? (
              <>
                <strong>✅ 自動コピー完了:</strong>
                <span>構造化データがクリップボードにコピーされました</span>
              </>
            ) : (
              <>
                <strong>⚠️ 自動コピーに失敗しました</strong>
                <span>
                  ブラウザのフォーカスが失われている可能性があります。
                  <br />
                  <strong>対処法:</strong> 下の「構造化データをコピー」ボタンをクリックしてください。
                </span>
              </>
            )}
          </div>
          <button 
            onClick={() => setAutoCopyStatus(null)} 
            className="auto-copy-dismiss"
            aria-label="通知を閉じる"
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
        
        {/* 構造化データのクイックコピーボタン */}
        {response && response.formatted_output && autoCopyStatus === 'failed' && (
          <div className="quick-copy-section">
            <div className="quick-copy-header">
              <h4>📋 構造化データのクイックコピー</h4>
              <p>自動コピーが失敗した場合の代替手段です。このボタンをクリックして手動でコピーしてください。</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const copySuccess = await copyToClipboard(response.formatted_output!, 'formatted');
                  if (copySuccess) {
                    setAutoCopyStatus('success');
                    // 成功時は3秒後に通知をクリア
                    setTimeout(() => setAutoCopyStatus(null), 3000);
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
              📋 構造化データをクリップボードにコピー
            </button>
          </div>
        )}
        
        {isLoading && (
          <div className="scraping-notice">
            <div className="notice-header">
              <span className="notice-icon">⚠️</span>
              <strong>スクレイピング実行中</strong>
            </div>
            <div className="notice-content">
              <p>処理完了まで以下の操作は避けてください：</p>
              <ul>
                <li>ブラウザのタブを切り替えない</li>
                <li>ブラウザウィンドウを最小化しない</li>
                <li>他のブラウザウィンドウに切り替えない</li>
                <li>PCをスリープ状態にしない</li>
              </ul>
              <p className="notice-tip">
                💡 これらの操作を行うと、自動コピーが失敗する可能性があります
              </p>
            </div>
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
