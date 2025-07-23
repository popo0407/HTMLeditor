/**
 * サイドバーコンポーネント
 * 
 * 責務:
 * - ブロック挿入ボタン
 * - アドレス帳操作UI
 * - メール送信ボタン
 */

import React from 'react';
import { BlockType } from '../types';
import './Sidebar.css';

interface SidebarProps {
  onAddBlock: (blockType: BlockType) => void;
  onImportFromClipboard: () => void;
  onSendMail: () => void;
  onManageAddressBook: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAddBlock,
  onImportFromClipboard,
  onSendMail,
  onManageAddressBook
}) => {
  const blockTypes: { type: BlockType; label: string }[] = [
    { type: 'heading1', label: '大見出し' },
    { type: 'heading2', label: '中見出し' },
    { type: 'heading3', label: '小見出し' },
    { type: 'paragraph', label: '段落' },
    { type: 'bulletList', label: '箇条書き' },
    { type: 'image', label: '画像' },
    { type: 'table', label: 'テーブル' },
    { type: 'horizontalRule', label: '水平線' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">コンテンツ</h3>
        
        <button 
          className="btn btn-primary sidebar-button"
          onClick={onImportFromClipboard}
        >
          📋 クリップボードから読み込み
        </button>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">ブロックを追加</h3>
        
        <div className="block-buttons">
          {blockTypes.map(({ type, label }) => (
            <button
              key={type}
              className="btn sidebar-button"
              onClick={() => onAddBlock(type)}
            >
              ➕ {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">メール送信</h3>
        
        <button 
          className="btn btn-primary sidebar-button"
          onClick={onManageAddressBook}
        >
          📝 アドレス帳管理
        </button>
        
        <button 
          className="btn btn-primary sidebar-button"
          onClick={onSendMail}
        >
          📧 メール送信
        </button>
      </div>
    </div>
  );
};
