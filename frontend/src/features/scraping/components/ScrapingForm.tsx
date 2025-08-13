/**
 * スクレイピング入力フォームコンポーネント
 * 
 * 開発憲章の「コンポーネントベースアーキテクチャ」に従い、
 * UI状態をコンポーネント内にカプセル化
 */

import React, { useState } from 'react';
import { ScrapingRequest, LoginCredentials, UrlConfig, ScrapingMode } from '../../../types/scrapingTypes';
import './ScrapingForm.css';

interface ScrapingFormProps {
  onSubmit: (request: ScrapingRequest) => void;
  isLoading: boolean;
}

const ScrapingForm: React.FC<ScrapingFormProps> = ({ onSubmit, isLoading }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    login_url: ''
  });

  // URL1とURL2のモードを固定
  const [urlConfigs, setUrlConfigs] = useState<UrlConfig[]>([
    {
      url: '',
      mode: ScrapingMode.TITLE_DATE_PARTICIPANT // URL1: タイトル・日時・参加者
    },
    {
      url: '',
      mode: ScrapingMode.CHAT_ENTRIES // URL2: チャットエントリー
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 空のURLをチェック
    if (!urlConfigs[0].url || !urlConfigs[1].url) {
      alert('両方のURLを入力してください');
      return;
    }

    if (!credentials.username || !credentials.password || !credentials.login_url) {
      alert('認証情報を入力してください');
      return;
    }

    const request: ScrapingRequest = {
      credentials,
      url_configs: urlConfigs
    };

    onSubmit(request);
  };

  const handleUrlChange = (index: number, value: string) => {
    setUrlConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, url: value } : config
    ));
  };

  const handleCredentialChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="scraping-form">
      <div className="form-section">
        <h3>スクレイピング対象URL</h3>
        
        <div className="url-input-group">
          <label>
            URL1: タイトル・日時・参加者を取得
            <input
              type="url"
              value={urlConfigs[0].url}
              onChange={(e) => handleUrlChange(0, e.target.value)}
              placeholder="https://example.com/page1"
              required
            />
          </label>
        </div>

        <div className="url-input-group">
          <label>
            URL2: チャットエントリーを取得
            <input
              type="url"
              value={urlConfigs[1].url}
              onChange={(e) => handleUrlChange(1, e.target.value)}
              placeholder="https://example.com/page2"
              required
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>認証情報</h3>
        <div className="credential-inputs">
          <label>
            ログインURL:
            <input
              type="url"
              value={credentials.login_url}
              onChange={(e) => handleCredentialChange('login_url', e.target.value)}
              placeholder="https://example.com/login"
              required
            />
          </label>
          <label>
            ユーザー名:
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => handleCredentialChange('username', e.target.value)}
              placeholder="username"
              required
            />
          </label>
          <label>
            パスワード:
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => handleCredentialChange('password', e.target.value)}
              placeholder="password"
              required
            />
          </label>
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="submit-button">
        {isLoading ? 'スクレイピング中...' : 'スクレイピング開始'}
      </button>
    </form>
  );
};

export default ScrapingForm;
