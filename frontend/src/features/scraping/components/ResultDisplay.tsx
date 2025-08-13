/**
 * スクレイピング結果表示コンポーネント
 * 
 * 開発憲章の「使いやすさを優先したデザイン」に従い、
 * 結果の視認性とクリップボード操作を提供
 */

import React, { useState } from 'react';
import { ScrapingResponse, ScrapingResult } from '../../../types/scrapingTypes';
import './ResultDisplay.css';

interface ResultDisplayProps {
  response: ScrapingResponse | null;
  onClear: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ response, onClear }) => {
  const [copiedData, setCopiedData] = useState<string | null>(null);

  // クリップボードの権限状態を確認
  React.useEffect(() => {
    const checkClipboardPermissions = async () => {
      console.log('=== クリップボード環境チェック ===');
      console.log('navigator.clipboard:', !!navigator.clipboard);
      console.log('window.isSecureContext:', window.isSecureContext);
      console.log('location.protocol:', window.location.protocol);
      console.log('location.hostname:', window.location.hostname);
      
      if (navigator.clipboard) {
        try {
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          console.log('クリップボード権限:', permission.state);
        } catch (err) {
          console.log('クリップボード権限確認エラー:', err);
        }
      }
      
      console.log('=== 環境チェック完了 ===');
    };
    
    checkClipboardPermissions();
  }, []);

  const copyToClipboard = async (text: string, dataType: string) => {
    // デバッグ情報を追加
    console.log(`=== クリップボードコピー開始: ${dataType} ===`);
    console.log(`テキスト長: ${text.length}文字`);
    console.log(`テキスト内容: ${text.substring(0, 200)}...`);
    
    try {
      // モダンなクリップボードAPIを試行
      if (navigator.clipboard && window.isSecureContext) {
        console.log('モダンAPI試行中...');
        await navigator.clipboard.writeText(text);
        setCopiedData(dataType);
        console.log(`✅ ${dataType}をクリップボードにコピーしました（モダンAPI）`);
        
        // 2秒後にコピー表示をクリア
        setTimeout(() => {
          setCopiedData(null);
        }, 2000);
        return;
      }
      
      // フォールバック: 古いブラウザやHTTP環境用
      console.log('フォールバック方式試行中...');
      
      // 方法1: 通常のテキストエリア方式
      try {
        console.log('方法1: 非表示テキストエリア方式');
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
        console.log('テキストエリア要素を追加完了');
        
        textArea.focus();
        textArea.select();
        console.log('テキストエリアにフォーカス・選択完了');
        
        const successful = document.execCommand('copy');
        console.log(`execCommand結果: ${successful}`);
        
        if (successful) {
          setCopiedData(dataType);
          console.log(`✅ ${dataType}をクリップボードにコピーしました（フォールバック方式）`);
          
          // 2秒後にコピー表示をクリア
          setTimeout(() => {
            setCopiedData(null);
          }, 2000);
          
          document.body.removeChild(textArea);
          return;
        } else {
          console.log('execCommandが失敗しました');
        }
        
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('方法1が失敗:', err);
      }
      
      // 方法2: ユーザーインタラクションを伴う方式
      try {
        console.log('方法2: ユーザーインタラクション方式試行中...');
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '50%';
        textArea.style.top = '50%';
        textArea.style.transform = 'translate(-50%, -50%)';
        textArea.style.width = '80%';
        textArea.style.height = '200px';
        textArea.style.zIndex = '9999';
        textArea.style.border = '2px solid #007bff';
        textArea.style.borderRadius = '8px';
        textArea.style.padding = '12px';
        textArea.style.fontSize = '14px';
        textArea.style.fontFamily = 'monospace';
        textArea.style.backgroundColor = 'white';
        textArea.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        
        // コピーボタンを追加
        const copyButton = document.createElement('button');
        copyButton.textContent = 'クリップボードにコピー';
        copyButton.style.position = 'absolute';
        copyButton.style.top = '10px';
        copyButton.style.right = '10px';
        copyButton.style.padding = '8px 16px';
        copyButton.style.backgroundColor = '#007bff';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '4px';
        copyButton.style.cursor = 'pointer';
        copyButton.style.fontSize = '12px';
        
        // 閉じるボタンを追加
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '50px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#dc3545';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        
        // コンテナを作成
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.backgroundColor = 'rgba(0,0,0,0.5)';
        container.style.zIndex = '9998';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        
        container.appendChild(textArea);
        textArea.appendChild(copyButton);
        textArea.appendChild(closeButton);
        document.body.appendChild(container);
        
        // イベントリスナーを設定
        copyButton.onclick = () => {
          textArea.select();
          try {
            const successful = document.execCommand('copy');
            if (successful) {
              setCopiedData(dataType);
              copyButton.textContent = 'コピー完了！';
              copyButton.style.backgroundColor = '#28a745';
              setTimeout(() => {
                setCopiedData(null);
              }, 2000);
            }
          } catch (err) {
            console.error('コピー失敗:', err);
            copyButton.textContent = 'コピー失敗';
            copyButton.style.backgroundColor = '#dc3545';
          }
        };
        
        closeButton.onclick = () => {
          document.body.removeChild(container);
        };
        
        // 30秒後に自動で閉じる
        setTimeout(() => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }, 30000);
        
        console.log('ユーザーインタラクション方式表示完了');
        return;
        
      } catch (err) {
        console.error('方法2も失敗:', err);
      }
      
      // 最終手段: ユーザーに手動コピーを促す
      console.log('最終手段: 手動コピーダイアログを表示');
      showManualCopyDialog(text, dataType);
      
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('エラー詳細:', error.message);
        console.error('エラースタック:', error.stack);
      }
      
      // 最終手段: ユーザーに手動コピーを促す
      showManualCopyDialog(text, dataType);
    }
    
    console.log(`=== クリップボードコピー終了: ${dataType} ===`);
  };

  const showManualCopyDialog = (text: string, dataType: string) => {
    const dataTypeName = getDataTypeDisplayName(dataType);
    const message = `${dataTypeName}のコピーに失敗しました。\n\n以下のデータを手動でコピーしてください：\n\n${text}`;
    
    // アラートで表示（本番環境ではより適切なモーダルに変更可能）
    alert(message);
    
    // コンソールにも出力
    console.log(`${dataTypeName}のデータ（手動コピー用）:`, text);
  };

  const getDataTypeDisplayName = (dataType: string): string => {
    switch (dataType) {
      case 'formatted':
        return '構造化データ';
      case 'combined':
        return '生データ';
      default:
        if (dataType.startsWith('individual_')) {
          const index = parseInt(dataType.replace('individual_', ''));
          return `個別データ${index + 1}`;
        }
        return dataType;
    }
  };

  const getModeDisplayName = (mode: string): string => {
    switch (mode) {
      case 'title_date_participant':
        return 'タイトル・日付・参加者';
      case 'chat_entries':
        return 'チャットエントリー';
      default:
        return mode;
    }
  };

  const formatProcessingTime = (seconds: number): string => {
    return `${seconds.toFixed(2)}秒`;
  };

  const getStatusBadgeClass = (status: string): string => {
    return status === 'success' ? 'status-success' : 'status-error';
  };

  if (!response) {
    return null;
  }

  return (
    <div className="result-display">
      <div className="result-header">
        <h3>スクレイピング結果</h3>
        <div className="header-actions">
          <div className="clipboard-status">
            <span className="status-label">クリップボード:</span>
            <span className={`status-indicator ${navigator.clipboard && window.isSecureContext ? 'available' : 'limited'}`}>
              {navigator.clipboard && window.isSecureContext ? '利用可能' : '制限あり'}
            </span>
          </div>
          <button onClick={onClear} className="clear-button">
            結果をクリア
          </button>
        </div>
      </div>

      <div className="result-summary">
        <div className="summary-item">
          <span className="summary-label">セッションID:</span>
          <span className="summary-value">{response.session_id}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">処理時間:</span>
          <span className="summary-value">{formatProcessingTime(response.total_processing_time)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">処理URL数:</span>
          <span className="summary-value">{response.results.length}件</span>
        </div>
      </div>

      <div className="results-section">
        <h4>個別結果</h4>
        {response.results.map((result: ScrapingResult, index: number) => (
          <div key={index} className="result-item">
            <div className="result-item-header">
              <div className="result-url-info">
                <span className="result-url">{result.url}</span>
                <span className="result-mode">({getModeDisplayName(result.mode)})</span>
              </div>
              <span className={`status-badge ${getStatusBadgeClass(result.status)}`}>
                {result.status === 'success' ? '成功' : 'エラー'}
              </span>
            </div>
            
            <div className="result-timestamp">
              処理時刻: {result.timestamp}
            </div>

            {result.status === 'success' && result.data && (
              <div className="result-data">
                <div className="data-header">
                  <span>取得データ</span>
                  <button 
                    onClick={() => {
                      console.log(`=== 個別データ${index + 1}コピーボタンクリック ===`);
                      console.log('data:', result.data);
                      console.log('data長:', result.data?.length);
                      copyToClipboard(result.data!, `individual_${index}`);
                    }}
                    className="copy-button"
                    disabled={copiedData === `individual_${index}`}
                  >
                    {copiedData === `individual_${index}` ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
                <pre className="data-content">{result.data}</pre>
              </div>
            )}

            {result.status === 'error' && result.error_message && (
              <div className="result-error">
                <span className="error-label">エラー内容:</span>
                <span className="error-message">{result.error_message}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {response.formatted_output && (
        <div className="combined-section">
          <div className="combined-header">
            <h4>構造化データ（推奨）</h4>
            <button 
              onClick={() => {
                console.log('=== 構造化データコピーボタンクリック ===');
                console.log('formatted_output:', response.formatted_output);
                console.log('formatted_output長:', response.formatted_output?.length);
                copyToClipboard(response.formatted_output!, 'formatted');
              }}
              className="copy-button primary"
              disabled={copiedData === 'formatted'}
            >
              {copiedData === 'formatted' ? 'コピー済み' : '構造化データをコピー'}
            </button>
          </div>
          <pre className="combined-data">{response.formatted_output}</pre>
        </div>
      )}

      {response.combined_data && (
        <div className="combined-section">
          <div className="combined-header">
            <h4>生データ</h4>
            <button 
              onClick={() => {
                console.log('=== 生データコピーボタンクリック ===');
                console.log('combined_data:', response.combined_data);
                console.log('combined_data長:', response.combined_data?.length);
                copyToClipboard(response.combined_data, 'combined');
              }}
              className="copy-button"
              disabled={copiedData === 'combined'}
            >
              {copiedData === 'combined' ? 'コピー済み' : '生データをコピー'}
            </button>
          </div>
          <pre className="combined-data raw-data">{response.combined_data}</pre>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
