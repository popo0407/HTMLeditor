/**
 * エラーハンドリングサービス
 * 
 * 責務:
 * - エラーメッセージの標準化
 * - エラーレベルの分類
 * - ユーザーフレンドリーなエラー表示
 * - ログ出力の統一
 * 
 * 開発憲章の「ログは階層と目的を意識し、意図を持って記録せよ」に従う
 */

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  CLIPBOARD = 'clipboard',
  FILE_OPERATION = 'file_operation'
}

export interface ErrorInfo {
  message: string;
  level: ErrorLevel;
  category: ErrorCategory;
  originalError?: Error;
  context?: Record<string, any>;
  userFriendly?: boolean;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logToConsole?: boolean;
  throwError?: boolean;
}

/**
 * エラーハンドリングサービス
 */
export class ErrorHandlerService {
  private static readonly DEFAULT_OPTIONS: ErrorHandlerOptions = {
    showAlert: true,
    logToConsole: true,
    throwError: false
  };

  /**
   * エラーを処理
   */
  static handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    options: ErrorHandlerOptions = {}
  ): void {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const errorInfo = this.createErrorInfo(error, category);

    // コンソールログ出力
    if (mergedOptions.logToConsole) {
      this.logError(errorInfo);
    }

    // アラート表示
    if (mergedOptions.showAlert && errorInfo.userFriendly) {
      this.showUserAlert(errorInfo);
    }

    // エラーを再スロー
    if (mergedOptions.throwError) {
      throw error instanceof Error ? error : new Error(error);
    }
  }

  /**
   * エラー情報を作成
   */
  private static createErrorInfo(
    error: Error | string,
    category: ErrorCategory
  ): ErrorInfo {
    const message = error instanceof Error ? error.message : error;
    const originalError = error instanceof Error ? error : undefined;

    // エラーレベルの決定
    let level = ErrorLevel.ERROR;
    let userFriendly = true;

    switch (category) {
      case ErrorCategory.NETWORK:
        level = ErrorLevel.ERROR;
        userFriendly = true;
        break;
      case ErrorCategory.VALIDATION:
        level = ErrorLevel.WARNING;
        userFriendly = true;
        break;
      case ErrorCategory.USER_ACTION:
        level = ErrorLevel.INFO;
        userFriendly = true;
        break;
      case ErrorCategory.SYSTEM:
        level = ErrorLevel.ERROR;
        userFriendly = false;
        break;
      case ErrorCategory.CLIPBOARD:
        level = ErrorLevel.WARNING;
        userFriendly = true;
        break;
      case ErrorCategory.FILE_OPERATION:
        level = ErrorLevel.ERROR;
        userFriendly = true;
        break;
    }

    return {
      message,
      level,
      category,
      originalError,
      userFriendly
    };
  }

  /**
   * エラーをログ出力
   */
  private static logError(errorInfo: ErrorInfo): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${errorInfo.level.toUpperCase()}] [${errorInfo.category}] ${errorInfo.message}`;

    switch (errorInfo.level) {
      case ErrorLevel.INFO:
        console.info(logMessage);
        break;
      case ErrorLevel.WARNING:
        console.warn(logMessage);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        console.error(logMessage);
        if (errorInfo.originalError) {
          console.error('Original error:', errorInfo.originalError);
        }
        break;
    }
  }

  /**
   * ユーザー向けアラート表示
   */
  private static showUserAlert(errorInfo: ErrorInfo): void {
    let alertMessage = errorInfo.message;

    // カテゴリ別の追加情報
    switch (errorInfo.category) {
      case ErrorCategory.NETWORK:
        alertMessage += '\n\nバックエンドサーバーが起動していることを確認してください。';
        break;
      case ErrorCategory.CLIPBOARD:
        alertMessage += '\n\nブラウザでクリップボードのアクセス許可が必要です。';
        break;
      case ErrorCategory.FILE_OPERATION:
        alertMessage += '\n\nファイルの保存権限を確認してください。';
        break;
    }

    alert(alertMessage);
  }

  /**
   * 成功メッセージの表示
   */
  static showSuccess(message: string): void {
    console.info(`[SUCCESS] ${message}`);
    alert(message);
  }

  /**
   * 情報メッセージの表示
   */
  static showInfo(message: string): void {
    console.info(`[INFO] ${message}`);
    alert(message);
  }

  /**
   * 確認ダイアログの表示
   */
  static showConfirm(message: string): boolean {
    return confirm(message);
  }

  /**
   * プロンプトダイアログの表示
   */
  static showPrompt(message: string, defaultValue?: string): string | null {
    return prompt(message, defaultValue);
  }
} 