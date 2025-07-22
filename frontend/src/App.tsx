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
import { Block, BlockType, BlockStyle, AppState } from './types';
import { clipboardService } from './services/clipboardService';
import './App.css';

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

      console.log(`${importedBlocks.length}個のブロックをインポートしました`);
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
          // テーブルブロックの場合、contentはJSONStringified blockデータ
          if (block.type === 'table') {
            try {
              const updatedBlock = JSON.parse(content);
              return { ...block, ...updatedBlock };
            } catch (error) {
              console.error('テーブルデータの解析に失敗しました:', error);
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

  // メール送信ハンドラー（フェーズ3で詳細実装）
  const handleSendMail = () => {
    console.log('メール送信機能（フェーズ3で実装予定）');
    alert('メール送信機能はフェーズ3で実装予定です');
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
      default: return '';
    }
  };

  // プレビュー/編集モードの切り替え
  const togglePreviewMode = () => {
    setAppState(prev => ({
      ...prev,
      isPreviewMode: !prev.isPreviewMode,
    }));
  };

  return (
    <div className="App">
      <Layout
        header={
          <div className="app-header">
            <h1>HTML Editor</h1>
            <div className="header-controls">
              <button 
                className={`btn ${appState.isPreviewMode ? 'btn-primary' : ''}`}
                onClick={togglePreviewMode}
              >
                {appState.isPreviewMode ? '📝 編集モード' : '👁 プレビューモード'}
              </button>
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
          />
        }
      >
        <div className="main-content">
          {appState.isPreviewMode ? (
            <div className="preview-area">
              <h2>プレビューエリア</h2>
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
          ) : (
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
          )}
        </div>
      </Layout>
    </div>
  );
}

export default App;
