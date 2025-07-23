/**
 * バックエンドAPIとの通信を担当するサービス
 * 
 * 責務:
 * - HTTPリクエストの送信
 * - レスポンスの型安全な処理
 * - エラーハンドリング
 */

import { 
  AddressBookValidationRequest, 
  AddressBookValidation, 
  ContactCreateRequest, 
  Contact,
  CommonID
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  /**
   * 共通IDの存在チェック
   */
  async validateAddressBook(request: AddressBookValidationRequest): Promise<AddressBookValidation> {
    try {
      const response = await fetch(`${API_BASE_URL}/address-books/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }

  /**
   * 新しいアドレス帳（共通ID）を作成
   */
  async createAddressBook(commonId: string): Promise<CommonID> {
    try {
      const response = await fetch(`${API_BASE_URL}/address-books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ common_id: commonId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }

  /**
   * 連絡先を追加
   */
  async addContact(commonId: string, contact: ContactCreateRequest): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/address-books/${commonId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 連絡先リストを取得
   */
  async getContacts(commonId: string): Promise<Contact[]> {
    const response = await fetch(`${API_BASE_URL}/address-books/${commonId}/contacts`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * メール送信
   */
  async sendMail(data: {
    commonId: string;
    subject: string;
    htmlContent: string;
    recipientEmails?: string;
  }): Promise<{ success: boolean; message: string; recipients: string[] }> {
    const formData = new FormData();
    formData.append('common_id', data.commonId);
    formData.append('subject', data.subject);
    formData.append('html_content', data.htmlContent);
    if (data.recipientEmails) {
      formData.append('recipient_emails', data.recipientEmails);
    }

    const response = await fetch(`${API_BASE_URL}/mail/send`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * メールサーバー接続テスト
   */
  async testMailConnection(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/mail/test-connection`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

// シングルトンインスタンスをエクスポート
export const apiService = new ApiService();
