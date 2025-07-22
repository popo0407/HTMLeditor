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
    const response = await fetch(`${API_BASE_URL}/address-books/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 新しいアドレス帳（共通ID）を作成
   */
  async createAddressBook(commonId: string): Promise<CommonID> {
    const response = await fetch(`${API_BASE_URL}/address-books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ common_id: commonId }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
}

// シングルトンインスタンスをエクスポート
export const apiService = new ApiService();
