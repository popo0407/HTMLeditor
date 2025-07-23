/**
 * 水平線ブロックコンポーネント
 * 
 * 責務:
 * - 水平線の表示
 * - スタイル設定（将来拡張用）
 */

import React from 'react';
import { CommonBlockProps } from '../../types';
import { BlockBase } from './BlockBase';

export const HorizontalRuleBlock: React.FC<CommonBlockProps> = (props) => {
  return (
    <BlockBase {...props}>
      <hr className="block-horizontal-rule" />
    </BlockBase>
  );
};
