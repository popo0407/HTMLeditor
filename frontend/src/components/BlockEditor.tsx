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

import React from 'react';
import { Block, BlockType, BlockStyle } from '../types';
import {
  HeadingBlock,
  ParagraphBlock,
  BulletListBlock,
  HorizontalRuleBlock,
  ImageBlock,
  TableBlock
} from './blocks';
import './BlockEditor.css';

interface BlockEditorProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string) => void;
  onBlockUpdate: (blockId: string, content: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockAdd: (blockType: BlockType, insertAfter?: string) => void;
  onBlockMove: (blockId: string, direction: 'up' | 'down') => void;
  onBlockStyleChange: (blockId: string, style: BlockStyle) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
  onBlockMove,
  onBlockStyleChange,
}) => {
  // ブロックタイプに応じたコンポーネントを返す
  const renderBlock = (block: Block, index: number) => {
    const commonProps = {
      block,
      isSelected: selectedBlockId === block.id,
      onSelect: onBlockSelect,
      onUpdate: onBlockUpdate,
      onDelete: onBlockDelete,
      onStyleChange: onBlockStyleChange,
      onMoveUp: index > 0 ? () => onBlockMove(block.id, 'up') : undefined,
      onMoveDown: index < blocks.length - 1 ? () => onBlockMove(block.id, 'down') : undefined,
    };

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return <HeadingBlock key={block.id} {...commonProps} />;
      
      case 'paragraph':
        return <ParagraphBlock key={block.id} {...commonProps} />;
      
      case 'bulletList':
        return <BulletListBlock key={block.id} {...commonProps} />;
      
      case 'horizontalRule':
        return <HorizontalRuleBlock key={block.id} {...commonProps} />;
      
      case 'image':
        return <ImageBlock key={block.id} {...commonProps} />;
      
      case 'table':
        return <TableBlock key={block.id} {...commonProps} />;
      
      default:
        return <ParagraphBlock key={block.id} {...commonProps} />;
    }
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
    <div className="block-editor">
      <div className="editor-content">
        {blocks.length === 0 ? (
          renderEmptyState()
        ) : (
          blocks.map((block, index) => renderBlock(block, index))
        )}
      </div>
    </div>
  );
};
