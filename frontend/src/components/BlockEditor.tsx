/**
 * ブロックエディタのメインコンポーネント
 * 
 * 責務:
 * - ブロックリストの管理と描画
 * - ブロック操作（追加・編集・削除・移動）の統括
 * - クリップボード読み込み機能
 * 
 * 開発憲章の「単一責任の原則」に従い、ブロック管理のみに特化
 */

import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockType, BlockStyle } from '../types';
import {
  HeadingBlock,
  ParagraphBlock,
  HorizontalRuleBlock,
  ImageBlock,
  TableBlock,
  CalendarBlock
} from './blocks';
import './BlockEditor.css';

interface BlockEditorProps {
  blocks: Block[];
  focusedBlockId: string | null;
  onBlockFocus: (blockId: string) => void;
  onBlockUpdate: (blockId: string, content: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockAdd: (blockType: BlockType, insertAfter?: string) => void;
  onBlockMove: (blockId: string, direction: 'up' | 'down') => void;
  onBlockStyleChange: (blockId: string, style: BlockStyle) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  focusedBlockId,
  onBlockFocus,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
  onBlockMove,
  onBlockStyleChange,
}) => {
  // エディタクリック時の処理
  const handleEditorClick = (event: React.MouseEvent) => {
    // クリックされた要素がブロック内でない場合
    const target = event.target as HTMLElement;
    if (!target.closest('.block-content')) {
      // 最も近いブロックにフォーカス
      const clickPosition = { x: event.clientX, y: event.clientY };
      // 仮実装：最初のブロックにフォーカス
      if (blocks.length > 0) {
        onBlockFocus(blocks[0].id);
      }
    }
  };

  // ブロックタイプに応じたコンポーネントを返す
  const renderBlock = (block: Block, index: number) => {
    const commonProps = {
      block,
      isSelected: focusedBlockId === block.id, // 正しいフォーカス状態
      onSelect: onBlockFocus,
      onUpdate: onBlockUpdate,
      onDelete: onBlockDelete,
      onStyleChange: onBlockStyleChange,
      onMoveUp: index > 0 ? () => onBlockFocus(blocks[index - 1].id) : undefined,
      onMoveDown: index < blocks.length - 1 ? () => onBlockFocus(blocks[index + 1].id) : undefined,
    };

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return <HeadingBlock key={block.id} {...commonProps} />;
      
      case 'paragraph':
        return <ParagraphBlock key={block.id} {...commonProps} />;
      
      case 'horizontalRule':
        return <HorizontalRuleBlock key={block.id} {...commonProps} />;
      
      case 'image':
        return <ImageBlock key={block.id} {...commonProps} />;
      
      case 'table':
        return <TableBlock key={block.id} {...commonProps} />;
      
      case 'calendar':
        return <CalendarBlock key={block.id} {...commonProps} />;
      
      default:
        return <ParagraphBlock key={block.id} {...commonProps} />;
    }
  };

  // ブロック間挿入ボタンコンポーネント
  const BlockInsertButton: React.FC<{ insertAfter?: string; index: number }> = ({ insertAfter, index }) => {
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const blockTypes: { type: BlockType; label: string; icon: string }[] = [
      { type: 'heading1', label: '大見出し', icon: '📝' },
      { type: 'heading2', label: '中見出し', icon: '📝' },
      { type: 'heading3', label: '小見出し', icon: '📝' },
      { type: 'paragraph', label: '段落', icon: '📄' },
      { type: 'image', label: '画像', icon: '🖼️' },
      { type: 'table', label: 'テーブル', icon: '📊' },
      { type: 'calendar', label: 'カレンダー', icon: '📅' },
      { type: 'horizontalRule', label: '水平線', icon: '➖' },
    ];

    // ウィンドウ外クリックでドロップダウンを閉じる
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowMenu(false);
        }
      };

      if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showMenu]);

    const handleInsert = (blockType: BlockType) => {
      onBlockAdd(blockType, insertAfter);
      setShowMenu(false);
    };

    const handleButtonClick = () => {
      setShowMenu(!showMenu);
    };

    return (
      <div 
        className="block-insert-section"
        ref={dropdownRef}
      >
        <div className="block-insert-line">
          <button 
            className="block-insert-button"
            onClick={handleButtonClick}
          >
            ➕
          </button>
        </div>
        {showMenu && (
          <div className="block-insert-dropdown">
            {blockTypes.map(({ type, label, icon }) => (
              <button
                key={type}
                className="block-insert-option"
                onClick={() => handleInsert(type)}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 空の状態の表示
  const renderEmptyState = () => (
    <div className="editor-empty-state">
      <div className="empty-state-content">
        <h3>コンテンツを作成しましょう</h3>
        <p>サイドバーからブロックを追加するか、クリップボードからHTMLを読み込んでください。</p>
        <div className="empty-state-actions">
          <button 
            className="btn btn-primary"
            onClick={() => onBlockAdd('paragraph')}
          >
            ➕ 段落を追加
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="block-editor" onClick={handleEditorClick}>
      <div className="editor-content">
        {blocks.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {blocks.map((block, index) => (
              <React.Fragment key={`${block.id}-fragment`}>
                {renderBlock(block, index)}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
