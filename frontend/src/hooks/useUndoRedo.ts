/**
 * アンドゥ/リドゥ管理フック
 * 
 * 責務:
 * - ブロック操作の履歴管理
 * - アンドゥ/リドゥ操作の制御
 * - 履歴サイズの制限
 * 
 * 開発憲章の「単一責任の原則」に従い、履歴管理のみを担当
 */

import { useState, useCallback, useRef } from 'react';
import { Block } from '../types';

export interface UndoRedoState {
  blocks: Block[];
  selectedBlockId: string | null;
  timestamp: number;
}

export interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveState: (blocks: Block[], selectedBlockId: string | null) => void;
  clearHistory: () => void;
}

export const useUndoRedo = (maxHistorySize: number = 50): UseUndoRedoReturn => {
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);
  const isUndoRedoActionRef = useRef<boolean>(false);

  /**
   * 状態を保存
   */
  const saveState = useCallback((blocks: Block[], selectedBlockId: string | null) => {
    // アンドゥ/リドゥ操作中は保存しない
    if (isUndoRedoActionRef.current) {
      return;
    }

    const newState: UndoRedoState = {
      blocks: JSON.parse(JSON.stringify(blocks)), // ディープコピー
      selectedBlockId,
      timestamp: Date.now(),
    };

    setUndoStack(prev => {
      const newStack = [...prev, newState];
      // 履歴サイズを制限
      if (newStack.length > maxHistorySize) {
        return newStack.slice(-maxHistorySize);
      }
      return newStack;
    });

    // 新しい状態を保存したらリドゥスタックをクリア
    setRedoStack([]);
  }, [maxHistorySize]);

  /**
   * アンドゥ実行
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      return;
    }

    isUndoRedoActionRef.current = true;

    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];

    if (previousState) {
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, currentState]);
      
      // 状態を復元するためのコールバックを返す
      // この部分は後で実装
      console.log('Undo: 状態を復元', previousState);
    }

    isUndoRedoActionRef.current = false;
  }, [undoStack]);

  /**
   * リドゥ実行
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      return;
    }

    isUndoRedoActionRef.current = true;

    const redoState = redoStack[redoStack.length - 1];
    const currentState = undoStack[undoStack.length - 1];

    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, redoState]);

    // 状態を復元するためのコールバックを返す
    // この部分は後で実装
    console.log('Redo: 状態を復元', redoState);

    isUndoRedoActionRef.current = false;
  }, [redoStack, undoStack]);

  /**
   * 履歴クリア
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    canUndo: undoStack.length > 1, // 最初の状態は復元できない
    canRedo: redoStack.length > 0,
    undo,
    redo,
    saveState,
    clearHistory,
  };
}; 