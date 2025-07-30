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
    let classes = `block-content`;
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
      {children}
    </div>
  );
};
