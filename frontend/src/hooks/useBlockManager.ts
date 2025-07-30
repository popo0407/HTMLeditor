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
  focusedBlockId: string | null;
  addBlock: (blockType: BlockType, insertAfter?: string) => string;
  updateBlock: (blockId: string, content: string) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  focusBlock: (blockId: string | null) => void;
  changeBlockStyle: (blockId: string, style: BlockStyle) => void;
  setBlocks: (blocks: Block[]) => void;
  // キーボードナビゲーション用の追加機能
  navigateToNextBlock: () => void;
  navigateToPreviousBlock: () => void;
  createNewParagraph: () => void;
  selectAllInBlock: (blockId: string) => void;
  changeBlockType: (blockId: string, newType: BlockType) => void;
  getCurrentBlockIndex: () => number;
  // カーソル管理機能
  focusBlockWithCursor: (blockId: string) => void;
  focusNearestBlock: (clickPosition: { x: number; y: number }) => void;
  focusNextBlockAfterDelete: (deletedBlockId: string) => void;
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
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  /**
   * ブロックを追加
   */
  const addBlock = useCallback((blockType: BlockType, insertAfter?: string): string => {
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

    setFocusedBlockId(newBlock.id);
    return newBlock.id; // 新しく作成されたブロックのIDを返す
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

    setFocusedBlockId(prev => prev === blockId ? null : prev);
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
   * ブロックをフォーカス
   */
  const focusBlock = useCallback((blockId: string | null) => {
    setFocusedBlockId(blockId);
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

  /**
   * 次のブロックに移動
   */
  const navigateToNextBlock = useCallback(() => {
    if (!focusedBlockId) {
      // フォーカスされていない場合は最初のブロックをフォーカス
      if (blocks.length > 0) {
        setFocusedBlockId(blocks[0].id);
      }
      return;
    }

    const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
    if (currentIndex < blocks.length - 1) {
      setFocusedBlockId(blocks[currentIndex + 1].id);
    }
  }, [blocks, focusedBlockId]);

  /**
   * 前のブロックに移動
   */
  const navigateToPreviousBlock = useCallback(() => {
    if (!focusedBlockId) {
      // フォーカスされていない場合は最後のブロックをフォーカス
      if (blocks.length > 0) {
        setFocusedBlockId(blocks[blocks.length - 1].id);
      }
      return;
    }

    const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
    if (currentIndex > 0) {
      setFocusedBlockId(blocks[currentIndex - 1].id);
    }
  }, [blocks, focusedBlockId]);

  /**
   * 新しい段落を作成
   */
  const createNewParagraph = useCallback(() => {
    if (focusedBlockId) {
      // 現在フォーカスされているブロックの後に新しい段落を追加
      addBlock('paragraph', focusedBlockId);
    } else {
      // フォーカスされていない場合は最後に追加
      addBlock('paragraph');
    }
  }, [focusedBlockId, addBlock]);

  /**
   * ブロック内の全選択（プレースホルダー）
   */
  const selectAllInBlock = useCallback((blockId: string) => {
    // この機能は後で実装（DOM操作が必要）
    console.log('ブロック内全選択:', blockId);
  }, []);

  /**
   * ブロックタイプを変更
   */
  const changeBlockType = useCallback((blockId: string, newType: BlockType) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId
          ? { ...block, type: newType, content: getDefaultContent(newType) }
          : block
      )
    );
  }, []);

  /**
   * 現在のブロックインデックスを取得
   */
  const getCurrentBlockIndex = useCallback(() => {
    if (!focusedBlockId) return -1;
    return blocks.findIndex(b => b.id === focusedBlockId);
  }, [blocks, focusedBlockId]);

  /**
   * ブロックにフォーカスしてカーソルを移動
   */
  const focusBlockWithCursor = useCallback((blockId: string) => {
    setFocusedBlockId(blockId);
    
    // DOM操作でカーソルを移動
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockElement) {
        const textarea = blockElement.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        }
      }
    }, 10);
  }, []);

  /**
   * クリック位置に最も近いブロックにフォーカス
   */
  const focusNearestBlock = useCallback((clickPosition: { x: number; y: number }) => {
    // 最も近いブロックを計算（後で実装）
    if (blocks.length > 0) {
      // 仮実装：最初のブロックにフォーカス
      setFocusedBlockId(blocks[0].id);
    }
  }, [blocks]);

  /**
   * ブロック削除後の次のブロックにフォーカス
   */
  const focusNextBlockAfterDelete = useCallback((deletedBlockId: string) => {
    const deletedIndex = blocks.findIndex(b => b.id === deletedBlockId);
    if (deletedIndex === -1) return;

    // 削除されたブロックの前後のブロックのいずれかにフォーカス
    if (deletedIndex > 0) {
      // 前のブロックにフォーカス
      setFocusedBlockId(blocks[deletedIndex - 1].id);
    } else if (deletedIndex < blocks.length - 1) {
      // 次のブロックにフォーカス
      setFocusedBlockId(blocks[deletedIndex + 1].id);
    } else {
      // 最後のブロックが削除された場合、フォーカスをクリア
      setFocusedBlockId(null);
    }
  }, [blocks]);

  return {
    blocks,
    focusedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    focusBlock,
    changeBlockStyle,
    setBlocks,
    navigateToNextBlock,
    navigateToPreviousBlock,
    createNewParagraph,
    selectAllInBlock,
    changeBlockType,
    getCurrentBlockIndex,
    focusBlockWithCursor,
    focusNearestBlock,
    focusNextBlockAfterDelete,
  };
}; 