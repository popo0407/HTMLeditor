/**
 * HTMLエディタアプリケーション
 * 
 * 開発憲章の「関心の分離」に従い、UIの状態管理をコンポーネントに閉じてカプセル化
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import { BlockEditor } from './components/BlockEditor';
import { useBlockManager } from './hooks/useBlockManager';
import { usePreviewManager } from './hooks/usePreviewManager';
import { useKeyboardNavigation, KeyboardNavigationConfig, KeyboardNavigationHandlers } from './hooks/useKeyboardNavigation';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useSearchReplace } from './hooks/useSearchReplace';
import { OperationHandlerService } from './services/operationHandlerService';
import { getEmailTemplates, sendMail, MailSendRequest } from './services/apiService';
import { Block, BlockType, BlockStyle } from './types';

interface EmailTemplates {
  default_recipient: string;
  subject_templates: string[];
  default_subject: string;
  body_templates: string[];
}

function App() {
  const blockManager = useBlockManager();
  const previewManager = usePreviewManager();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplates | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedBodyTemplate, setSelectedBodyTemplate] = useState<string>('');
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [importText, setImportText] = useState('');

  // アンドゥ/リドゥ機能
  const undoRedo = useUndoRedo();

  // 検索・置換機能
  const searchReplace = useSearchReplace();

  // キーボードナビゲーション設定
  const keyboardConfig: KeyboardNavigationConfig = {
    enableArrowKeys: true,
    enableCtrlSpace: true,
    enableShiftSpace: true,
    enableContextMenu: true,
  };

  // キーボードナビゲーションハンドラー
  const keyboardHandlers: KeyboardNavigationHandlers = {
    onBlockMove: (direction: 'up' | 'down') => {
      if (direction === 'up') {
        blockManager.navigateToPreviousBlock();
        // 移動後にカーソルを移動（少し遅延）
        setTimeout(() => {
          if (blockManager.focusedBlockId) {
            blockManager.focusBlockWithCursor(blockManager.focusedBlockId);
          }
        }, 20);
      } else {
        blockManager.navigateToNextBlock();
        // 移動後にカーソルを移動（少し遅延）
        setTimeout(() => {
          if (blockManager.focusedBlockId) {
            blockManager.focusBlockWithCursor(blockManager.focusedBlockId);
          }
        }, 20);
      }
    },
    onBlockCreate: (blockType: BlockType) => {
      // 現在フォーカスされているブロックの後に新しいブロックを作成
      if (blockManager.focusedBlockId) {
        const newBlockId = blockManager.addBlock(blockType, blockManager.focusedBlockId);
        // 新しく作成されたブロックにカーソルを移動
        blockManager.focusBlockWithCursor(newBlockId);
      } else {
        // フォーカスされていない場合は最後に追加
        const newBlockId = blockManager.addBlock(blockType);
        // 新しく作成されたブロックにカーソルを移動
        blockManager.focusBlockWithCursor(newBlockId);
      }
    },
    onBlockTypeChange: (blockId: string, newType: BlockType) => {
      blockManager.changeBlockType(blockId, newType);
    },
    onBlockStyleChange: (blockId: string, newStyle: BlockStyle) => {
      blockManager.changeBlockStyle(blockId, newStyle);
    },
    onBlockDelete: (blockId: string) => {
      blockManager.deleteBlock(blockId);
    },
    onBlockSelect: (blockId: string) => {
      blockManager.focusBlock(blockId);
    },
    onSelectAll: (blockId: string) => {
      blockManager.selectAllInBlock(blockId);
    },
    onUndo: () => {
      undoRedo.undo();
    },
    onRedo: () => {
      undoRedo.redo();
    },
    onSearch: () => {
      // 検索UIを表示（後で実装）
      console.log('検索機能を開始');
    },
    onReplace: () => {
      // 置換UIを表示（後で実装）
      console.log('置換機能を開始');
    },
  };

  // キーボードナビゲーション
  const keyboardNavigation = useKeyboardNavigation(keyboardConfig, keyboardHandlers);

  // 現在のブロック情報を取得
  const currentBlock = blockManager.blocks.find(b => b.id === blockManager.focusedBlockId);
  const currentBlockType = currentBlock?.type;
  const currentBlockStyle = currentBlock?.style || 'normal';

  // キーボードナビゲーション（現在のブロック情報付き）
  const keyboardNavigationWithBlockInfo = useKeyboardNavigation(
    keyboardConfig, 
    keyboardHandlers,
    currentBlockType,
    currentBlockStyle
  );

  useEffect(() => {
    loadEmailTemplates();
  }, []);

  // 初期フォーカスの設定
  useEffect(() => {
    if (blockManager.blocks.length > 0 && !blockManager.focusedBlockId) {
      blockManager.focusBlockWithCursor(blockManager.blocks[0].id);
    }
  }, [blockManager.blocks, blockManager.focusedBlockId, blockManager.focusBlockWithCursor]);

  // ブロック変更時にアンドゥ/リドゥの状態を保存
  useEffect(() => {
    if (blockManager.blocks.length > 0) {
      undoRedo.saveState(blockManager.blocks, blockManager.focusedBlockId);
    }
  }, [blockManager.blocks, blockManager.focusedBlockId, undoRedo]);

  // キーボードナビゲーションの現在ブロックIDを同期
  useEffect(() => {
    keyboardNavigationWithBlockInfo.setCurrentBlockId(blockManager.focusedBlockId);
  }, [blockManager.focusedBlockId, keyboardNavigationWithBlockInfo]);

  const loadEmailTemplates = async () => {
    try {
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
      if (templates.subject_templates.length > 0) {
        setSelectedSubject(templates.subject_templates[0]);
      }
      if (templates.body_templates.length > 0) {
        setSelectedBodyTemplate(templates.body_templates[0]);
      }
    } catch (error) {
      console.error('メールテンプレート読み込みエラー:', error);
    }
  };

  const handleImportFromTextBox = async () => {
    if (!importText.trim()) {
      alert('テキストを入力してください');
      return;
    }
    const result = await OperationHandlerService.handleImportFromText(importText);
    if (result.success && result.data) {
      blockManager.setBlocks(result.data);
      setImportText(''); // 読み込み後クリア
    } else {
      alert('テキストの読み込みに失敗しました');
    }
  };

  const handleImportFromText = async () => {
    const htmlText = prompt('HTMLテキストを入力してください:');
    if (htmlText) {
      const result = await OperationHandlerService.handleImportFromText(htmlText);
      if (result.success && result.data) {
        blockManager.setBlocks(result.data);
      }
    }
  };

  const handleDownloadHtml = async () => {
    const filename = prompt('ファイル名を入力してください:', 'document.html');
    if (filename) {
      await OperationHandlerService.handleDownloadHtml(blockManager.blocks, filename);
    }
  };

  const handleCopyToClipboard = async () => {
    await OperationHandlerService.handleCopyToClipboard(blockManager.blocks);
  };

  const handleSendMail = async () => {
    if (!emailTemplates) {
      alert('メールテンプレートが読み込まれていません');
      return;
    }

    const recipient = customRecipient || emailTemplates.default_recipient;
    if (!recipient) {
      alert('宛先メールアドレスが設定されていません');
      return;
    }

    const subject = selectedSubject || emailTemplates.default_subject;
    
    // 本文に選択されたテンプレートを追加
    let htmlContent = await previewManager.generatePreview(blockManager.blocks);
    if (selectedBodyTemplate) {
      htmlContent = `<p>${selectedBodyTemplate}</p>\n${htmlContent}`;
    }
    
    try {
      const request: MailSendRequest = {
        subject: subject,
        html_content: htmlContent,
        recipient_email: recipient
      };

      const result = await sendMail(request);
      if (result.success) {
        alert('メールが正常に送信されました');
      } else {
        alert(`メール送信に失敗しました: ${result.message}`);
      }
    } catch (error) {
      alert(`メール送信中にエラーが発生しました: ${error}`);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>HTML Editor</h1>
          <div className="header-import-box">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="ここにHTMLやテキストを貼り付けてください"
              rows={3}
              style={{ width: '350px', resize: 'vertical', marginRight: '8px' }}
            />
            <button onClick={handleImportFromTextBox} className="header-button">
              読み込み
            </button>
          </div>
          <div className="header-buttons">
            <button onClick={handleDownloadHtml} className="header-button">
              HTMLダウンロード
            </button>
            <button onClick={handleCopyToClipboard} className="header-button">
              クリップボードにコピー
            </button>
            <button onClick={handleSendMail} className="header-button">
              メール送信
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          {/* Layoutを廃止しBlockEditorを直接配置 */}
          <BlockEditor
            blocks={blockManager.blocks}
            onBlockUpdate={blockManager.updateBlock}
            onBlockAdd={blockManager.addBlock}
            onBlockDelete={blockManager.deleteBlock}
            onBlockMove={blockManager.moveBlock}
            focusedBlockId={blockManager.focusedBlockId}
            onBlockFocus={blockManager.focusBlock}
            onBlockStyleChange={blockManager.changeBlockStyle}
          />
        </div>
      </main>

      {/* メール送信設定 */}
      {emailTemplates && (
        <div className="email-settings">
          <div className="email-setting-item">
            <label>宛先:</label>
            <input
              type="email"
              value={customRecipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              placeholder={emailTemplates.default_recipient || 'メールアドレスを入力'}
            />
          </div>
          <div className="email-setting-item">
            <label>件名:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {emailTemplates.subject_templates.map((template, index) => (
                <option key={index} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
          <div className="email-setting-item">
            <label>本文冒頭:</label>
            <select
              value={selectedBodyTemplate}
              onChange={(e) => setSelectedBodyTemplate(e.target.value)}
            >
              {emailTemplates.body_templates.map((template, index) => (
                <option key={index} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
