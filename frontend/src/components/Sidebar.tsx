/**
 * サイドバーコンポーネント
 * 
 * 責務:
 * - ブロック挿入ボタン
 * - アドレス帳操作UI
 * - メール送信ボタン
 */

import React, { useState } from 'react';
import { BlockType } from '../types';
import './Sidebar.css';

interface SidebarProps {
  onAddBlock: (blockType: BlockType) => void;
  onImportFromClipboard: () => void;
  onImportFromText: (htmlText: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAddBlock,
  onImportFromClipboard,
  onImportFromText
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [htmlText, setHtmlText] = useState('');

  const blockTypes: { type: BlockType; label: string }[] = [
    { type: 'heading1', label: '大見出し' },
    { type: 'heading2', label: '中見出し' },
    { type: 'heading3', label: '小見出し' },
    { type: 'paragraph', label: '段落' },
    { type: 'image', label: '画像' },
    { type: 'table', label: 'テーブル' },
    { type: 'calendar', label: 'カレンダー' },
    { type: 'horizontalRule', label: '水平線' },
  ];

  const handleImportFromText = () => {
    if (htmlText.trim()) {
      onImportFromText(htmlText);
      setHtmlText('');
      setShowTextInput(false);
    }
  };

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

        <button 
          className="btn btn-secondary sidebar-button"
          onClick={() => setShowTextInput(!showTextInput)}
        >
          📝 テキストから読み込み
        </button>

        {showTextInput && (
          <div className="text-input-section">
            <textarea
              className="html-textarea"
              placeholder="HTMLテキストをここに貼り付けてください..."
              value={htmlText}
              onChange={(e) => setHtmlText(e.target.value)}
              rows={10}
            />
            <div className="text-input-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleImportFromText}
                disabled={!htmlText.trim()}
              >
                📥 読み込み
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setHtmlText('');
                  setShowTextInput(false);
                }}
              >
                ❌ キャンセル
              </button>
            </div>
          </div>
        )}
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


    </div>
  );
};
