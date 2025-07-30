/**
 * バリデーションサービス
 * 
 * 責務:
 * - 共通バリデーション関数の提供
 * - 型安全性の向上
 * - エラー情報の構造化
 * 
 * 開発憲章の「DRY原則を適用」に従う
 */

import { Block } from '../types';
import { ErrorCategory } from './errorHandlerService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
  level: 'error' | 'warning';
}

/**
 * バリデーションサービス
 */
export class ValidationService {
  /**
   * ブロックリストのバリデーション
   */
  static validateBlocks(blocks: Block[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 空チェック
    if (blocks.length === 0) {
      errors.push('送信するコンテンツがありません');
    }

    // 各ブロックの内容チェック
    blocks.forEach((block, index) => {
      // 必須フィールドチェック
      if (!block.id) {
        errors.push(`ブロック ${index + 1}: IDが設定されていません`);
      }

      if (!block.type) {
        errors.push(`ブロック ${index + 1}: タイプが設定されていません`);
      }

      // コンテンツチェック
      if (block.content === undefined || block.content === null) {
        warnings.push(`ブロック ${index + 1}: コンテンツが空です`);
      }

      // 特定タイプの追加チェック
      if (block.type === 'table' && !block.tableData) {
        errors.push(`ブロック ${index + 1}: テーブルデータが設定されていません`);
      }

      if (block.type === 'calendar' && !block.calendarData) {
        errors.push(`ブロック ${index + 1}: カレンダーデータが設定されていません`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 共通IDのバリデーション
   */
  static validateCommonId(commonId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 空チェック
    if (!commonId || commonId.trim() === '') {
      errors.push('共通IDが入力されていません');
      return { isValid: false, errors, warnings };
    }

    // 長さチェック
    if (commonId.length < 3) {
      warnings.push('共通IDは3文字以上を推奨します');
    }

    if (commonId.length > 50) {
      errors.push('共通IDは50文字以内で入力してください');
    }

    // 文字種チェック
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(commonId)) {
      errors.push('共通IDは英数字、ハイフン、アンダースコアのみ使用できます');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * メールアドレスのバリデーション
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 空チェック
    if (!email || email.trim() === '') {
      errors.push('メールアドレスが入力されていません');
      return { isValid: false, errors, warnings };
    }

    // 形式チェック
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.push('正しいメールアドレス形式で入力してください');
    }

    // 長さチェック
    if (email.length > 254) {
      errors.push('メールアドレスが長すぎます');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 複数メールアドレスのバリデーション
   */
  static validateEmails(emails: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!emails || emails.trim() === '') {
      return { isValid: true, errors, warnings };
    }

    const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
    
    if (emailList.length === 0) {
      return { isValid: true, errors, warnings };
    }

    // 各メールアドレスをチェック
    emailList.forEach((email, index) => {
      const result = this.validateEmail(email);
      if (!result.isValid) {
        result.errors.forEach(error => {
          errors.push(`メールアドレス ${index + 1}: ${error}`);
        });
      }
    });

    // 重複チェック
    const uniqueEmails = new Set(emailList);
    if (uniqueEmails.size !== emailList.length) {
      warnings.push('重複するメールアドレスが含まれています');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * ファイル名のバリデーション
   */
  static validateFilename(filename: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 空チェック
    if (!filename || filename.trim() === '') {
      errors.push('ファイル名が入力されていません');
      return { isValid: false, errors, warnings };
    }

    // 禁止文字チェック
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      errors.push('ファイル名に使用できない文字が含まれています');
    }

    // 長さチェック
    if (filename.length > 255) {
      errors.push('ファイル名が長すぎます');
    }

    // 拡張子チェック
    if (!filename.endsWith('.html')) {
      warnings.push('HTMLファイルの場合は.html拡張子を推奨します');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 汎用バリデーション関数
   */
  static validate<T>(
    value: T,
    rules: ValidationRule<T>[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    rules.forEach(rule => {
      if (!rule.validate(value)) {
        if (rule.level === 'error') {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} 