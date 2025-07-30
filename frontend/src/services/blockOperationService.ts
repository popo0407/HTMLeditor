/**
 * ブロック操作サービス
 * 
 * 責務:
 * - ブロックのインポート処理
 * - ブロックのエクスポート処理
 * - バリデーション処理
 * 
 * 開発憲章の「単一責任の原則」に従い、ブロック操作のみを担当
 */

import { Block } from '../types';
import { clipboardService } from './clipboardService';
import { ValidationService } from './validationService';
import { ErrorHandlerService, ErrorCategory } from './errorHandlerService';

export class BlockOperationService {
  /**
   * クリップボードからブロックをインポート
   */
  static async importFromClipboard(): Promise<Block[]> {
    try {
      const blocks = await clipboardService.importFromClipboard();
      
      // バリデーション
      const validation = ValidationService.validateBlocks(blocks);
      if (!validation.isValid) {
        ErrorHandlerService.handleError(
          new Error(`インポートされたブロックに問題があります: ${validation.errors.join(', ')}`),
          ErrorCategory.VALIDATION
        );
      }
      
      return blocks;
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('クリップボードの読み込みに失敗しました'),
        ErrorCategory.CLIPBOARD_OPERATION
      );
      throw error;
    }
  }

  /**
   * テキストからブロックをインポート
   */
  static importFromText(htmlText: string): Block[] {
    try {
      const blocks = clipboardService.importFromText(htmlText);
      
      // バリデーション
      const validation = ValidationService.validateBlocks(blocks);
      if (!validation.isValid) {
        ErrorHandlerService.handleError(
          new Error(`インポートされたブロックに問題があります: ${validation.errors.join(', ')}`),
          ErrorCategory.VALIDATION
        );
      }
      
      return blocks;
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('テキストの読み込みに失敗しました'),
        ErrorCategory.VALIDATION
      );
      throw error;
    }
  }

  /**
   * ブロックをHTMLファイルとしてダウンロード
   */
  static async downloadHtmlFile(blocks: Block[], filename: string = 'document.html'): Promise<boolean> {
    try {
      // ブロックのバリデーション
      const validation = ValidationService.validateBlocks(blocks);
      if (!validation.isValid) {
        ErrorHandlerService.handleError(
          new Error(`ダウンロードするブロックに問題があります: ${validation.errors.join(', ')}`),
          ErrorCategory.VALIDATION
        );
      }

      // ファイル名のバリデーション
      const filenameValidation = ValidationService.validateFilename(filename);
      if (!filenameValidation.isValid) {
        ErrorHandlerService.handleError(
          new Error(`ファイル名に問題があります: ${filenameValidation.errors.join(', ')}`),
          ErrorCategory.VALIDATION
        );
      }

      // HTMLファイルのダウンロード
      return await clipboardService.downloadHtmlFile(blocks, filename);
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('HTMLダウンロードエラー'),
        ErrorCategory.FILE_OPERATION
      );
      throw error;
    }
  }

  /**
   * ブロックをクリップボードにコピー
   */
  static async copyToClipboard(blocks: Block[]): Promise<boolean> {
    try {
      // ブロックのバリデーション
      const validation = ValidationService.validateBlocks(blocks);
      if (!validation.isValid) {
        ErrorHandlerService.handleError(
          new Error(`コピーするブロックに問題があります: ${validation.errors.join(', ')}`),
          ErrorCategory.VALIDATION
        );
      }

      // クリップボードにコピー
      return await clipboardService.copyHtmlToClipboard(blocks);
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('クリップボードへのコピーに失敗しました'),
        ErrorCategory.CLIPBOARD_OPERATION
      );
      throw error;
    }
  }

  /**
   * インポートメッセージを生成
   */
  static generateImportMessage(blocks: Block[]): string {
    if (blocks.length === 0) {
      return 'インポートされたブロックがありません';
    }
    
    const blockTypes = blocks.map(block => block.type);
    const uniqueTypes = Array.from(new Set(blockTypes));
    const typeCounts = uniqueTypes.map(type => {
      const count = blockTypes.filter(t => t === type).length;
      return `${type}: ${count}個`;
    });
    
    return `インポート完了: ${blocks.length}個のブロック (${typeCounts.join(', ')})`;
  }
} 