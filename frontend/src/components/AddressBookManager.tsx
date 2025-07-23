/**
 * アドレス帳管理コンポーネント
 * 
 * 責務:
 * - 共通IDの管理
 * - 連絡先の追加・編集・削除
 * - アドレス帳の表示
 */

import React, { useState, useEffect } from 'react';
import { Contact, CommonID } from '../types';
import { apiService } from '../services/apiService';
import './AddressBookManager.css';

interface AddressBookManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCommonId?: string | null;
  onCommonIdChange: (commonId: string) => void;
}

export const AddressBookManager: React.FC<AddressBookManagerProps> = ({
  isOpen,
  onClose,
  currentCommonId,
  onCommonIdChange
}) => {
  const [commonId, setCommonId] = useState(currentCommonId || '');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 共通IDが変更された時に連絡先を取得
  useEffect(() => {
    if (currentCommonId) {
      loadContacts(currentCommonId);
    }
  }, [currentCommonId]);

  const loadContacts = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const contactList = await apiService.getContacts(id);
      setContacts(contactList);
    } catch (error) {
      console.error('連絡先取得エラー:', error);
      setError('連絡先の取得に失敗しました');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommonIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonId.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // 共通IDの存在確認
      const validation = await apiService.validateAddressBook({ common_id: commonId });
      
      if (!validation.exists) {
        // eslint-disable-next-line no-restricted-globals
        const create = confirm(`共通ID "${commonId}" のアドレス帳が存在しません。新しく作成しますか？`);
        if (!create) return;
        
        await apiService.createAddressBook(commonId);
        setContacts([]);
      } else {
        setContacts(validation.contacts);
      }

      onCommonIdChange(commonId);
    } catch (error) {
      console.error('共通ID確認エラー:', error);
      setError('共通IDの確認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.email.trim() || !currentCommonId) return;

    try {
      setLoading(true);
      setError(null);

      const contact = await apiService.addContact(currentCommonId, {
        name: newContact.name,
        email: newContact.email
      });

      setContacts(prev => [...prev, contact]);
      setNewContact({ name: '', email: '' });
    } catch (error) {
      console.error('連絡先追加エラー:', error);
      setError('連絡先の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="address-book-overlay">
      <div className="address-book-modal">
        <div className="modal-header">
          <h2>アドレス帳管理</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 共通ID設定セクション */}
          <div className="section">
            <h3>共通ID設定</h3>
            <form onSubmit={handleCommonIdSubmit} className="common-id-form">
              <input
                type="text"
                value={commonId}
                onChange={(e) => setCommonId(e.target.value)}
                placeholder="共通IDを入力（例: 営業部、開発チーム）"
                className="input-field"
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '確認中...' : '確認・設定'}
              </button>
            </form>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 現在の共通ID表示 */}
          {currentCommonId && (
            <div className="section">
              <h3>現在のアドレス帳: {currentCommonId}</h3>
              
              {/* 連絡先追加フォーム */}
              <form onSubmit={handleAddContact} className="contact-form">
                <div className="form-row">
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="名前"
                    className="input-field"
                  />
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="メールアドレス"
                    className="input-field"
                  />
                  <button type="submit" className="btn btn-secondary" disabled={loading}>
                    追加
                  </button>
                </div>
              </form>

              {/* 連絡先リスト */}
              <div className="contacts-list">
                <h4>連絡先一覧 ({contacts.length}件)</h4>
                {loading ? (
                  <div className="loading">読み込み中...</div>
                ) : contacts.length === 0 ? (
                  <div className="no-contacts">連絡先がありません</div>
                ) : (
                  <div className="contact-items">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="contact-item">
                        <div className="contact-info">
                          <span className="contact-name">{contact.name}</span>
                          <span className="contact-email">{contact.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
