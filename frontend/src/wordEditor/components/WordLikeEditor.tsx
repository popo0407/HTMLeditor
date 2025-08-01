import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { WordLikeEditorProps } from '../types/wordEditorTypes';
import { useWordEditor } from '../hooks/useWordEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './WordLikeEditor.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onHeadingChange: (level: 'h1' | 'h2' | 'h3' | 'p') => void;
  onEmphasisChange: (style: 'normal' | 'important' | 'action-item') => void;
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
    { key: 'h1', label: '見出し1' },
    { key: 'h2', label: '見出し2' },
    { key: 'h3', label: '見出し3' },
    { key: 'p', label: '通常テキスト' }
  ];

  const emphasisItems = [
    { key: 'normal', label: '通常' },
    { key: 'important', label: '重要' },
    { key: 'action-item', label: 'アクション項目' }
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
            onHeadingChange(headingItems[selectedIndex].key as 'h1' | 'h2' | 'h3' | 'p');
          } else {
            onEmphasisChange(emphasisItems[selectedIndex].key as 'normal' | 'important' | 'action-item');
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
            onClick={() => onHeadingChange(item.key as 'h1' | 'h2' | 'h3' | 'p')}
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
            onClick={() => onEmphasisChange(item.key as 'normal' | 'important' | 'action-item')}
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
        }
      }
    };

    // 初期化を少し遅延させる
    setTimeout(initializeEditor, 200);
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
      // フォーカスを戻す
      quill.focus();
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
  const handleHeadingChange = useCallback((level: 'h1' | 'h2' | 'h3' | 'p') => {
    console.log('見出し変更:', level);
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // エディタが準備できているかチェック
      if (!quill || !quill.getSelection) {
        console.error('Quillエディタが準備できていません');
        return;
      }

      // 保存された選択範囲を使用
      const selection = contextMenu.savedSelection;
      console.log('保存された選択範囲:', selection);

      if (selection) {
        // 現在の行を取得
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const lineLength = line.length();

          console.log('行の範囲:', lineStart, lineLength);

          // 行全体を選択
          quill.setSelection(lineStart, lineLength);

          // 見出しレベルを設定
          if (level === 'p') {
            quill.formatLine(lineStart, lineLength, 'header', false);
          } else {
            const headerLevel = parseInt(level.charAt(1));
            quill.formatLine(lineStart, lineLength, 'header', headerLevel);
          }

          // フォーマット状態を更新
          setFormats(prev => ({
            ...prev,
            heading: level
          }));

          console.log('見出し変更完了:', level);

          // 生成されたHTMLを確認
          const generatedHtml = quill.root.innerHTML;
          console.log('生成されたHTML:', generatedHtml);

          // コンテンツを更新
          setContent(generatedHtml);

          // エディタにフォーカスを戻す
          quill.focus();
        } else {
          console.error('行が見つかりません');
        }
      } else {
        console.error('保存された選択範囲が見つかりません');
      }
    } else {
      console.error('QuillRefがnullです');
    }

    closeContextMenu();
  }, [setFormats, setContent, contextMenu.savedSelection, closeContextMenu]);

  // 強調変更ハンドラー
  const handleEmphasisChange = useCallback((style: 'normal' | 'important' | 'action-item') => {
    console.log('強調変更:', style);
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // エディタが準備できているかチェック
      if (!quill || !quill.getSelection) {
        console.error('Quillエディタが準備できていません');
        return;
      }

      // 保存された選択範囲を使用
      const selection = contextMenu.savedSelection;
      console.log('保存された選択範囲:', selection);

      if (selection) {
        // 現在の行を取得
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const lineLength = line.length();

          console.log('行の範囲:', lineStart, lineLength);

          // 行全体を選択
          quill.setSelection(lineStart, lineLength);

          // 強調スタイルを設定
          if (style === 'normal') {
            quill.formatLine(lineStart, lineLength, 'class', false);
            quill.formatText(lineStart, lineLength, 'color', false);
          } else {
            quill.formatLine(lineStart, lineLength, 'class', style);

            // 文字色も設定
            if (style === 'important') {
              quill.formatText(lineStart, lineLength, 'color', '#d97706');
            } else if (style === 'action-item') {
              quill.formatText(lineStart, lineLength, 'color', '#2563eb');
            }
          }

          // フォーマット状態を更新
          setFormats(prev => ({
            ...prev,
            emphasis: style
          }));

          console.log('強調変更完了:', style);

          // 生成されたHTMLを確認
          const generatedHtml = quill.root.innerHTML;
          console.log('生成されたHTML:', generatedHtml);

          // コンテンツを更新
          setContent(generatedHtml);

          // エディタにフォーカスを戻す
          quill.focus();
        } else {
          console.error('行が見つかりません');
        }
      } else {
        console.error('保存された選択範囲が見つかりません');
      }
    } else {
      console.error('QuillRefがnullです');
    }

    closeContextMenu();
  }, [setFormats, setContent, contextMenu.savedSelection, closeContextMenu]);

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
          onKeyDown={handleEditorKeyDown}
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