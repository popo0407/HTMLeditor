/**
 * アドレス帳管理カスタムフック
 * 
 * 責務:
 * - アドレス帳の状態管理
 * - 共通IDの管理
 * - モーダル表示の制御
 * 
 * 開発憲章の「関心の分離」に従い、アドレス帳管理の状態をコンポーネントから分離
 */

import { useState, useRef } from 'react';
// import { AddressBookEntry } from '../services/addressBookService'; ←削除

// 以降、AddressBookEntry型やアドレス帳関連の型・ロジックも削除

export interface UseAddressBookManagerReturn {
  currentCommonId: string | null;
  setCurrentCommonId: (id: string | null) => void;
  selectedContact: any | null; // AddressBookEntry型を削除
  setSelectedContact: (contact: any | null) => void; // AddressBookEntry型を削除
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  handleContactSelect: (contact: any) => void; // AddressBookEntry型を削除
}

export const useAddressBookManager = (): UseAddressBookManagerReturn => {
  const [currentCommonId, setCurrentCommonId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<any | null>(null); // AddressBookEntry型を削除
  const [showModal, setShowModal] = useState(false);

  /**
   * 連絡先選択ハンドラー
   */
  const handleContactSelect = (contact: any) => { // AddressBookEntry型を削除
    setSelectedContact(contact);
    setShowModal(false);
  };

  return {
    currentCommonId,
    setCurrentCommonId,
    selectedContact,
    setSelectedContact,
    showModal,
    setShowModal,
    handleContactSelect
  };
}; 