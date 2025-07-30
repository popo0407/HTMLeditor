/**
 * サービスのエクスポート
 * 
 * 開発憲章の「関心の分離」に従い、
 * 各責務に特化したサービスを提供
 */

export { apiService } from './apiService';
export { clipboardService } from './clipboardService';
export { calendarService } from './calendarService';
export { ganttService } from './ganttService';
export { BlockOperationService } from './blockOperationService';
export { MailOperationService } from './mailOperationService';
export { ErrorHandlerService } from './errorHandlerService';
export { ValidationService } from './validationService';

export type { MailSendRequest, MailSendResult } from './mailOperationService';
export type { ErrorInfo, ErrorHandlerOptions } from './errorHandlerService';
export type { ValidationResult, ValidationRule } from './validationService';
export { ErrorLevel, ErrorCategory } from './errorHandlerService'; 