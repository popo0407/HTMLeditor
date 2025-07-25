/**
 * メインアプリケーションコンポーネント
 * 
 * 責務:
 * - アプリケーション全体の状態管理
 * - レイアウトとコンポーネントの統合
 * - ブロックエディタの操作統括
 * 
 * フェーズ2: ブロックエディタの基本機能実装完了
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { BlockEditor } from './components/BlockEditor';
import { AddressBookManager } from './components/AddressBookManager';
import { Block, BlockType, BlockStyle, AppState } from './types';
import { clipboardService } from './services/clipboardService';
import { apiService } from './services/apiService';
import './App.css';

// ブロックタイプの表示名を取得するヘルパー関数
const getBlockTypeDisplayName = (type: string): string => {
  const displayNames: Record<string, string> = {
    heading1: 'タイトル(H1)',
    heading2: 'サブタイトル(H2)',
    heading3: '小見出し(H3)',
    paragraph: '段落',
    bulletList: 'リスト',
    table: 'テーブル',
    image: '画像',
    horizontalRule: '区切り線',
    calendar: 'カレンダー'
  };
  return displayNames[type] || type;
};

function App() {
  // アプリケーション状態の管理
  const [appState, setAppState] = useState<AppState>({
    blocks: [],
    selectedBlockId: null,
    currentCommonId: null,
    contacts: [],
    isPreviewMode: false,
  });

  // ブロック追加ハンドラー（F-001-2対応）
  const handleAddBlock = (blockType: BlockType, insertAfter?: string) => {
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

    setAppState(prev => {
      let newBlocks;
      if (insertAfter) {
        const insertIndex = prev.blocks.findIndex(b => b.id === insertAfter);
        newBlocks = [
          ...prev.blocks.slice(0, insertIndex + 1),
          newBlock,
          ...prev.blocks.slice(insertIndex + 1)
        ];
      } else {
        newBlocks = [...prev.blocks, newBlock];
      }

      return {
        ...prev,
        blocks: newBlocks,
        selectedBlockId: newBlock.id,
      };
    });
  };

  // クリップボード読み込みハンドラー（F-001-1対応）
  const handleImportFromClipboard = async () => {
    try {
      const importedBlocks = await clipboardService.importFromClipboard();
      
      setAppState(prev => ({
        ...prev,
        blocks: importedBlocks,
        selectedBlockId: importedBlocks.length > 0 ? importedBlocks[0].id : null,
      }));

      // 読み込み結果の詳細を表示
      const blockTypeCounts = importedBlocks.reduce((counts, block) => {
        counts[block.type] = (counts[block.type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const scheduleBlocks = importedBlocks.filter(block => block.type === 'calendar');
      const scheduleMessage = scheduleBlocks.length > 0 
        ? `\n・スケジュール: ${scheduleBlocks.length}個のカレンダー`
        : '';

      const message = `クリップボードから ${importedBlocks.length}個のブロックを読み込みました:\n` +
        Object.entries(blockTypeCounts)
          .map(([type, count]) => `・${getBlockTypeDisplayName(type)}: ${count}個`)
          .join('\n') + scheduleMessage;

      console.log(message);
      alert(message);
    } catch (error) {
      console.error('クリップボードの読み込みに失敗しました:', error);
      alert(`クリップボードの読み込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // ブロック選択ハンドラー
  const handleBlockSelect = (blockId: string) => {
    setAppState(prev => ({
      ...prev,
      selectedBlockId: blockId,
    }));
  };

  // ブロック更新ハンドラー（F-001-4対応）
  const handleBlockUpdate = (blockId: string, content: string) => {
    setAppState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => {
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
      }),
    }));
  };

  // ブロック削除ハンドラー（F-001-6対応）
  const handleBlockDelete = (blockId: string) => {
    setAppState(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
      selectedBlockId: prev.selectedBlockId === blockId ? null : prev.selectedBlockId,
    }));
  };

  // ブロック移動ハンドラー（F-001-7対応）
  const handleBlockMove = (blockId: string, direction: 'up' | 'down') => {
    setAppState(prev => {
      const currentIndex = prev.blocks.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.blocks.length) return prev;

      const newBlocks = [...prev.blocks];
      [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];

      return {
        ...prev,
        blocks: newBlocks,
      };
    });
  };

  // ブロックスタイル変更ハンドラー（F-001-3対応）
  const handleBlockStyleChange = (blockId: string, style: BlockStyle) => {
    setAppState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId
          ? { ...block, style: style }
          : block
      ),
    }));
  };

  // HTML出力ハンドラー（F-003-1対応）
  const handleDownloadHtml = () => {
    const html = clipboardService.blocksToHtml(appState.blocks);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // クリップボードにHTMLコピー（F-003-3対応）
  const handleCopyToClipboard = async () => {
    try {
      const html = clipboardService.blocksToHtml(appState.blocks);
      await navigator.clipboard.writeText(html);
      alert('HTMLがクリップボードにコピーされました');
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      alert('クリップボードへのコピーに失敗しました');
    }
  };

  // メール送信ハンドラー（F-004, F-005対応）
  const handleSendMail = async () => {
    if (appState.blocks.length === 0) {
      alert('送信するコンテンツがありません');
      return;
    }

    // 共通IDの確認
    if (!appState.currentCommonId) {
      const commonId = prompt('メール送信用の共通IDを入力してください:');
      if (!commonId) return;
      
      try {
        // 共通IDの存在確認
        const validation = await apiService.validateAddressBook({ common_id: commonId });
        if (!validation.exists) {
          // eslint-disable-next-line no-restricted-globals
          const create = confirm('指定された共通IDのアドレス帳が存在しません。新しく作成しますか？');
          if (!create) return;
          
          await apiService.createAddressBook(commonId);
          alert('アドレス帳を作成しました。連絡先を追加してからメールを送信してください。');
          return;
        }
        
        setAppState(prev => ({ ...prev, currentCommonId: commonId }));
      } catch (error) {
        console.error('共通ID確認エラー:', error);
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        alert(`共通IDの確認に失敗しました。\n\nエラー詳細: ${errorMessage}\n\nバックエンドサーバーが起動していることを確認してください。`);
        return;
      }
    }

    // メール送信の詳細設定
    const subject = prompt('件名を入力してください:', 'HTML Editor - ドキュメント');
    if (!subject) return;

    const additionalEmails = prompt('追加受信者のメールアドレスを入力してください（複数の場合はカンマ区切り）:');

    try {
      // HTMLコンテンツを生成
      const htmlContent = clipboardService.blocksToHtml(appState.blocks);
      
      // メール送信
      const result = await apiService.sendMail({
        commonId: appState.currentCommonId!,
        subject,
        htmlContent,
        recipientEmails: additionalEmails || undefined
      });

      alert(`メール送信が完了しました。\n送信先: ${result.recipients.join(', ')}`);
    } catch (error) {
      console.error('メール送信エラー:', error);
      alert(`メール送信に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // アドレス帳管理ハンドラー
  const handleManageAddressBook = () => {
    console.log('アドレス帳管理機能');
  };

  // ブロックタイプに応じたデフォルトコンテンツ
  const getDefaultContent = (blockType: BlockType): string => {
    switch (blockType) {
      case 'heading1': return '大見出し';
      case 'heading2': return '中見出し';
      case 'heading3': return '小見出し';
      case 'paragraph': return '';
      case 'bulletList': return '新しいリスト項目';
      case 'table': return 'テーブルセル';
      case 'horizontalRule': return '';
      case 'image': return '';
      case 'calendar': return 'カレンダー (0件のイベント)';
      default: return '';
    }
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
                disabled={appState.blocks.length === 0}
              >
                💾 HTML保存
              </button>
              <button 
                className="btn"
                onClick={handleCopyToClipboard}
                disabled={appState.blocks.length === 0}
              >
                📋 コピー
              </button>
            </div>
          </div>
        }
        sidebar={
          <Sidebar
            onAddBlock={handleAddBlock}
            onImportFromClipboard={handleImportFromClipboard}
            onSendMail={handleSendMail}
            onManageAddressBook={handleManageAddressBook}
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
                blocks={appState.blocks}
                selectedBlockId={appState.selectedBlockId}
                onBlockSelect={handleBlockSelect}
                onBlockUpdate={handleBlockUpdate}
                onBlockDelete={handleBlockDelete}
                onBlockAdd={handleAddBlock}
                onBlockMove={handleBlockMove}
                onBlockStyleChange={handleBlockStyleChange}
              />
            </div>
          </div>
          
          <div className="preview-pane">
            <div className="pane-header">
              <h3>👁 プレビューエリア</h3>
            </div>
            <div className="pane-content">
              <style>
                {`
                  .preview-content table.important th {
                    background-color: rgba(255, 193, 7, 0.3) !important;
                    border-bottom: 2px solid #ffc107 !important;
                    font-weight: bold;
                  }
                  .preview-content table.action-item th {
                    background-color: rgba(40, 167, 69, 0.2) !important;
                    border-bottom: 2px solid #28a745 !important;
                    font-weight: bold;
                  }
                  .preview-content .important {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                  }
                  .preview-content .action-item {
                    background-color: #d4edda;
                    border-left: 4px solid #28a745;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                  }
                  .preview-content table.important {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                  }
                  .preview-content table.action-item {
                    background-color: #d4edda;
                    border-left: 4px solid #28a745;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 4px;
                  }
                `}
              </style>
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ 
                  __html: clipboardService.blocksToHtml(appState.blocks)
                    .replace(/<!DOCTYPE html>[\s\S]*<body>/, '')
                    .replace(/<\/body>[\s\S]*<\/html>/, '')
                }}
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
