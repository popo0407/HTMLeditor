/**
 * API通信サービス
 * 
 * 開発憲章の「設定とロジックを分離」原則に従い、
 * 設定ファイルベースのシンプルなメール送信を実装
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

// セッションID管理
class SessionManager {
  private static sessionId: string | null = null;

  static getSessionId(): string {
    if (!this.sessionId) {
      // クッキーからセッションIDを取得を試行
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
      if (sessionCookie) {
        this.sessionId = sessionCookie.split('=')[1];
      } else {
        // 新しいセッションIDを生成
        this.sessionId = this.generateSessionId();
      }
    }
    return this.sessionId;
  }

  private static generateSessionId(): string {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    }) + '-' + Date.now();
  }

  static setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }
}

export interface MailSendRequest {
  subject: string;
  recipient_email?: string;
  html_content: string;
}

export interface PdfExportRequest {
  html_content?: string;
  meetingInfo?: any;
  minutesHtml?: string;
  filename?: string;
  title?: string;
}

export interface PdfMailSendRequest {
  subject: string;
  recipient_email?: string;
  meetingInfo?: any;
  minutesHtml?: string;
  // 元データ関連
  sourceDataText?: string;
  sourceDataFile?: {
    name: string;
    content: string; // base64
    mimeType: string;
  };
  // ペルソナ情報
  personaInfo?: {
    個人ペルソナ: string;
    部門ペルソナ: string;
  };
}

export interface MailSendResponse {
  success: boolean;
  message: string;
}

/**
 * HTML添付メールを送信（固定のタイトルと本文）
 */
// sendMail removed: application only sends PDF-attached emails now

/**
 * PDF添付メールを送信（固定のタイトルと本文）
 */
export const sendPdfMail = async (request: PdfMailSendRequest): Promise<MailSendResponse> => {
  try {
    const sessionId = SessionManager.getSessionId();
    const response = await fetch(`${API_BASE_URL}/mail/send-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // レスポンスヘッダーからセッションIDを更新
    const newSessionId = response.headers.get('X-Session-ID');
    if (newSessionId) {
      SessionManager.setSessionId(newSessionId);
    }

    return await response.json();
  } catch (error) {
    console.error('PDFメール送信エラー:', error);
    throw error;
  }
};

/**
 * PDF出力APIを呼び出し
 */
export const exportToPdf = async (request: PdfExportRequest): Promise<Blob> => {
  try {
    const sessionId = SessionManager.getSessionId();
    const response = await fetch(`${API_BASE_URL}/pdf/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // レスポンスヘッダーからセッションIDを更新
    const newSessionId = response.headers.get('X-Session-ID');
    if (newSessionId) {
      SessionManager.setSessionId(newSessionId);
    }

    return await response.blob();
  } catch (error) {
    console.error('PDF出力エラー:', error);
    throw error;
  }
};

/**
 * APIサービスオブジェクト
 */
export const apiService = {
  sendPdfMail,
  exportToPdf,
  SessionManager,
  post: async (endpoint: string, data: any) => {
    const sessionId = SessionManager.getSessionId();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // レスポンスヘッダーからセッションIDを更新
    const newSessionId = response.headers.get('X-Session-ID');
    if (newSessionId) {
      SessionManager.setSessionId(newSessionId);
    }

    return await response.json();
  },
};
