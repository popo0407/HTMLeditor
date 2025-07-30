/**
 * ブロック管理カスタムフック
 * 
 * 責務:
 * - ブロックの状態管理
 * - ブロックの操作（追加、更新、削除、移動）
 * - ブロック選択状態の管理
 * 
 * 開発憲章の「関心の分離」と「単一責任の原則」に従う
 */

import { useState, useCallback } from 'react';
import { Block, BlockType, BlockStyle } from '../types';

export interface UseBlockManagerReturn {
  blocks: Block[];
  selectedBlockId: string | null;
  addBlock: (blockType: BlockType, insertAfter?: string) => void;
  updateBlock: (blockId: string, content: string) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  selectBlock: (blockId: string | null) => void;
  changeBlockStyle: (blockId: string, style: BlockStyle) => void;
  setBlocks: (blocks: Block[]) => void;
}

/**
 * ブロックタイプに応じたデフォルトコンテンツを取得
 */
const getDefaultContent = (blockType: BlockType): string => {
  switch (blockType) {
    case 'heading1': return '大見出し';
    case 'heading2': return '中見出し';
    case 'heading3': return '小見出し';
    case 'paragraph': return '';
    case 'table': return 'テーブルセル';
    case 'horizontalRule': return '';
    case 'image': return '';
    case 'calendar': return 'カレンダー (0件のイベント)';
    default: return '';
  }
};

/**
 * ブロック管理のカスタムフック
 * 
 * 開発憲章の「単一責任の原則」に従い、
 * ブロック管理に特化した責務のみを持つ
 */
export const useBlockManager = (): UseBlockManagerReturn => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  /**
   * ブロックを追加
   */
  const addBlock = useCallback((blockType: BlockType, insertAfter?: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      content: getDefaultContent(blockType),
      ...(blockType === 'table' && {
        tableData: {
          rows: [['ヘッダー1', 'ヘッダー2'], ['セル1', 'セル2']],
          hasHeaderRow: true,
          hasHeaderColumn: false
        }
      }),
      ...(blockType === 'calendar' && {
        calendarData: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          weeks: []
        }
      })
    };

    setBlocks(prevBlocks => {
      let newBlocks;
      if (insertAfter === 'FIRST') {
        // 最初の位置に追加
        newBlocks = [newBlock, ...prevBlocks];
      } else if (insertAfter) {
        // 指定されたブロックの後に追加
        const insertIndex = prevBlocks.findIndex(b => b.id === insertAfter);
        newBlocks = [
          ...prevBlocks.slice(0, insertIndex + 1),
          newBlock,
          ...prevBlocks.slice(insertIndex + 1)
        ];
      } else {
        // 最後に追加
        newBlocks = [...prevBlocks, newBlock];
      }
      return newBlocks;
    });

    setSelectedBlockId(newBlock.id);
  }, []);

  /**
   * ブロックを更新
   */
  const updateBlock = useCallback((blockId: string, content: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => {
        if (block.id === blockId) {
          // テーブルブロック、画像ブロック、カレンダーブロックの場合、contentはJSONStringified blockデータ
          if (block.type === 'table' || block.type === 'image' || block.type === 'calendar') {
            try {
              const updatedBlock = JSON.parse(content);
              return { ...block, ...updatedBlock };
            } catch (error) {
              console.error('ブロックデータの解析に失敗しました:', error);
              return { ...block, content };
            }
          }
          return { ...block, content };
        }
        return block;
      })
    );
  }, []);

  /**
   * ブロックを削除
   */
  const deleteBlock = useCallback((blockId: string) => {
    console.log('=== ブロック削除開始 ===');
    console.log('削除対象ブロックID:', blockId);
    console.log('削除前ブロック数:', blocks.length);
    
    setBlocks(prevBlocks => {
      const newBlocks = prevBlocks.filter(block => block.id !== blockId);
      console.log('削除後ブロック数:', newBlocks.length);
      console.log('削除後ブロックID一覧:', newBlocks.map(b => b.id));
      return newBlocks;
    });

    setSelectedBlockId(prev => prev === blockId ? null : prev);
  }, [blocks.length]);

  /**
   * ブロックを移動
   */
  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks(prevBlocks => {
      const currentIndex = prevBlocks.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return prevBlocks;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prevBlocks.length) return prevBlocks;

      const newBlocks = [...prevBlocks];
      [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];

      return newBlocks;
    });
  }, []);

  /**
   * ブロックを選択
   */
  const selectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);

  /**
   * ブロックスタイルを変更
   */
  const changeBlockStyle = useCallback((blockId: string, style: BlockStyle) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? { ...block, style: style }
          : block
      )
    );
  }, []);

  return {
    blocks,
    selectedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    selectBlock,
    changeBlockStyle,
    setBlocks,
  };
}; 