import React, { useState, useEffect } from 'react';

// アドレス帳関連の型定義（インライン定義）
interface AddressBook {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface AddressBookEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateAddressBookRequest {
  name: string;
  description?: string;
}

interface UpdateAddressBookRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
}

// 簡単なAPIサービス（仮実装）
const addressBookService = {
  async getAddressBooks(): Promise<AddressBook[]> {
    // 仮実装
    return [];
  },
  async getAddressBookEntries(bookId: string): Promise<AddressBookEntry[]> {
    // 仮実装
    return [];
  },
  async createAddressBook(request: CreateAddressBookRequest): Promise<AddressBook> {
    // 仮実装
    return {} as AddressBook;
  },
  async createAddressBookEntry(bookId: string, entry: AddressBookEntry): Promise<AddressBookEntry> {
    // 仮実装
    return {} as AddressBookEntry;
  },
  async updateAddressBookEntry(bookId: string, entryId: string, request: UpdateAddressBookRequest): Promise<AddressBookEntry> {
    // 仮実装
    return {} as AddressBookEntry;
  },
  async deleteAddressBookEntry(bookId: string, entryId: string): Promise<void> {
    // 仮実装
  }
};

interface AddressBookManagerProps {
  onEntrySelect: (entry: AddressBookEntry | null) => void;
}

