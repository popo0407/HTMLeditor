/**
 * 操作ハンドラーサービス
 * 
 * 責務:
 * - 共通のエラーハンドリングパターンの提供
 * - 操作結果の統一的な処理
 * 
 * 開発憲章の「DRY原則」に従い、重複するエラーハンドリングロジックを統一
 */
import { Block } from '../types';
import { ErrorHandlerService, ErrorCategory } from './errorHandlerService';
import { clipboardService } from './clipboardService';

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export class OperationHandlerService {
  /**
   * エラーハンドリング付きで操作を実行
   */
  static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    category: ErrorCategory,
    successMessage?: string
  ): Promise<OperationResult<T>> {
    try {
      const result = await operation();
      if (successMessage) {
        ErrorHandlerService.showSuccess(successMessage);
      }
      return { success: true, data: result };
    } catch (error) {
      ErrorHandlerService.handleError(new Error(errorMessage), category);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * クリップボードからの読み込みを処理
   */
  static async handleImportFromClipboard(): Promise<OperationResult<Block[]>> {
    return this.executeWithErrorHandling(
      async () => {
        const blocks = await clipboardService.importFromClipboard();
        return blocks;
      },
      'クリップボードからの読み込みに失敗しました',
      ErrorCategory.CLIPBOARD_OPERATION,
      'クリップボードから正常に読み込みました'
    );
  }

  /**
   * テキストからの読み込みを処理
   */
  static async handleImportFromText(htmlText: string): Promise<OperationResult<Block[]>> {
    return this.executeWithErrorHandling(
      async () => {
        const blocks = await clipboardService.importFromText(htmlText);
        return blocks;
      },
      'テキストからの読み込みに失敗しました',
      ErrorCategory.CLIPBOARD_OPERATION,
      'テキストから正常に読み込みました'
    );
  }

  /**
   * HTMLダウンロードを処理
   */
  static async handleDownloadHtml(blocks: Block[], filename?: string): Promise<OperationResult<boolean>> {
    return this.executeWithErrorHandling(
      async () => {
        await clipboardService.downloadHtmlFile(blocks, filename);
        return true;
      },
      'HTMLダウンロードに失敗しました',
      ErrorCategory.CLIPBOARD_OPERATION,
      'HTMLファイルを正常にダウンロードしました'
    );
  }

  /**
   * クリップボードへのコピーを処理
   */
  static async handleCopyToClipboard(blocks: Block[]): Promise<OperationResult<boolean>> {
    return this.executeWithErrorHandling(
      async () => {
        await clipboardService.copyHtmlToClipboard(blocks);
        return true;
      },
      'クリップボードへのコピーに失敗しました',
      ErrorCategory.CLIPBOARD_OPERATION,
      'クリップボードに正常にコピーしました'
    );
  }
} 