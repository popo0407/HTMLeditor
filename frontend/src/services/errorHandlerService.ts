/**
 * エラーハンドラーサービス
 * 
 * 責務:
 * - エラーの分類と処理
 * - ユーザーフレンドリーなエラーメッセージの生成
 * - エラーログの記録
 * - ユーザーインターフェースの表示
 * 
 * 開発憲章の「単一責任の原則」に従い、エラー処理のみを担当
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  FILE_OPERATION = 'FILE_OPERATION',
  MAIL_OPERATION = 'MAIL_OPERATION',
  CLIPBOARD_OPERATION = 'CLIPBOARD_OPERATION',
  ADDRESS_BOOK_OPERATION = 'ADDRESS_BOOK_OPERATION',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorInfo {
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  timestamp: Date;
}

export interface MailSendResult {
  success: boolean;
  message?: string;
  data?: any;
}

export class ErrorHandlerService {
  /**
   * エラーを分類して処理
   */
  static handleError(error: Error, category: ErrorCategory = ErrorCategory.UNKNOWN): ErrorInfo {
    const errorInfo: ErrorInfo = {
      category,
      message: this.generateUserFriendlyMessage(error, category),
      originalError: error,
      timestamp: new Date()
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを生成
   */
  private static generateUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    const baseMessage = error.message || '予期しないエラーが発生しました';

    switch (category) {
      case ErrorCategory.NETWORK:
        return `ネットワークエラー: ${baseMessage}`;
      case ErrorCategory.VALIDATION:
        return `入力エラー: ${baseMessage}`;
      case ErrorCategory.FILE_OPERATION:
        return `ファイル操作エラー: ${baseMessage}`;
      case ErrorCategory.MAIL_OPERATION:
        return `メール送信エラー: ${baseMessage}`;
      case ErrorCategory.CLIPBOARD_OPERATION:
        return `クリップボード操作エラー: ${baseMessage}`;
      case ErrorCategory.ADDRESS_BOOK_OPERATION:
        return `アドレス帳操作エラー: ${baseMessage}`;
      default:
        return baseMessage;
    }
  }

  /**
   * エラーログを記録
   */
  private static logError(errorInfo: ErrorInfo): void {
    console.error(`[${errorInfo.category}] ${errorInfo.message}`, {
      timestamp: errorInfo.timestamp,
      originalError: errorInfo.originalError
    });
  }

  /**
   * エラーカテゴリを判定
   */
  static categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('file') || message.includes('download')) {
      return ErrorCategory.FILE_OPERATION;
    }
    if (message.includes('mail') || message.includes('email')) {
      return ErrorCategory.MAIL_OPERATION;
    }
    if (message.includes('clipboard')) {
      return ErrorCategory.CLIPBOARD_OPERATION;
    }
    if (message.includes('address') || message.includes('contact')) {
      return ErrorCategory.ADDRESS_BOOK_OPERATION;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * 成功メッセージを表示
   */
  static showSuccess(message: string): void {
    console.info(`[SUCCESS] ${message}`);
    alert(message);
  }

  /**
   * 情報メッセージを表示
   */
  static showInfo(message: string): void {
    console.info(`[INFO] ${message}`);
    alert(message);
  }

  /**
   * 確認ダイアログを表示
   */
  static showConfirm(message: string): boolean {
    return confirm(message);
  }

  /**
   * プロンプトダイアログを表示
   */
  static showPrompt(message: string, defaultValue?: string): string | null {
    return prompt(message, defaultValue);
  }
} 