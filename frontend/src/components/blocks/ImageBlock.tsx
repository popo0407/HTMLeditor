/**
 * 画像ブロックコンポーネント（基本版）
 * 
 * 責務:
 * - 画像の表示
 * - 画像アップロード機能（フェーズ3で拡張予定）
 */

import React from 'react';
import { Block } from '../../types';
import { BlockBase } from './BlockBase';

interface ImageBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = (props) => {
  const { block } = props;

  return (
    <BlockBase {...props}>
      <div className="block-image">
        {block.src ? (
          <img 
            src={block.src} 
            alt={block.content || 'Image'} 
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        ) : (
          <div className="image-placeholder">
            <p>📷 画像ブロック</p>
            <p>フェーズ3で画像アップロード機能を実装予定</p>
          </div>
        )}
      </div>
    </BlockBase>
  );
};
