/**
 * API通信サービス
 * 
 * 開発憲章の「設定とロジックを分離」原則に従い、
 * 設定ファイルベースのシンプルなメール送信を実装
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

export interface MailSendRequest {
  subject: string;
  recipient_email?: string;
  html_content: string;
}

export interface PdfMailSendRequest {
  subject: string;
  recipient_email?: string;
  html_content: string;
}

export interface MailSendResponse {
  success: boolean;
  message: string;
}

export interface EmailTemplatesResponse {
  default_recipient: string;
  subject_templates: string[];
  default_subject: string;
  body_templates: string[];
}

/**
 * HTML添付メールを送信（固定のタイトルと本文）
 */
export const sendMail = async (request: MailSendRequest): Promise<MailSendResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('HTMLメール送信エラー:', error);
    throw error;
  }
};

/**
 * PDF添付メールを送信（固定のタイトルと本文）
 */
export const sendPdfMail = async (request: PdfMailSendRequest): Promise<MailSendResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mail/send-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PDFメール送信エラー:', error);
    throw error;
  }
};

/**
 * APIサービスオブジェクト
 */
export const apiService = {
  sendMail,
  sendPdfMail,
};
