import { useCallback, useEffect, useRef } from 'react';
import { KeyboardHandlers, KeyboardHandler } from '../types/wordEditorTypes';

export interface UseKeyboardShortcutsProps {
  quillRef: React.RefObject<any>;
  onTableInsert?: () => void;
  onTableAddRow?: (position: 'above' | 'below') => void;
  onTableAddColumn?: (position: 'left' | 'right') => void;
  onTableNextCell?: () => void;
  onTablePreviousCell?: () => void;
}

export const useKeyboardShortcuts = ({
  quillRef,
  onTableInsert,
  onTableAddRow,
  onTableAddColumn,
  onTableNextCell,
  onTablePreviousCell,
}: UseKeyboardShortcutsProps) => {
  const handlersRef = useRef<KeyboardHandlers>({});

  // キーボードハンドラーの設定
  const setupHandlers = useCallback(() => {
    console.log('Setting up keyboard handlers');
    handlersRef.current = {
      'ctrl+b': (quill: any) => {
        const selection = quill.getSelection();
        if (selection) {
          const format = quill.getFormat(selection.index, selection.length);
          quill.format('bold', !format.bold);
        }
      },
      'ctrl+u': (quill: any) => {
        const selection = quill.getSelection();
        if (selection) {
          const format = quill.getFormat(selection.index, selection.length);
          quill.format('underline', !format.underline);
        }
      },
      'ctrl+t': (quill: any) => {
        if (onTableInsert) {
          onTableInsert();
        }
      },
      'ctrl+shift+up': (quill: any) => {
        if (onTableAddRow) {
          onTableAddRow('above');
        }
      },
      'ctrl+shift+down': (quill: any) => {
        if (onTableAddRow) {
          onTableAddRow('below');
        }
      },
      'ctrl+shift+left': (quill: any) => {
        if (onTableAddColumn) {
          onTableAddColumn('left');
        }
      },
      'ctrl+shift+right': (quill: any) => {
        if (onTableAddColumn) {
          onTableAddColumn('right');
        }
      },
      'tab': (quill: any) => {
        if (onTableNextCell) {
          onTableNextCell();
        }
      },
      'shift+tab': (quill: any) => {
        if (onTablePreviousCell) {
          onTablePreviousCell();
        }
      },
    };
    console.log('Keyboard handlers registered:', Object.keys(handlersRef.current));
  }, [
    onTableInsert,
    onTableAddRow,
    onTableAddColumn,
    onTableNextCell,
    onTablePreviousCell,
  ]);

  // キーボードイベントハンドラー
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    // キーの組み合わせを構築
    let keyCombination = '';
    if (ctrl) keyCombination += 'ctrl+';
    if (shift) keyCombination += 'shift+';
    if (alt) keyCombination += 'alt+';
    keyCombination += key;
    
    console.log('Key pressed:', keyCombination);
    
    // エディタがフォーカスされているかチェック
    if (!quillRef.current) {
      console.log('Quill ref not available');
      return;
    }
    
    const quill = quillRef.current.getEditor();
    if (!quill) {
      console.log('Quill editor not available');
      return;
    }
    
    const selection = quill.getSelection();
    if (!selection) {
      console.log('No selection in editor');
      return;
    }
    
    console.log('Editor focused, selection available');
    
    // ハンドラーを検索
    const handler = handlersRef.current[keyCombination];
    if (handler) {
      console.log('Handler found for:', keyCombination);
      event.preventDefault();
      event.stopPropagation();
      handler(quill);
    } else {
      console.log('No handler found for:', keyCombination);
    }
  };

  // イベントリスナーの設定
  useEffect(() => {
    setupHandlers();
    
    const handleKeyDownWithCapture = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };
    
    // キャプチャフェーズでイベントをリッスン
    document.addEventListener('keydown', handleKeyDownWithCapture, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownWithCapture, true);
    };
  }, [setupHandlers]);
}; 