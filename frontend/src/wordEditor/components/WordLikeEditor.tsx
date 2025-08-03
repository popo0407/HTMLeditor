import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { WordLikeEditorProps, ContextMenuState, HeadingLevel, EmphasisStyle } from '../types/wordEditorTypes';
import { useWordEditor } from '../hooks/useWordEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useEditorSections } from '../hooks/useEditorSections';
import { useEditorFormatting } from '../hooks/useEditorFormatting';
import { SimpleTableEditor } from './SimpleTableEditor';
import { ContextMenu } from './ContextMenu';
import './WordLikeEditor.css';

// 定数定義
const EMPHASIS_COLORS = {
  important: '#d97706',
  'action-item': '#2563eb'
} as const;

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  initialContent = '',
  onContentChange,
  onSave,
  onTableInsert,
  onHtmlImport,
}) => {

  const quillRef = useRef<ReactQuill>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ 
    show: false, 
    x: 0, 
    y: 0, 
    savedSelection: null 
  });

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

  // エディタセクション管理
  const {
    sections: editorSections,
    currentSectionId,
    updateSectionContent,
    updateSectionTableData,
    removeSection,
    insertTableAfterSection
  } = useEditorSections({ initialContent });

  // エディタフォーマット管理
  const {
    getCurrentHeading,
    getCurrentEmphasis,
    applyHeading,
    applyEmphasis,
    resetLineFormatting
  } = useEditorFormatting({ quillRef });

  // キーボードショートカットの設定
  useKeyboardShortcuts({
    quillRef,
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

          // text-changeイベントリスナーを追加（改行時の処理）
          quill.on('text-change', (delta: any, oldContents: any, source: any) => {
            // 改行が含まれているかチェック
            if (delta.ops && source === 'user') {
              const hasNewline = delta.ops.some((op: any) => 
                op.insert && typeof op.insert === 'string' && op.insert.includes('\n')
              );
              
              if (hasNewline) {
                console.log('text-changeで改行を検出');
                // 改行後の新しい行のフォーマットをリセット
                setTimeout(() => {
                  const selection = quill.getSelection();
                  if (selection) {
                    const [line] = quill.getLine(selection.index);
                    if (line) {
                      const lineStart = line.offset();
                      const lineLength = line.length();
                      
                      // カーソル位置を保存
                      const savedIndex = selection.index;
                      
                      // 新しい行の見出しと強調の両方をリセット
                      quill.formatLine(lineStart, lineLength, 'header', false);
                      quill.formatLine(lineStart, lineLength, 'class', false);
                      quill.formatText(lineStart, lineLength, 'color', false);
                      quill.formatText(lineStart, lineLength, 'bold', false);
                      quill.formatText(lineStart, lineLength, 'italic', false);
                      quill.formatText(lineStart, lineLength, 'underline', false);
                      
                      // CSSクラスを強制的に削除
                      const lineElement = quill.getLine(lineStart)[0]?.domNode;
                      if (lineElement) {
                        lineElement.classList.remove('important', 'action-item');
                        lineElement.style.color = '';
                        lineElement.style.fontWeight = '';
                        
                        // 子要素のスタイルもリセット
                        const childElements = lineElement.querySelectorAll('*');
                        childElements.forEach((child: Element) => {
                          if (child instanceof HTMLElement) {
                            child.classList.remove('important', 'action-item');
                            child.style.color = '';
                            child.style.fontWeight = '';
                          }
                        });
                      }
                      
                      // 新しい行の状態をリセット
                      setFormats(prev => ({
                        ...prev,
                        heading: 'p',
                        emphasis: 'normal'
                      }));
                      
                      // カーソル位置を正しく復元（改行後の位置に戻す）
                      setTimeout(() => {
                        quill.setSelection(savedIndex, 0);
                        quill.focus();
                      }, 1);
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
    applyHeading(level, contextMenu.savedSelection);
    // 状態管理を更新
    setFormats(prev => ({
      ...prev,
      heading: level
    }));
    closeContextMenu();
  }, [applyHeading, closeContextMenu, contextMenu.savedSelection, setFormats]);

  // 強調変更ハンドラー
  const handleEmphasisChange = useCallback((style: EmphasisStyle) => {
    console.log('強調変更:', style);
    applyEmphasis(style, contextMenu.savedSelection);
    // 状態管理を更新
    setFormats(prev => ({
      ...prev,
      emphasis: style
    }));
    closeContextMenu();
  }, [applyEmphasis, closeContextMenu, contextMenu.savedSelection, setFormats]);



  return (
    <div className="word-like-editor">
      {editorSections.map((section, index) => (
        <div key={section.id} className="editor-section">
          {section.type === 'text' ? (
            <div
              className="editor-container"
              onContextMenu={handleContextMenu}
              onKeyDown={handleEditorKeyDown}
              onFocus={handleEditorFocus}
              onClick={handleEditorClick}
            >
              <ReactQuill
                ref={quillRef}
                value={section.content}
                onChange={(value) => {
                  updateSectionContent(section.id, value);
                  // 全セクションのコンテンツを結合してhandleChangeに渡す
                  const allContent = editorSections
                    .map(s => s.type === 'text' ? s.content : '')
                    .join('\n');
                  handleChange(allContent, null, null, null);
                }}
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
          ) : (
            <SimpleTableEditor
              tableData={section.tableData!}
              onTableChange={(newTableData) => {
                updateSectionTableData(section.id, newTableData);
              }}
              onTableDelete={() => {
                removeSection(section.id);
              }}
            />
          )}
        </div>
      ))}

      {/* コンテキストメニュー */}
      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onHeadingChange={handleHeadingChange}
          onEmphasisChange={handleEmphasisChange}
          onTableCreate={() => {
            // 新しい表セクションを挿入
            const newTableData = {
              rows: [
                ['', ''],
                ['', '']
              ]
            };
            
            insertTableAfterSection(currentSectionId, newTableData);
            closeContextMenu();
          }}
          currentHeading={editorFormats.heading}
          currentEmphasis={editorFormats.emphasis}
        />
      )}



      {/* デバッグ情報 */}
      <div className="debug-info">
        <p>エディタセクション数: {editorSections.length}</p>
        <p>現在のセクション: {currentSectionId}</p>
        <p>編集状態: {isEditing ? '編集中' : '非編集'}</p>
        <p>コンテンツ長: {content.length}文字</p>
        <p>ショートカット: Ctrl+B (太字), Ctrl+U (下線)</p>
        <p>右クリック: 見出し・強調・表作成メニュー</p>
        <p>メニュー操作: ↑↓ (選択), Tab (セクション切替), Enter (決定), Esc (キャンセル)</p>
        <p>表機能: ワンクリック編集、矢印キー移動</p>
      </div>
    </div>
  );
};