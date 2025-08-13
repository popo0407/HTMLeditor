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

  const copyToClipboard = async (text: string, dataType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedData(dataType);
      
      // 2秒後にコピー表示をクリア
      setTimeout(() => {
        setCopiedData(null);
      }, 2000);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      alert('クリップボードへのコピーに失敗しました。');
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
        <button onClick={onClear} className="clear-button">
          結果をクリア
        </button>
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
                    onClick={() => copyToClipboard(result.data!, `individual_${index}`)}
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
              onClick={() => copyToClipboard(response.formatted_output!, 'formatted')}
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
              onClick={() => copyToClipboard(response.combined_data, 'combined')}
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
