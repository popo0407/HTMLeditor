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

  const handleScrapingSubmit = async (request: ScrapingRequest) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('スクレイピング開始:', request);
      const result = await scrapingApiService.executeScraping(request);
      setResponse(result);
      console.log('スクレイピング完了:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'スクレイピング処理中にエラーが発生しました';
      setError(errorMessage);
      console.error('スクレイピングエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResponse(null);
    setError(null);
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
