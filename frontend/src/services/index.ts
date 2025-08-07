/**
 * サービスのエクスポート
 * 
 * 開発憲章の「関心の分離」に従い、
 * サービスを独立したモジュールで管理
 */

// API通信サービス
export { getEmailTemplates, sendMail, sendPdfMail } from './apiService';

// エラーハンドリングサービス
export { ErrorHandlerService } from './errorHandlerService';

// PDFエクスポートサービス
export { PdfExportService } from './pdfExportService';

// Wordエクスポートサービス
export { WordExportService } from './wordExportService';

// 型定義のエクスポート
export type { ErrorInfo } from './errorHandlerService'; 