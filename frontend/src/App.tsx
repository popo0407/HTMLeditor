/**
 * メインアプリケーションコンポーネント
 * 
 * 責務:
 * - アプリケーション全体のレイアウト統合
 * - 各カスタムフックとサービスの統合
 * - UIイベントの統括
 * 
 * 開発憲章の「関心の分離」に従い、状態管理はカスタムフックに委譲
 */

import React from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { BlockEditor } from './components/BlockEditor';
import { AddressBookManager } from './components/AddressBookManager';
import { BlockType } from './types';
import { useBlockManager, usePreviewManager, useAddressBookManager } from './hooks';
import { BlockOperationService, MailOperationService } from './services';
import { ErrorHandlerService, ErrorCategory } from './services/errorHandlerService';
import './App.css';

function App() {
  // カスタムフックによる状態管理（開発憲章の「関心の分離」に従う）
  const blockManager = useBlockManager();
  const previewManager = usePreviewManager(blockManager.blocks);
  const addressBookManager = useAddressBookManager();

  // クリップボード読み込みハンドラー
  const handleImportFromClipboard = async () => {
    try {
      const importedBlocks = await BlockOperationService.importFromClipboard();
      blockManager.setBlocks(importedBlocks);
      blockManager.selectBlock(importedBlocks.length > 0 ? importedBlocks[0].id : null);

      const message = BlockOperationService.generateImportMessage(importedBlocks);
      ErrorHandlerService.showInfo(message);
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('クリップボードの読み込みに失敗しました'),
        ErrorCategory.CLIPBOARD
      );
    }
  };

  // テキストボックス読み込みハンドラー
  const handleImportFromText = (htmlText: string) => {
    try {
      const importedBlocks = BlockOperationService.importFromText(htmlText);
      blockManager.setBlocks(importedBlocks);
      blockManager.selectBlock(importedBlocks.length > 0 ? importedBlocks[0].id : null);

      const message = BlockOperationService.generateImportMessage(importedBlocks);
      ErrorHandlerService.showInfo(message);
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('テキストの読み込みに失敗しました'),
        ErrorCategory.VALIDATION
      );
    }
  };

  // HTML出力ハンドラー
  const handleDownloadHtml = async () => {
    try {
      const success = await BlockOperationService.downloadHtmlFile(blockManager.blocks);
      if (success) {
        ErrorHandlerService.showSuccess('HTMLファイルがダウンロードされました');
      } else {
        ErrorHandlerService.handleError(
          'HTMLファイルのダウンロードに失敗しました',
          ErrorCategory.FILE_OPERATION
        );
      }
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('HTMLファイルのダウンロードに失敗しました'),
        ErrorCategory.FILE_OPERATION
      );
    }
  };

  // クリップボードにHTMLコピー
  const handleCopyToClipboard = async () => {
    try {
      const success = await BlockOperationService.copyHtmlToClipboard(blockManager.blocks);
      if (success) {
        ErrorHandlerService.showSuccess('HTMLがクリップボードにコピーされました');
      } else {
        ErrorHandlerService.handleError(
          'HTMLのコピーに失敗しました',
          ErrorCategory.CLIPBOARD
        );
      }
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('クリップボードへのコピーに失敗しました'),
        ErrorCategory.CLIPBOARD
      );
    }
  };

  // メール送信ハンドラー
  const handleSendMail = async () => {
    // 前提条件チェック
    const validation = MailOperationService.validateMailSendConditions(blockManager.blocks);
    if (!validation.isValid) {
      ErrorHandlerService.handleError(
        validation.error || 'メール送信の前提条件を満たしていません',
        ErrorCategory.VALIDATION
      );
      return;
    }

    // メール送信の詳細設定
    const subject = ErrorHandlerService.showPrompt('件名を入力してください:', 'HTML Editor - ドキュメント');
    if (!subject) return;

    const additionalEmails = ErrorHandlerService.showPrompt('追加受信者のメールアドレスを入力してください（複数の場合はカンマ区切り）:');

    try {
      const result = await MailOperationService.sendMail({
        blocks: blockManager.blocks,
        commonId: addressBookManager.currentCommonId || undefined,
        subject,
        additionalEmails: additionalEmails || undefined,
      });

      if (result.success) {
        ErrorHandlerService.showSuccess(`メール送信が完了しました。\n送信先: ${result.recipients.join(', ')}`);
      } else {
        ErrorHandlerService.handleError(
          result.error || 'メール送信に失敗しました',
          ErrorCategory.NETWORK
        );
      }
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('メール送信に失敗しました'),
        ErrorCategory.NETWORK
      );
    }
  };

  // アドレス帳管理ハンドラー
  const handleManageAddressBook = () => {
    console.log('アドレス帳管理機能');
  };

  return (
    <div className="App">
      <Layout
        header={
          <div className="app-header">
            <h1>HTML Editor</h1>
            <div className="header-controls">
              <button 
                className="btn"
                onClick={handleDownloadHtml}
                disabled={blockManager.blocks.length === 0}
              >
                💾 HTML保存
              </button>
              <button 
                className="btn"
                onClick={handleCopyToClipboard}
                disabled={blockManager.blocks.length === 0}
              >
                📋 コピー
              </button>
            </div>
          </div>
        }
        sidebar={
          <Sidebar
            onAddBlock={blockManager.addBlock}
            onImportFromClipboard={handleImportFromClipboard}
            onImportFromText={handleImportFromText}
          />
        }
      >
        <div className="main-content split-view">
          <div className="editor-pane">
            <div className="pane-header">
              <h3>📝 編集エリア</h3>
            </div>
            <div className="pane-content">
              <BlockEditor
                blocks={blockManager.blocks}
                selectedBlockId={blockManager.selectedBlockId}
                onBlockSelect={blockManager.selectBlock}
                onBlockUpdate={blockManager.updateBlock}
                onBlockDelete={blockManager.deleteBlock}
                onBlockAdd={blockManager.addBlock}
                onBlockMove={blockManager.moveBlock}
                onBlockStyleChange={blockManager.changeBlockStyle}
              />
            </div>
          </div>
          
          <div className="preview-pane">
            <div className="pane-header">
              <h3>👁 プレビューエリア</h3>
            </div>
            <div className="pane-content">
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: previewManager.previewHtml }}
              />
            </div>
          </div>
        </div>
      </Layout>

      {/* アドレス帳管理モーダル */}
      <AddressBookManager
        onEntrySelect={(entry) => {
          console.log('Selected entry:', entry);
        }}
      />
    </div>
  );
}

export default App;
