import React, { useRef, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { WordLikeEditorProps } from '../types/wordEditorTypes';
import { useWordEditor } from '../hooks/useWordEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './WordLikeEditor.css';

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  initialContent = '',
  onContentChange,
  onSave,
  onTableInsert,
  onHtmlImport,
}) => {
  const quillRef = useRef<ReactQuill>(null);
  
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

  // キーボードショートカットの設定（見出し・強調機能を削除）
  useKeyboardShortcuts({
    quillRef,
    onHeadingToggle: () => {
      console.log('見出し切り替え機能は削除されました');
    },
    onEmphasisToggle: () => {
      console.log('強調切り替え機能は削除されました');
    },
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

  // Quill.jsの設定 - シンプルに
  const modules = {
    toolbar: false,
  };

  const quillFormats = [
    'bold',
    'underline',
    'header',
    'list',
    'bullet',
    'indent',
    'class', // カスタムクラスを有効化
  ];

  // 新しい行のスタイルリセット処理
  const resetNewLineStyle = useCallback((quill: any, selection: any) => {
    if (!selection) return;
    
    const [currentLine, offset] = quill.getLine(selection.index);
    if (!currentLine) return;
    
    const lineStart = currentLine.offset();
    const lineLength = currentLine.length();
    
    console.log('新しい行の範囲:', lineStart, lineLength);
    
    // 新しい行のスタイルを通常にリセット
    quill.formatText(lineStart, lineLength, 'class', false);
    console.log('新しい行のスタイルをリセットしました');
    
    // DOM要素からもクラスを削除
    const editorElement = quill.root;
    const lines = editorElement.querySelectorAll('.ql-editor > *');
    if (lines.length > 0) {
      // 現在の行のインデックスを正確に計算
      let currentLineIndex = 0;
      let currentOffset = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const lineElement = lines[i];
        const lineText = lineElement.textContent || '';
        if (currentOffset <= selection.index && selection.index < currentOffset + lineText.length + 1) {
          currentLineIndex = i;
          break;
        }
        currentOffset += lineText.length + 1; // +1 for newline
      }
      
      if (lines[currentLineIndex]) {
        const lineElement = lines[currentLineIndex] as HTMLElement;
        lineElement.classList.remove('important', 'action-item');
        console.log('新しい行のDOM要素からクラスを削除しました');
      }
    }
  }, []);

  // コンテンツ変更ハンドラー - リファクタリング版
  const handleChange = useCallback((value: string, delta: any, source: any, editor: any) => {
    setContent(value);
    setIsEditing(true);
    
    // エンターキーで新しい行が作成された場合の処理
    if (delta && delta.ops) {
      const lastOp = delta.ops[delta.ops.length - 1];
      if (lastOp && lastOp.insert === '\n') {
        console.log('新しい行が作成されました');
        
        // 新しい行のスタイルをリセット（より確実に）
        setTimeout(() => {
          if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const selection = quill.getSelection();
            if (selection) {
              resetNewLineStyle(quill, selection);
            }
          }
        }, 150); // 遅延時間を増加
      }
    }
  }, [setContent, setIsEditing, resetNewLineStyle]);

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

  // デバッグ情報の生成
  const generateDebugInfo = useCallback(() => {
    if (!quillRef.current) return 'なし';
    
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    
    if (!selection) return 'なし';
    
    const [line, offset] = quill.getLine(selection.index);
    if (!line) return `位置${selection.index}`;
    
    const lineStart = line.offset();
    const lineLength = line.length();
    const lineText = quill.getText(lineStart, lineLength);
    const lineFormat = quill.getFormat(lineStart, lineLength);
    
    return `行${Math.floor(selection.index / 50) + 1}, 位置${selection.index}, 行範囲:${lineStart}-${lineStart + lineLength}, 内容:"${lineText}", 見出し:${lineFormat.header}, クラス:${lineFormat.class}`;
  }, [quillRef]);

  // ログ永続化機能
  const addLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    
    // 既存のログを取得
    const existingLogs = localStorage.getItem('wordEditorLogs') || '[]';
    const logs = JSON.parse(existingLogs);
    
    // 新しいログを追加（最大100件まで保持）
    logs.push(logEntry);
    if (logs.length > 100) {
      logs.shift();
    }
    
    // localStorageに保存
    localStorage.setItem('wordEditorLogs', JSON.stringify(logs));
    
    // コンソールにも出力
    console.log(`[${timestamp}] ${message}`, data);
  }, []);

  // ログクリア機能
  const clearLogs = useCallback(() => {
    localStorage.removeItem('wordEditorLogs');
    console.log('ログをクリアしました');
  }, []);

  // ログ取得機能
  const getLogs = useCallback(() => {
    const logs = localStorage.getItem('wordEditorLogs') || '[]';
    return JSON.parse(logs);
  }, []);

  return (
    <div className="word-like-editor">
      <div 
        className="editor-container"
        onClick={(e) => handleContainerEvent('clicked', e)}
        onMouseDown={(e) => handleContainerEvent('mousedown', e)}
        onFocus={(e) => handleContainerEvent('focused', e)}
        onBlur={(e) => handleContainerEvent('blurred', e)}
        tabIndex={-1}
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
          readOnly={false}
          theme="snow"
        />
      </div>
      
      {/* デバッグ情報 */}
      <div className="debug-info">
        <p>見出しレベル: {editorFormats.heading}</p>
        <p>強調スタイル: {editorFormats.emphasis}</p>
        <p>表データ: {tableData ? `${tableData.rows.length}x${tableData.rows[0]?.length || 0}` : 'なし'}</p>
        <p>編集状態: {isEditing ? '編集中' : '非編集'}</p>
        <p>コンテンツ長: {content.length}文字</p>
        <p>ショートカット: Ctrl+D (見出し), Ctrl+E (強調) - 機能削除済み</p>
        <p>カーソル位置: {generateDebugInfo()}</p>
        
        {/* ログ表示セクション */}
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          <h4>ログ履歴 (localStorage)</h4>
          <button onClick={clearLogs} style={{ marginBottom: '10px', padding: '5px 10px' }}>ログクリア</button>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            {getLogs().map((log: any, index: number) => (
              <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                <div style={{ color: '#666' }}>{log.timestamp}</div>
                <div style={{ fontWeight: 'bold' }}>{log.message}</div>
                {log.data && (
                  <div style={{ color: '#0066cc', whiteSpace: 'pre-wrap' }}>{log.data}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 