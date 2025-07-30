/**
 * キーボードナビゲーション管理フック
 * 
 * 責務:
 * - キーボードイベントの統一管理
 * - ブロック間移動の制御
 * - イベント競合の回避
 * 
 * 開発憲章の「単一責任の原則」に従い、キーボード操作のみを担当
 */

import { useEffect, useCallback, useRef } from 'react';
import { Block, BlockType, BlockStyle } from '../types';

export interface KeyboardNavigationConfig {
  enableArrowKeys: boolean;
  enableCtrlSpace: boolean;
  enableShiftSpace: boolean;
  enableContextMenu: boolean;
}

export interface KeyboardNavigationHandlers {
  onBlockMove: (direction: 'up' | 'down') => void;
  onBlockCreate: (blockType: BlockType) => void;
  onBlockTypeChange: (blockId: string, newType: BlockType) => void;
  onBlockStyleChange: (blockId: string, newStyle: BlockStyle) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockSelect: (blockId: string) => void;
  onSelectAll: (blockId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSearch: () => void;
  onReplace: () => void;
}

export interface UseKeyboardNavigationReturn {
  currentBlockId: string | null;
  setCurrentBlockId: (blockId: string | null) => void;
  isKeyboardEnabled: boolean;
  enableKeyboard: () => void;
  disableKeyboard: () => void;
}

export const useKeyboardNavigation = (
  config: KeyboardNavigationConfig,
  handlers: KeyboardNavigationHandlers,
  currentBlockType?: BlockType,
  currentBlockStyle?: BlockStyle
): UseKeyboardNavigationReturn => {
  const currentBlockIdRef = useRef<string | null>(null);
  const isKeyboardEnabledRef = useRef<boolean>(true);
  const lastKeyTimeRef = useRef<number>(0);

  // ブロックタイプの順序
  const blockTypeOrder: BlockType[] = ['heading1', 'heading2', 'heading3', 'paragraph'];
  
  // ブロックスタイルの順序
  const blockStyleOrder: BlockStyle[] = ['normal', 'important', 'action-item'];

  /**
   * 現在のブロックIDを設定
   */
  const setCurrentBlockId = useCallback((blockId: string | null) => {
    currentBlockIdRef.current = blockId;
  }, []);

  /**
   * キーボード有効化
   */
  const enableKeyboard = useCallback(() => {
    isKeyboardEnabledRef.current = true;
  }, []);

  /**
   * キーボード無効化
   */
  const disableKeyboard = useCallback(() => {
    isKeyboardEnabledRef.current = false;
  }, []);

  /**
   * キーボードイベントハンドラー
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // キーボードが無効化されている場合は何もしない
    if (!isKeyboardEnabledRef.current) {
      return;
    }

    const { key, ctrlKey, shiftKey, altKey } = event;

    // 入力フィールド内での操作は除外（Enterキーは除く）
    const target = event.target as HTMLElement;
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') && key !== 'Enter') {
      return;
    }

    // デバウンス処理（連続キー入力を防ぐ）
    const now = Date.now();
    if (now - lastKeyTimeRef.current < 50) {
      return;
    }
    lastKeyTimeRef.current = now;

    // 矢印キー移動
    if (config.enableArrowKeys && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      handlers.onBlockMove(key === 'ArrowUp' ? 'up' : 'down');
      return;
    }

    // Ctrl+Space: ブロックタイプ切り替え
    if (config.enableCtrlSpace && ctrlKey && key === ' ') {
      event.preventDefault();
      if (currentBlockIdRef.current && currentBlockType) {
        const currentIndex = blockTypeOrder.indexOf(currentBlockType);
        const nextIndex = (currentIndex + 1) % blockTypeOrder.length;
        const nextType = blockTypeOrder[nextIndex];
        handlers.onBlockTypeChange(currentBlockIdRef.current, nextType);
      }
      return;
    }

    // Shift+Space: 強調切り替え
    if (config.enableShiftSpace && shiftKey && key === ' ') {
      event.preventDefault();
      if (currentBlockIdRef.current && currentBlockStyle) {
        const currentIndex = blockStyleOrder.indexOf(currentBlockStyle);
        const nextIndex = (currentIndex + 1) % blockStyleOrder.length;
        const nextStyle = blockStyleOrder[nextIndex];
        handlers.onBlockStyleChange(currentBlockIdRef.current, nextStyle);
      }
      return;
    }

    // Enter: 新規段落作成
    if (key === 'Enter' && !ctrlKey && !shiftKey) {
      event.preventDefault();
      handlers.onBlockCreate('paragraph');
      return;
    }

    // Ctrl+A: 全選択
    if (ctrlKey && key === 'a') {
      event.preventDefault();
      if (currentBlockIdRef.current) {
        handlers.onSelectAll(currentBlockIdRef.current);
      }
      return;
    }

    // Ctrl+Z: アンドゥ
    if (ctrlKey && key === 'z' && !shiftKey) {
      event.preventDefault();
      handlers.onUndo();
      return;
    }

    // Ctrl+Y: リドゥ
    if (ctrlKey && key === 'y') {
      event.preventDefault();
      handlers.onRedo();
      return;
    }

    // Ctrl+F: 検索
    if (ctrlKey && key === 'f') {
      event.preventDefault();
      handlers.onSearch();
      return;
    }

    // Ctrl+H: 置換
    if (ctrlKey && key === 'h') {
      event.preventDefault();
      handlers.onReplace();
      return;
    }
  }, [config, handlers]);

  /**
   * キーボードイベントリスナーの設定
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    currentBlockId: currentBlockIdRef.current,
    setCurrentBlockId,
    isKeyboardEnabled: isKeyboardEnabledRef.current,
    enableKeyboard,
    disableKeyboard,
  };
}; 