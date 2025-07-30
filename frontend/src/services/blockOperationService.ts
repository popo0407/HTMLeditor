/**
 * ブロック操作サービス
 * 
 * 責務:
 * - ブロックのインポート処理
 * - ファイル操作（ダウンロード、コピー）
 * - ブロックタイプの表示名管理
 * 
 * 開発憲章の「関心の分離」と「ビジネスロジックとDOM操作を分離」に従う
 */

import { Block, BlockType } from '../types';
import { clipboardService } from './clipboardService';

/**
 * ブロックタイプの表示名を取得
 */
export const getBlockTypeDisplayName = (type: string): string => {
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

/**
 * ブロック操作サービス
 */
export class BlockOperationService {
  /**
   * クリップボードからブロックをインポート
   */
  static async importFromClipboard(): Promise<Block[]> {
    try {
      const importedBlocks = await clipboardService.importFromClipboard();
      return importedBlocks;
    } catch (error) {
      console.error('クリップボードの読み込みに失敗しました:', error);
      throw error;
    }
  }

  /**
   * テキストからブロックをインポート
   */
  static importFromText(htmlText: string): Block[] {
    try {
      const importedBlocks = clipboardService.importFromText(htmlText);
      return importedBlocks;
    } catch (error) {
      console.error('テキストの読み込みに失敗しました:', error);
      throw error;
    }
  }

  /**
   * インポート結果の詳細メッセージを生成
   */
  static generateImportMessage(importedBlocks: Block[]): string {
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

    return message;
  }

  /**
   * HTMLファイルをダウンロード
   */
  static async downloadHtmlFile(blocks: Block[]): Promise<boolean> {
    try {
      // ファイル名を生成
      let filename = 'document';
      
      // 一番上のブロックのテキスト内容を取得
      if (blocks.length > 0) {
        const firstBlock = blocks[0];
        let blockText = '';
        
        switch (firstBlock.type) {
          case 'heading1':
          case 'heading2':
          case 'heading3':
          case 'paragraph':
            blockText = firstBlock.content.trim();
            break;
          case 'bulletList':
            // リストの最初の項目を取得
            const firstItem = firstBlock.content.split('\n')[0].trim();
            blockText = firstItem;
            break;
          case 'table':
            // テーブルの最初のセルの内容を取得
            if (firstBlock.tableData && firstBlock.tableData.rows.length > 0) {
              blockText = firstBlock.tableData.rows[0][0] || '';
            }
            break;
          default:
            blockText = firstBlock.content.trim();
        }
        
        // テキストが存在し、適切な長さの場合にファイル名に使用
        if (blockText && blockText.length > 0 && blockText.length <= 50) {
          // 特殊文字を除去してファイル名に使用
          const cleanText = blockText
            .replace(/[<>:"/\\|?*]/g, '') // ファイル名に使用できない文字を除去
            .replace(/\s+/g, '_') // スペースをアンダースコアに変更
            .substring(0, 30); // 最大30文字に制限
          
          if (cleanText) {
            filename = cleanText;
          }
        }
      }
      
      // 年月日を追加
      const today = new Date();
      const dateStr = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
      
      const finalFilename = `${filename}_${dateStr}.html`;
      
      const success = await clipboardService.downloadHtmlFile(blocks, finalFilename);
      return success;
    } catch (error) {
      console.error('HTMLダウンロードエラー:', error);
      throw error;
    }
  }

  /**
   * HTMLをクリップボードにコピー
   */
  static async copyHtmlToClipboard(blocks: Block[]): Promise<boolean> {
    try {
      const success = await clipboardService.copyHtmlToClipboard(blocks);
      return success;
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
      throw error;
    }
  }
} 