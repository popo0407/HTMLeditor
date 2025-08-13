"""
スクレイピング機能のデータモデル定義

開発憲章の「設定とロジックを分離」原則に従い、
API通信で使用するデータ構造を定義
"""

from pydantic import BaseModel, Field, HttpUrl, validator
from typing import List, Optional
from enum import Enum
import re


class ScrapingMode(str, Enum):
    """スクレイピングモード"""
    CHAT_ENTRIES = "chat_entries"  # ブックマークレット①用
    TITLE_DATE_PARTICIPANT = "title_date_participant"  # ブックマークレット②用


class LoginCredentials(BaseModel):
    """ログイン認証情報"""
    username: str = Field(..., description="ユーザー名")
    password: str = Field(..., description="パスワード")
    login_url: str = Field(..., description="ログインページURL")


class UrlConfig(BaseModel):
    """URL設定"""
    url: str = Field(..., description="データ取得対象URL（http/https/fileスキーム対応）")
    mode: ScrapingMode = Field(..., description="このURLに適用するスクレイピングモード")
    
    @validator('url')
    def validate_url(cls, v):
        """URLの基本的な形式チェック（http/https/fileスキームを許可）"""
        url_pattern = r'^(https?|file)://.*'
        if not re.match(url_pattern, v):
            raise ValueError('URLはhttp://, https://, file://のいずれかで始まる必要があります')
        return v


class ScrapingRequest(BaseModel):
    """スクレイピングリクエスト"""
    credentials: LoginCredentials
    url_configs: Optional[List[UrlConfig]] = Field(None, min_items=1, max_items=2, description="URL設定（最大2つ）")
    
    # 下位互換性のための従来形式もサポート
    target_urls: Optional[List[str]] = Field(None, description="従来形式のURL（非推奨）")
    mode: Optional[ScrapingMode] = Field(None, description="従来形式のモード（非推奨）")


class ScrapingResult(BaseModel):
    """スクレイピング結果"""
    url: str
    status: str  # "success" | "error"
    mode: ScrapingMode
    data: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: str


class StructuredData(BaseModel):
    """構造化されたデータ"""
    title: Optional[str] = None
    date: Optional[str] = None
    participant: Optional[str] = None
    transcript: Optional[str] = None


class ScrapingResponse(BaseModel):
    """スクレイピングレスポンス"""
    session_id: str
    results: List[ScrapingResult]
    combined_data: str = Field(description="全URLのデータを結合したテキスト")
    structured_data: Optional[StructuredData] = Field(None, description="構造化されたデータ")
    formatted_output: Optional[str] = Field(None, description="指定フォーマットでの出力")
    total_processing_time: float
