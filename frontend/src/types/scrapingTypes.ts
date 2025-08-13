/**
 * スクレイピング機能の型定義
 * 
 * バックエンドのスキーマと一致させる
 */

export enum ScrapingMode {
  CHAT_ENTRIES = "chat_entries",
  TITLE_DATE_PARTICIPANT = "title_date_participant"
}

export interface LoginCredentials {
  username: string;
  password: string;
  login_url: string;
}

export interface UrlConfig {
  url: string; // http/https/fileスキーム対応
  mode: ScrapingMode;
}

export interface ScrapingRequest {
  credentials: LoginCredentials;
  url_configs: UrlConfig[];
  // 下位互換性
  target_urls?: string[];
  mode?: ScrapingMode;
}

export interface ScrapingResult {
  url: string;
  status: string;
  mode: ScrapingMode;
  data?: string;
  error_message?: string;
  timestamp: string;
}

export interface StructuredData {
  title?: string;
  date?: string;
  participant?: string;
  transcript?: string;
}

export interface ScrapingResponse {
  session_id: string;
  results: ScrapingResult[];
  combined_data: string;
  structured_data?: StructuredData;
  formatted_output?: string;
  total_processing_time: number;
}
