/**
 * メール送信操作サービス
 * 
 * 責務:
 * - メール送信のビジネスロジック
 * - 共通IDの検証とアドレス帳作成
 * - メール送信の状態管理
 * 
 * 開発憲章の「関心の分離」と「ビジネスロジックとDOM操作を分離」に従う
 */

import { Block } from '../types';
import { apiService } from './apiService';
import { clipboardService } from './clipboardService';
import { ErrorHandlerService, ErrorCategory } from './errorHandlerService';
import { ValidationService } from './validationService';

export interface MailSendRequest {
  blocks: Block[];
  commonId?: string | null;
  subject?: string;
  additionalEmails?: string | null;
}

export interface MailSendResult {
  success: boolean;
  recipients: string[];
  error?: string;
}

/**
 * メール送信操作サービス
 */
export class MailOperationService {
  /**
   * メール送信の実行
   */
  static async sendMail(request: MailSendRequest): Promise<MailSendResult> {
    try {
      // ブロックのバリデーション
      const blockValidation = ValidationService.validateBlocks(request.blocks);
      if (!blockValidation.isValid) {
        ErrorHandlerService.handleError(
          `メール送信するブロックに問題があります: ${blockValidation.errors.join(', ')}`,
          ErrorCategory.VALIDATION
        );
      }

      // 共通IDの確認
      const commonId = await this.validateAndGetCommonId(request.commonId);
      
      // 件名の取得
      const subject = request.subject || 'HTML Editor - ドキュメント';
      
      // HTMLコンテンツを生成
      const htmlContent = await clipboardService.generatePreviewHtml(request.blocks);
      
      // メール送信
      const result = await apiService.sendMail({
        commonId,
        subject,
        htmlContent,
        recipientEmails: request.additionalEmails || undefined
      });

      return {
        success: true,
        recipients: result.recipients,
      };
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('メール送信エラー'),
        ErrorCategory.NETWORK
      );
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        recipients: [],
        error: errorMessage,
      };
    }
  }

  /**
   * 共通IDの検証と取得
   */
  private static async validateAndGetCommonId(commonId?: string | null): Promise<string> {
    if (!commonId) {
      const inputCommonId = ErrorHandlerService.showPrompt('メール送信用の共通IDを入力してください:');
      if (!inputCommonId) {
        throw new Error('共通IDが入力されませんでした');
      }
      commonId = inputCommonId;
    }

    // 共通IDのバリデーション
    const validation = ValidationService.validateCommonId(commonId);
    if (!validation.isValid) {
      ErrorHandlerService.handleError(
        `共通IDに問題があります: ${validation.errors.join(', ')}`,
        ErrorCategory.VALIDATION
      );
    }

    try {
      // 共通IDの存在確認
      const validation = await apiService.validateAddressBook({ common_id: commonId });
      if (!validation.exists) {
        const create = ErrorHandlerService.showConfirm('指定された共通IDのアドレス帳が存在しません。新しく作成しますか？');
        if (!create) {
          throw new Error('アドレス帳の作成がキャンセルされました');
        }
        
        await apiService.createAddressBook(commonId);
        ErrorHandlerService.showInfo('アドレス帳を作成しました。連絡先を追加してからメールを送信してください。');
        throw new Error('アドレス帳が新規作成されました。連絡先を追加してから再度送信してください。');
      }
      
      return commonId;
    } catch (error) {
      ErrorHandlerService.handleError(
        error instanceof Error ? error : new Error('共通ID確認エラー'),
        ErrorCategory.NETWORK,
        { throwError: true }
      );
      throw error;
    }
  }

  /**
   * メール送信の前提条件チェック
   */
  static validateMailSendConditions(blocks: Block[]): { isValid: boolean; error?: string } {
    const validation = ValidationService.validateBlocks(blocks);
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors.join(', ') : undefined
    };
  }
} 