const AddressBookManager: React.FC<AddressBookManagerProps> = ({ onEntrySelect }) => {
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AddressBookEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [newBook, setNewBook] = useState({
    name: '',
    description: ''
  });
  
  const [editingEntry, setEditingEntry] = useState<Partial<AddressBookEntry>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    notes: ''
  });

  // アドレス帳一覧の読み込み
  useEffect(() => {
    loadAddressBooks();
  }, []);

  // 選択されたアドレス帳のエントリ読み込み
  useEffect(() => {
    if (selectedBookId) {
      loadEntries(selectedBookId);
    } else {
      setEntries([]);
    }
  }, [selectedBookId]);

  const loadAddressBooks = async () => {
    try {
      const books = await addressBookService.getAddressBooks();
      setAddressBooks(books);
      setError('');
    } catch (err) {
      setError('アドレス帳の読み込みに失敗しました');
      console.error(err);
    }
  };

  const loadEntries = async (bookId: string) => {
    try {
      const entriesData = await addressBookService.getAddressBookEntries(bookId);
      setEntries(entriesData);
      setError('');
    } catch (err) {
      setError('エントリの読み込みに失敗しました');
      console.error(err);
    }
  };

  const handleCreateBook = async () => {
    try {
      const request: CreateAddressBookRequest = {
        name: newBook.name,
        description: newBook.description
      };
      await addressBookService.createAddressBook(request);
      setNewBook({ name: '', description: '' });
      setIsCreatingBook(false);
      await loadAddressBooks();
      setError('');
    } catch (err) {
      setError('アドレス帳の作成に失敗しました');
      console.error(err);
    }
  };

  const handleCreateEntry = async () => {
    if (!selectedBookId) return;
    
    try {
      await addressBookService.createAddressBookEntry(selectedBookId, editingEntry as AddressBookEntry);
      setEditingEntry({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        notes: ''
      });
      setIsCreating(false);
      await loadEntries(selectedBookId);
      setError('');
    } catch (err) {
      setError('エントリの作成に失敗しました');
      console.error(err);
    }
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry || !selectedBookId) return;
    
    try {
      const request: UpdateAddressBookRequest = {
        name: editingEntry.name || '',
        email: editingEntry.email || '',
        phone: editingEntry.phone || '',
        company: editingEntry.company || '',
        position: editingEntry.position || '',
        notes: editingEntry.notes || ''
      };
      await addressBookService.updateAddressBookEntry(selectedBookId, selectedEntry.id, request);
      setIsEditing(false);
      setSelectedEntry(null);
      await loadEntries(selectedBookId);
      setError('');
    } catch (err) {
      setError('エントリの更新に失敗しました');
      console.error(err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedBookId) return;
    
    if (!window.confirm('このエントリを削除しますか？')) return;
    
    try {
      await addressBookService.deleteAddressBookEntry(selectedBookId, entryId);
      await loadEntries(selectedBookId);
      setError('');
    } catch (err) {
      setError('エントリの削除に失敗しました');
      console.error(err);
    }
  };

  const startEdit = (entry: AddressBookEntry) => {
    setSelectedEntry(entry);
    setEditingEntry({ ...entry });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setIsCreatingBook(false);
    setSelectedEntry(null);
    setEditingEntry({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      notes: ''
    });
  };

  const selectEntry = (entry: AddressBookEntry) => {
    onEntrySelect(entry);
  };

  return (
    <div className="address-book-manager">
      <div className="address-book-header">
        <h2>アドレス帳管理</h2>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* アドレス帳選択 */}
      <div className="address-book-selection">
        <label htmlFor="book-select">アドレス帳を選択</label>
        <div className="book-select-container">
          <select
            id="book-select"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="book-select"
          >
            <option value="">アドレス帳を選択してください</option>
            {addressBooks.map(book => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreatingBook(true)}
            className="create-book-button"
          >
            ＋ 新規作成
          </button>
        </div>
      </div>

      {/* アドレス帳作成フォーム */}
      {isCreatingBook && (
        <div className="create-book-form">
          <h3>新しいアドレス帳の作成</h3>
          <div className="form-group">
            <label htmlFor="book-name">アドレス帳名</label>
            <input
              id="book-name"
              type="text"
              value={newBook.name}
              onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
              placeholder="アドレス帳名を入力"
            />
          </div>
          <div className="form-group">
            <label htmlFor="book-description">説明</label>
            <textarea
              id="book-description"
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              placeholder="説明を入力（任意）"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button onClick={handleCreateBook} className="save-button">
              ✓ 作成
            </button>
            <button onClick={cancelEdit} className="cancel-button">
              ✕ キャンセル
            </button>
          </div>
        </div>
      )}

      {/* エントリ一覧 */}
      {selectedBookId && (
        <div className="entries-section">
          <div className="entries-header">
            <h3>エントリ一覧</h3>
            <button
              onClick={() => setIsCreating(true)}
              className="create-entry-button"
            >
              ＋ 新規エントリ
            </button>
          </div>

          {/* エントリ作成/編集フォーム */}
          {(isCreating || isEditing) && (
            <div className="entry-form">
              <h4>{isCreating ? '新規エントリの作成' : 'エントリの編集'}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="entry-name">名前</label>
                  <input
                    id="entry-name"
                    type="text"
                    value={editingEntry.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                    placeholder="名前"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="entry-email">メールアドレス</label>
                  <input
                    id="entry-email"
                    type="email"
                    value={editingEntry.email || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({ ...editingEntry, email: e.target.value })}
                    placeholder="メールアドレス"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="entry-phone">電話番号</label>
                  <input
                    id="entry-phone"
                    type="text"
                    value={editingEntry.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({ ...editingEntry, phone: e.target.value })}
                    placeholder="電話番号"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="entry-company">会社名</label>
                  <input
                    id="entry-company"
                    type="text"
                    value={editingEntry.company || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({ ...editingEntry, company: e.target.value })}
                    placeholder="会社名"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="entry-position">役職</label>
                  <input
                    id="entry-position"
                    type="text"
                    value={editingEntry.position || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEntry({ ...editingEntry, position: e.target.value })}
                    placeholder="役職"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor="entry-notes">備考</label>
                  <textarea
                    id="entry-notes"
                    value={editingEntry.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                    placeholder="備考"
                    rows={3}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  onClick={isCreating ? handleCreateEntry : handleUpdateEntry}
                  className="save-button"
                >
                  ✓ {isCreating ? '作成' : '更新'}
                </button>
                <button onClick={cancelEdit} className="cancel-button">
                  ✕ キャンセル
                </button>
              </div>
            </div>
          )}

          {/* エントリリスト */}
          <div className="entries-list">
            {entries.length === 0 ? (
              <p className="no-entries">エントリがありません</p>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-info">
                    <h4>{entry.name}</h4>
                    <p>{entry.email}</p>
                    {entry.company && <p>{entry.company}</p>}
                  </div>
                  <div className="entry-actions">
                    <button
                      onClick={() => selectEntry(entry)}
                      className="select-button"
                    >
                      選択
                    </button>
                    <button
                      onClick={() => startEdit(entry)}
                      className="edit-button"
                    >
                      ✏ 編集
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="delete-button"
                    >
                      🗑 削除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { AddressBookManager };