/**
 * ブロックエディタの基底コンポーネント
 * 
 * 責務:
 * - 全ブロック共通の機能（選択、削除、ドラッグ）を提供
 * - 単一責任の原則に従い、ブロック固有の描画は子コンポーネントに委ねる
 */

import React from 'react';
import { Block, BlockStyle } from '../../types';
import './BlockBase.css';

interface BlockBaseProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onStyleChange?: (blockId: string, style: BlockStyle) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  children: React.ReactNode;
}

export const BlockBase: React.FC<BlockBaseProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onStyleChange,
  onMoveUp,
  onMoveDown,
  children
}) => {
  const handleClick = () => {
    onSelect(block.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このブロックを削除しますか？')) {
      onDelete(block.id);
    }
  };

  const handleStyleChange = (e: React.MouseEvent, style: BlockStyle) => {
    e.stopPropagation();
    onStyleChange?.(block.id, style);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveUp?.(block.id);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveDown?.(block.id);
  };

  // ブロックスタイルに応じたCSSクラスを適用
  const getBlockClasses = () => {
    let classes = `block-base ${isSelected ? 'block-selected' : ''}`;
    if (block.style && block.style !== 'normal') {
      classes += ` ${block.style}`;
    }
    return classes;
  };

  return (
    <div 
      className={getBlockClasses()}
      onClick={handleClick}
      data-block-type={block.type}
      data-block-id={block.id}
    >
      <div className="block-content">
        {children}
      </div>
      
      {isSelected && (
        <div className="block-controls">
          <div className="block-actions">
            {/* スタイル変更ボタン */}
            {onStyleChange && (
              <>
                <button 
                  className={`btn block-action-btn ${block.style === 'normal' || !block.style ? 'active' : ''}`}
                  onClick={(e) => handleStyleChange(e, 'normal')}
                  title="通常"
                >
                  📝
                </button>
                <button 
                  className={`btn block-action-btn ${block.style === 'important' ? 'active' : ''}`}
                  onClick={(e) => handleStyleChange(e, 'important')}
                  title="重要"
                >
                  ⚠️
                </button>
                <button 
                  className={`btn block-action-btn ${block.style === 'action-item' ? 'active' : ''}`}
                  onClick={(e) => handleStyleChange(e, 'action-item')}
                  title="アクション"
                >
                  ✅
                </button>
              </>
            )}
            
            {/* 移動ボタン */}
            {onMoveUp && (
              <button 
                className="btn block-action-btn" 
                onClick={handleMoveUp}
                title="上に移動"
              >
                ↑
              </button>
            )}
            {onMoveDown && (
              <button 
                className="btn block-action-btn" 
                onClick={handleMoveDown}
                title="下に移動"
              >
                ↓
              </button>
            )}
            
            {/* 削除ボタン */}
            <button 
              className="btn block-action-btn block-delete-btn" 
              onClick={handleDelete}
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
