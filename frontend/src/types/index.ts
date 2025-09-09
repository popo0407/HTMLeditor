/**
 * アプリケーション全体で使用する型定義
 * 
 * 開発憲章の「設定とロジックの分離」に従い、
 * 型定義を独立したファイルで管理
 */

// メール送信用の型定義
export interface MailSendRequest {
  recipient_email: string;
  subject: string;
  html_content: string;
}

