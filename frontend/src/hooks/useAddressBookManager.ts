/**
 * アドレス帳管理カスタムフック
 * 
 * 責務:
 * - アドレス帳の状態管理
 * - 共通IDの管理
 * - 連絡先の管理
 * - メール送信関連の状態管理
 * 
 * 開発憲章の「関心の分離」と「単一責任の原則」に従う
 */

import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface UseAddressBookManagerReturn {
  currentCommonId: string | null;
  contacts: any[];
  setCurrentCommonId: (commonId: string | null) => void;
  setContacts: (contacts: any[]) => void;
  validateCommonId: (commonId: string) => Promise<boolean>;
  createAddressBook: (commonId: string) => Promise<void>;
}

/**
 * アドレス帳管理のカスタムフック
 * 
 * 開発憲章の「単一責任の原則」に従い、
 * アドレス帳管理に特化した責務のみを持つ
 */
export const useAddressBookManager = (): UseAddressBookManagerReturn => {
  const [currentCommonId, setCurrentCommonId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  /**
   * 共通IDの検証
   */
  const validateCommonId = useCallback(async (commonId: string): Promise<boolean> => {
    try {
      const validation = await apiService.validateAddressBook({ common_id: commonId });
      if (validation.exists) {
        setCurrentCommonId(commonId);
        setContacts(validation.contacts || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error('共通ID確認エラー:', error);
      throw error;
    }
  }, []);

  /**
   * アドレス帳の作成
   */
  const createAddressBook = useCallback(async (commonId: string): Promise<void> => {
    try {
      await apiService.createAddressBook(commonId);
      setCurrentCommonId(commonId);
      setContacts([]);
    } catch (error) {
      console.error('アドレス帳作成エラー:', error);
      throw error;
    }
  }, []);

  return {
    currentCommonId,
    contacts,
    setCurrentCommonId,
    setContacts,
    validateCommonId,
    createAddressBook,
  };
}; 