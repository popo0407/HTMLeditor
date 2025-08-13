/**
 * スクレイピング機能のフロントエンドテスト
 * 
 * 開発憲章の「包括的テストカバレッジ」に従い、
 * コンポーネントの動作を検証
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ScrapingPage from './ScrapingPage';

// モックの設定
jest.mock('../../services/scrapingService', () => ({
  scrapingApiService: {
    executeScraping: jest.fn()
  }
}));

// モックされたサービスを取得
import { scrapingApiService } from '../../services/scrapingService';
const mockExecuteScraping = (scrapingApiService.executeScraping as jest.Mock);

describe('ScrapingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // window.alertのモック
    window.alert = jest.fn();
  });

  test('フォームが正しく表示される', () => {
    render(<ScrapingPage />);
    
    // URL入力フィールド
    expect(screen.getByLabelText(/URL1: タイトル・日時・参加者を取得/)).toBeInTheDocument();
    expect(screen.getByLabelText(/URL2: チャットエントリーを取得/)).toBeInTheDocument();
    
    // 認証情報フィールド
    expect(screen.getByLabelText(/ログインURL/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ユーザー名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
    
    // 送信ボタン
    expect(screen.getByRole('button', { name: /スクレイピング開始/ })).toBeInTheDocument();
  });

  test('必須フィールドのバリデーション', async () => {
    render(<ScrapingPage />);
    
    const submitButton = screen.getByRole('button', { name: /スクレイピング開始/ });
    
    // 空の状態で送信
    await userEvent.click(submitButton);
    
    // アラートが表示されることを確認（実際のアプリではより適切なバリデーションを使用）
    expect(window.alert).toHaveBeenCalledWith('両方のURLを入力してください');
  });

  test('スクレイピングの実行', async () => {
    // モックレスポンスの設定
    const mockResponse = {
      session_id: "test-session-id",
      results: [
        {
          url: "http://example.com/page1",
          status: "success",
          mode: "title_date_participant",
          data: "Title: テストタイトル\ndate: 2025-08-10\nParticipant: テスト参加者",
          error_message: null,
          timestamp: "2025-08-10T12:00:00"
        },
        {
          url: "http://example.com/page2",
          status: "success",
          mode: "chat_entries",
          data: "ユーザー1: こんにちは\nユーザー2: よろしくお願いします",
          error_message: null,
          timestamp: "2025-08-10T12:00:00"
        }
      ],
      combined_data: "=== http://example.com/page1 ===\nTitle: テストタイトル\ndate: 2025-08-10\nParticipant: テスト参加者\n\n=== http://example.com/page2 ===\nユーザー1: こんにちは\nユーザー2: よろしくお願いします",
      structured_data: {
        title: "テストタイトル",
        date: "2025-08-10",
        participant: "テスト参加者",
        transcript: "ユーザー1: こんにちは\nユーザー2: よろしくお願いします"
      },
      formatted_output: "<タイトル>\nテストタイトル\n</タイトル>\n<日付>\n2025-08-10\n</日付>\n<参加者>\nテスト参加者\n</参加者>\n<トランスクリプト>\nユーザー1: こんにちは\nユーザー2: よろしくお願いします\n</トランスクリプト>",
      total_processing_time: 5.5
    };

    mockExecuteScraping.mockResolvedValue(mockResponse);

    render(<ScrapingPage />);
    
    // フォームに入力
    await userEvent.type(screen.getByLabelText(/URL1: タイトル・日時・参加者を取得/), 'http://example.com/page1');
    await userEvent.type(screen.getByLabelText(/URL2: チャットエントリーを取得/), 'http://example.com/page2');
    await userEvent.type(screen.getByLabelText(/ログインURL/), 'http://example.com/login');
    await userEvent.type(screen.getByLabelText(/ユーザー名/), 'testuser');
    await userEvent.type(screen.getByLabelText(/パスワード/), 'testpass');
    
    // 送信
    const submitButton = screen.getByRole('button', { name: /スクレイピング開始/ });
    await userEvent.click(submitButton);
    
    // APIが呼ばれることを確認
    await waitFor(() => {
      expect(mockExecuteScraping).toHaveBeenCalledWith({
        credentials: {
          username: 'testuser',
          password: 'testpass',
          login_url: 'http://example.com/login'
        },
        url_configs: [
          {
            url: 'http://example.com/page1',
            mode: 'title_date_participant'
          },
          {
            url: 'http://example.com/page2',
            mode: 'chat_entries'
          }
        ]
      });
    });
    
    // 結果が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('スクレイピング完了！')).toBeInTheDocument();
      expect(screen.getByText('テストタイトル')).toBeInTheDocument();
      expect(screen.getByText('2025-08-10')).toBeInTheDocument();
      expect(screen.getByText('テスト参加者')).toBeInTheDocument();
    });
  });

  test('エラー時の表示', async () => {
    // エラーレスポンスの設定
    const mockErrorResponse = {
      session_id: "error-session-id",
      results: [
        {
          url: "http://example.com/page1",
          status: "error",
          mode: "title_date_participant",
          data: "ページの読み込みに失敗しました",
          error_message: "ページの読み込みに失敗しました",
          timestamp: "2025-08-10T12:00:00"
        }
      ],
      combined_data: "=== http://example.com/page1 ===\nページの読み込みに失敗しました",
      structured_data: {
        title: null,
        date: null,
        participant: null,
        transcript: null
      },
      formatted_output: "",
      total_processing_time: 2.0
    };

    mockExecuteScraping.mockResolvedValue(mockErrorResponse);

    render(<ScrapingPage />);
    
    // フォームに入力
    await userEvent.type(screen.getByLabelText(/URL1: タイトル・日時・参加者を取得/), 'http://example.com/page1');
    await userEvent.type(screen.getByLabelText(/URL2: チャットエントリーを取得/), 'http://example.com/page2');
    await userEvent.type(screen.getByLabelText(/ログインURL/), 'http://example.com/login');
    await userEvent.type(screen.getByLabelText(/ユーザー名/), 'testuser');
    await userEvent.type(screen.getByLabelText(/パスワード/), 'testpass');
    
    // 送信
    const submitButton = screen.getByRole('button', { name: /スクレイピング開始/ });
    await userEvent.click(submitButton);
    
    // エラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('ページの読み込みに失敗しました')).toBeInTheDocument();
    });
  });
});
