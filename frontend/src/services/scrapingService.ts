/**
 * スクレイピングAPIサービス
 * 
 * 開発憲章の「関心の分離」に従い、API通信ロジックを分離
 */

import { ScrapingRequest, ScrapingResponse } from '../types/scrapingTypes';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

class ScrapingApiService {
  /**
   * スクレイピング実行
   */
  async executeScraping(request: ScrapingRequest): Promise<ScrapingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Scraping API call failed:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'スクレイピング処理中にエラーが発生しました'
      );
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * 設定情報取得
   */
  async getConfig(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/config`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Config fetch failed:', error);
      throw error;
    }
  }
}

export const scrapingApiService = new ScrapingApiService();
