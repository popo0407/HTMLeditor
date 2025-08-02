import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { WordLikeEditorProps } from '../types/wordEditorTypes';
import { useWordEditor } from '../hooks/useWordEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './WordLikeEditor.css';

// 定数定義
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'p'] as const;
const EMPHASIS_STYLES = ['normal', 'important', 'action-item'] as const;
const EMPHASIS_COLORS = {
  important: '#d97706',
  'action-item': '#2563eb'
} as const;

type HeadingLevel = typeof HEADING_LEVELS[number];
type EmphasisStyle = typeof EMPHASIS_STYLES[number];

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onHeadingChange: (level: HeadingLevel) => void;
  onEmphasisChange: (style: EmphasisStyle) => void;
  currentHeading: string;
  currentEmphasis: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onHeadingChange,
  onEmphasisChange,
  currentHeading,
  currentEmphasis,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState<'heading' | 'emphasis'>('heading');

  // メニュー項目の定義
  const headingItems = [
    { key: 'h1' as const, label: '見出し1' },
    { key: 'h2' as const, label: '見出し2' },
    { key: 'h3' as const, label: '見出し3' },
    { key: 'p' as const, label: '通常テキスト' }
  ];

  const emphasisItems = [
    { key: 'normal' as const, label: '通常' },
    { key: 'important' as const, label: '重要' },
    { key: 'action-item' as const, label: 'アクション項目' }
  ];

  // 全メニュー項目を統合
  const allMenuItems = [
    ...headingItems.map(item => ({ ...item, section: 'heading' as const })),
    ...emphasisItems.map(item => ({ ...item, section: 'emphasis' as const }))
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // メニューが表示されている間は、すべてのキーボードイベントをエディタに送らない
      event.preventDefault();
      event.stopPropagation();

      switch (event.key) {
        case 'ArrowUp':
          const currentItemIndexUp = selectedSection === 'heading'
            ? selectedIndex
            : headingItems.length + selectedIndex;
          const prevItemIndex = currentItemIndexUp > 0 ? currentItemIndexUp - 1 : allMenuItems.length - 1;
          const prevItem = allMenuItems[prevItemIndex];
          setSelectedSection(prevItem.section);
          setSelectedIndex(prevItem.section === 'heading'
            ? headingItems.findIndex(item => item.key === prevItem.key)
            : emphasisItems.findIndex(item => item.key === prevItem.key)
          );
          break;
        case 'ArrowDown':
          const currentItemIndexDown = selectedSection === 'heading'
            ? selectedIndex
            : headingItems.length + selectedIndex;
          const nextItemIndex = currentItemIndexDown < allMenuItems.length - 1 ? currentItemIndexDown + 1 : 0;
          const nextItem = allMenuItems[nextItemIndex];
          setSelectedSection(nextItem.section);
          setSelectedIndex(nextItem.section === 'heading'
            ? headingItems.findIndex(item => item.key === nextItem.key)
            : emphasisItems.findIndex(item => item.key === nextItem.key)
          );
          break;
        case 'Tab':
          setSelectedSection(prev => prev === 'heading' ? 'emphasis' : 'heading');
          setSelectedIndex(0);
          break;
        case 'Enter':
          if (selectedSection === 'heading') {
            onHeadingChange(headingItems[selectedIndex].key);
          } else {
            onEmphasisChange(emphasisItems[selectedIndex].key);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onHeadingChange, onEmphasisChange, selectedIndex, selectedSection]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: '200px',
      }}
    >
      <div className="menu-section">
        <div className="menu-title">見出し</div>
        {headingItems.map((item, index) => (
          <div
            key={item.key}
            className={`menu-item ${selectedSection === 'heading' && selectedIndex === index ? 'keyboard-selected' : ''}`}
            onClick={() => onHeadingChange(item.key)}
          >
            <span className={currentHeading === item.key ? 'selected' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="menu-section">
        <div className="menu-title">強調</div>
        {emphasisItems.map((item, index) => (
          <div
            key={item.key}
            className={`menu-item ${selectedSection === 'emphasis' && selectedIndex === index ? 'keyboard-selected' : ''}`}
            onClick={() => onEmphasisChange(item.key)}
          >
            <span className={currentEmphasis === item.key ? 'selected' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  initialContent = '',
  onContentChange,
  onSave,
  onTableInsert,
  onHtmlImport,
}) => {

  const quillRef = useRef<ReactQuill>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    savedSelection: any; // 保存された選択範囲
  }>({ show: false, x: 0, y: 0, savedSelection: null });

  const {
    content,
    formats: editorFormats,
    isEditing,
    tableData,
    setContent,
    setFormats,
    setIsEditing,
    insertTable,
    updateTableData,
    deleteTable,
    getEditorContent,
  } = useWordEditor({
    initialContent,
    onContentChange,
  });

  // キーボードショートカットの設定
  useKeyboardShortcuts({
    quillRef,
    onTableInsert: () => {
      console.log('Table insert called from WordLikeEditor');
      insertTable();
    },
    onTableAddRow: (position) => {
      console.log('Table add row called from WordLikeEditor:', position);
      if (tableData) {
        const newTableData = { ...tableData };
        if (position === 'above') {
          newTableData.rows.unshift(Array(newTableData.rows[0]?.length || 0).fill(''));
        } else {
          newTableData.rows.push(Array(newTableData.rows[0]?.length || 0).fill(''));
        }
        updateTableData(newTableData);
      }
    },
    onTableAddColumn: (position) => {
      console.log('Table add column called from WordLikeEditor:', position);
      if (tableData) {
        const newTableData = { ...tableData };
        if (position === 'left') {
          newTableData.rows.forEach(row => row.unshift(''));
        } else {
          newTableData.rows.forEach(row => row.push(''));
        }
        updateTableData(newTableData);
      }
    },
    onTableNextCell: () => {
      console.log('Table next cell called from WordLikeEditor');
    },
    onTablePreviousCell: () => {
      console.log('Table previous cell called from WordLikeEditor');
    },
  });

  // Quill.jsの設定
  const modules = {
    toolbar: false,
    clipboard: {
      matchVisual: false,
    },
    keyboard: {
      bindings: {
        // カスタムキーバインドを無効化してデフォルト動作を維持
      }
    }
  };

  // Quill.jsのカスタム属性を有効にする
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        // カスタム属性を許可
        quill.root.setAttribute('data-placeholder', 'ここにテキストを入力してください...');
      }
    }
  }, []);

  const quillFormats = [
    'bold',
    'underline',
    'header',
    'list',
    'bullet',
    'indent',
    'class', // カスタムクラスフォーマットを追加
    'color', // 文字色も追加
  ];

  // エディタの初期化確認
  useEffect(() => {
    const initializeEditor = () => {
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        console.log('Quillエディタ初期化完了:', quill);

        if (quill) {
          // エディタにフォーカスを設定
          setTimeout(() => {
            if (quill.focus) {
              quill.focus();
              console.log('エディタにフォーカスを設定しました');
            }
          }, 100);

          // エディタの準備状態を確認
          console.log('エディタ準備状態:', {
            hasSelection: !!quill.getSelection,
            hasGetLine: !!quill.getLine,
            hasFormatLine: !!quill.formatLine,
            hasFocus: !!quill.focus
          });

          // text-changeイベントリスナーを追加
          quill.on('text-change', (delta: any, oldContents: any, source: any) => {
            // 改行が含まれているかチェック
            if (delta.ops) {
              const hasNewline = delta.ops.some((op: any) => 
                op.insert && typeof op.insert === 'string' && op.insert.includes('\n')
              );
              
              if (hasNewline && source === 'user') {
                console.log('text-changeで改行を検出');
                // 改行後の新しい行のフォーマットをリセット
                setTimeout(() => {
                  const selection = quill.getSelection();
                  if (selection) {
                    const [line] = quill.getLine(selection.index);
                    if (line) {
                      const lineStart = line.offset();
                      const lineLength = line.length();
                      
                      // 見出しと強調の両方を強制的にリセット
                      quill.formatLine(lineStart, lineLength, 'header', false);
                      quill.formatLine(lineStart, lineLength, 'class', false);
                      quill.formatText(lineStart, lineLength, 'color', false);
                      
                      // CSSクラスを強制的に削除
                      const lineElement = quill.getLine(lineStart)[0]?.domNode;
                      if (lineElement) {
                        lineElement.classList.remove('important', 'action-item');
                        lineElement.style.color = '';
                      }
                      
                      // フォーマット状態を更新
                      setFormats(prev => ({
                        ...prev,
                        heading: 'p',
                        emphasis: 'normal'
                      }));
                      
                      // 強制的にHTMLを更新
                      const updatedHtml = quill.root.innerHTML;
                      setContent(updatedHtml);
                      
                      // さらに遅延させて確実に更新
                      setTimeout(() => {
                        const finalHtml = quill.root.innerHTML;
                        setContent(finalHtml);
                      }, 10);
                    }
                  }
                }, 5);
              }
            }
          });
        }
      }
    };

    // 初期化を少し遅延させる
    setTimeout(initializeEditor, 200);
  }, [setFormats]);

  // エディタのフォーカス復元を確実にする
  useEffect(() => {
    const handleWindowFocus = () => {
      if (quillRef.current && !contextMenu.show) {
        const quill = quillRef.current.getEditor();
        if (quill && quill.focus) {
          setTimeout(() => {
            quill.focus();
            console.log('ウィンドウフォーカス時にエディタフォーカスを復元');
          }, 50);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [contextMenu.show]);

  // formats（editorFormats）とQuillの見た目を同期
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection) return;

    const [line] = quill.getLine(selection.index);
    if (!line) return;

    const lineStart = line.offset();
    const lineLength = line.length();

    // 見出し
    if (editorFormats.heading === 'p') {
      quill.formatLine(lineStart, lineLength, 'header', false);
    } else if (editorFormats.heading === 'h1' || editorFormats.heading === 'h2' || editorFormats.heading === 'h3') {
      const headerLevel = parseInt(editorFormats.heading.charAt(1));
      quill.formatLine(lineStart, lineLength, 'header', headerLevel);
    }

    // 強調
    if (editorFormats.emphasis === 'normal') {
      quill.formatLine(lineStart, lineLength, 'class', false);
      quill.formatText(lineStart, lineLength, 'color', false);
      // クラス・色もDOMから消す
      const lineElement = quill.getLine(lineStart)[0]?.domNode;
      if (lineElement) {
        lineElement.classList.remove('important', 'action-item');
        lineElement.style.color = '';
      }
    } else {
      quill.formatLine(lineStart, lineLength, 'class', editorFormats.emphasis);
      if (editorFormats.emphasis === 'important') {
        quill.formatText(lineStart, lineLength, 'color', '#d97706');
      } else if (editorFormats.emphasis === 'action-item') {
        quill.formatText(lineStart, lineLength, 'color', '#2563eb');
      }
    }
  }, [editorFormats, quillRef]);

  // 共通処理: 現在の行の情報を取得
  const getCurrentLineInfo = useCallback(() => {
    if (!quillRef.current) return null;
    const quill = quillRef.current.getEditor();
    if (!quill) return null;

    const selection = contextMenu.savedSelection || quill.getSelection();
    if (!selection) return null;

    const [line] = quill.getLine(selection.index);
    if (!line) return null;

    return {
      quill,
      line,
      lineStart: line.offset(),
      lineLength: line.length(),
      selection
    };
  }, [contextMenu.savedSelection]);

  // 共通処理: フォーマット変更後の後処理
  const handleFormatChangeAfter = useCallback((quill: any, lineStart: number, lineLength: number) => {
    // エディタにフォーカスを戻す
    quill.focus();
    
    // カーソルを該当行の文末に移動して全選択を解除
    const lineEnd = lineStart + lineLength;
    quill.setSelection(lineEnd, 0);
  }, []);

  // コンテンツ変更ハンドラー
  const handleChange = useCallback((value: string, delta: any, source: any, editor: any) => {
    setContent(value);
    setIsEditing(true);
  }, [setContent, setIsEditing]);

  // エディタフォーカスハンドラー
  const handleFocus = useCallback(() => {
    console.log('Editor focused');
    setIsEditing(true);
  }, [setIsEditing]);

  // コンテナイベントハンドラー
  const handleContainerEvent = useCallback((eventType: string, e: React.MouseEvent | React.FocusEvent) => {
    console.log(`Container ${eventType}`);
    e.stopPropagation();
  }, []);

    // メニューを閉じる共通関数
  const closeContextMenu = useCallback(() => {
    // エディタのキーボード入力を復元（バインディングは自動的にクリアされる）
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // キーボードバインディングをクリア
      if (quill.keyboard) {
        // バインディングを削除（Quill.jsの仕様上、同じキーで新しいバインディングを追加すると上書きされる）
        quill.keyboard.addBinding({ key: 'enter' }, () => {
          return true; // デフォルト動作を許可
        });
        quill.keyboard.addBinding({ key: 'escape' }, () => {
          return true; // デフォルト動作を許可
        });
      }
      
      // フォーカスを戻す
      quill.focus();
      
      // 少し遅延させてからフォーカスを確実に設定
      setTimeout(() => {
        if (quillRef.current) {
          const quill = quillRef.current.getEditor();
          quill.focus();
        }
      }, 10);
    }
    
    setContextMenu(prev => ({ ...prev, show: false, savedSelection: null }));
  }, []);

  // エディタコンテナのキーボードイベントハンドラー
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    // メニューが表示されている間は、すべてのキーボードイベントをキャッチ
    if (contextMenu.show) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [contextMenu.show]);

  // ReactQuillのキーボードイベントハンドラー
  const handleQuillKeyDown = useCallback((e: React.KeyboardEvent) => {
    // メニューが表示されている間は、エンターキーを無効化
    if (contextMenu.show && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [contextMenu.show]);

  // エディタのフォーカス復元ハンドラー
  const handleEditorFocus = useCallback(() => {
    // メニューが閉じられた後にフォーカスを確実に復元
    if (!contextMenu.show && quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.focus();
    }
  }, [contextMenu.show]);

  // エディタのクリックハンドラー
  const handleEditorClick = useCallback(() => {
    // メニューが閉じられた後にクリックでフォーカスを復元
    if (!contextMenu.show && quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.focus();
    }
  }, [contextMenu.show]);

    // 右クリックハンドラー
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    console.log('右クリックメニュー表示', { x: e.clientX, y: e.clientY });
    e.preventDefault();
    e.stopPropagation();
    
    // エディタの状態を確認
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();
      console.log('エディタ状態:', {
        quillExists: !!quill,
        selection: selection,
        contentLength: quill.getContents().length()
      });
      
      // エディタのキーボード入力を一時的に無効化
      if (quill.keyboard) {
        // エンターキーを完全に無効化
        quill.keyboard.addBinding({ key: 'enter' }, () => {
          return false; // イベントを消費して処理を停止
        });
        quill.keyboard.addBinding({ key: 'escape' }, () => {
          return false; // イベントを消費して処理を停止
        });
      }
      
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        savedSelection: selection,
      });
    }
  }, []);

  // 見出し変更ハンドラー
  const handleHeadingChange = useCallback((level: HeadingLevel) => {
    console.log('見出し変更:', level);
    
    const lineInfo = getCurrentLineInfo();
    if (!lineInfo) {
      console.error('現在の行の情報を取得できません');
      return;
    }

    const { quill, lineStart, lineLength } = lineInfo;

    // 行全体を選択
    quill.setSelection(lineStart, lineLength);

    // 見出しレベルを設定
    if (level === 'p') {
      quill.formatLine(lineStart, lineLength, 'header', false);
    } else {
      const headerLevel = parseInt(level.charAt(1));
      quill.formatLine(lineStart, lineLength, 'header', headerLevel);
    }

    // フォーマット状態を更新（useEffectが自動的にQuillの見た目を同期）
    setFormats(prev => ({
      ...prev,
      heading: level
    }));

    console.log('見出し変更完了:', level);

    // 後処理
    handleFormatChangeAfter(quill, lineStart, lineLength);
    closeContextMenu();
  }, [getCurrentLineInfo, setFormats, handleFormatChangeAfter, closeContextMenu]);

  // 強調変更ハンドラー
  const handleEmphasisChange = useCallback((style: EmphasisStyle) => {
    console.log('強調変更:', style);
    
    const lineInfo = getCurrentLineInfo();
    if (!lineInfo) {
      console.error('現在の行の情報を取得できません');
      return;
    }

    const { quill, lineStart, lineLength } = lineInfo;

    // 行全体を選択
    quill.setSelection(lineStart, lineLength);

    // 強調スタイルを設定
    if (style === 'normal') {
      quill.formatLine(lineStart, lineLength, 'class', false);
      quill.formatText(lineStart, lineLength, 'color', false);
    } else {
      quill.formatLine(lineStart, lineLength, 'class', style);
      const color = EMPHASIS_COLORS[style];
      if (color) {
        quill.formatText(lineStart, lineLength, 'color', color);
      }
    }

    // フォーマット状態を更新（useEffectが自動的にQuillの見た目を同期）
    setFormats(prev => ({
      ...prev,
      emphasis: style
    }));

    console.log('強調変更完了:', style);

    // 後処理
    handleFormatChangeAfter(quill, lineStart, lineLength);
    closeContextMenu();
  }, [getCurrentLineInfo, setFormats, handleFormatChangeAfter, closeContextMenu]);

  // 現在の見出しレベルを取得
  const getCurrentHeading = useCallback(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (selection) {
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const format = quill.getFormat(lineStart, 1);
          return format.header ? `h${format.header}` : 'p';
        }
      }
    }
    return 'p';
  }, []);

  // 現在の強調スタイルを取得
  const getCurrentEmphasis = useCallback((): string => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (selection) {
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const format = quill.getFormat(lineStart, 1);
          return (format.class as string) || 'normal';
        }
      }
    }
    return 'normal';
  }, []);

  return (
    <div className="word-like-editor">
      <div
        className="editor-container"
        onContextMenu={handleContextMenu}
        onKeyDown={handleEditorKeyDown}
        onFocus={handleEditorFocus}
        onClick={handleEditorClick}
      >
                 <ReactQuill
           ref={quillRef}
           value={content}
           onChange={handleChange}
           onFocus={handleFocus}
           modules={modules}
           formats={quillFormats}
           placeholder="ここにテキストを入力してください..."
           className={`word-editor ${isEditing ? 'editing' : ''}`}
           preserveWhitespace={true}
           readOnly={contextMenu.show}
           theme="snow"
           onKeyDown={handleQuillKeyDown}
         />
      </div>

      {/* コンテキストメニュー */}
      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onHeadingChange={handleHeadingChange}
          onEmphasisChange={handleEmphasisChange}
          currentHeading={getCurrentHeading()}
          currentEmphasis={getCurrentEmphasis()}
        />
      )}

      {/* デバッグ情報 */}
      <div className="debug-info">
        <p>表データ: {tableData ? `${tableData.rows.length}x${tableData.rows[0]?.length || 0}` : 'なし'}</p>
        <p>編集状態: {isEditing ? '編集中' : '非編集'}</p>
        <p>コンテンツ長: {content.length}文字</p>
        <p>ショートカット: Ctrl+T (表挿入), Ctrl+B (太字), Ctrl+U (下線)</p>
        <p>右クリック: 見出し・強調メニュー</p>
        <p>メニュー操作: ↑↓ (選択), Tab (セクション切替), Enter (決定), Esc (キャンセル)</p>
      </div>
    </div>
  );
};