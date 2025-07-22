/**
 * 水平線ブロックコンポーネント
 * 
 * 責務:
 * - 水平線の表示
 * - スタイル設定（将来拡張用）
 */

import React from 'react';
import { Block } from '../../types';
import { BlockBase } from './BlockBase';

interface HorizontalRuleBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const HorizontalRuleBlock: React.FC<HorizontalRuleBlockProps> = (props) => {
  return (
    <BlockBase {...props}>
      <hr className="block-horizontal-rule" />
    </BlockBase>
  );
};
