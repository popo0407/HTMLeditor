"""
アプリケーション設定管理

開発憲章の「設定とロジックを分離」原則に従い、
環境変数とデフォルト値を一元管理する設定クラス

責務:
- 環境変数の読み込みと型変換
- デフォルト値の提供
- 設定値の検証
- 環境別設定の管理
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator
from pathlib import Path


class Settings(BaseSettings):
    """
    アプリケーション設定クラス
    
    開発憲章の「設定とロジックを分離」原則に従い、
    すべての設定値をこのクラスで一元管理
    """
    
    # === サーバー設定 ===
    PORT_NO: int = 8002
    HOST: str = "0.0.0.0"
    DEBUG: bool = False
    
    # === データベース設定 ===
    DATABASE_URL: str = "sqlite:///./html_editor.db"
    
    # === CORS設定 ===
    CORS_ORIGINS: str = ""
    CORS_DEFAULT_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:82",
        "http://10.166.96.135:82",
    ]
    
    # === SMTP設定 ===
    MAIL_FROM: str = ""
    MAIL_HOST: str = ""
    MAIL_PORT: int = 587
    
    # === メール送信設定 ===
    DEFAULT_RECIPIENT_EMAIL: str = ""
    EMAIL_SUBJECT_TEMPLATES: str = ""
    EMAIL_SUBJECT_DEFAULT: str = "HTML Editor からの送信"
    EMAIL_BODY_TEMPLATES: str = ""  # 本文冒頭文のテンプレート（カンマ区切り）
    
    # === 静的ファイル設定 ===
    STATIC_DIR: str = "static"
    
    # === 環境設定 ===
    ENV_FILE_PATH: Optional[str] = None
    
    @validator('ENV_FILE_PATH', pre=True)
    def set_env_file_path(cls, v):
        """環境変数ファイルのパスを自動設定"""
        if v is None:
            # バックエンドディレクトリの親ディレクトリ（プロジェクトルート）を探す
            backend_dir = Path(__file__).parent.parent.parent
            project_root = backend_dir.parent
            env_file = project_root / '.env'
            if env_file.exists():
                return str(env_file)
        return v
    

    
    @validator('CORS_ORIGINS')
    def parse_cors_origins(cls, v):
        """CORS設定を解析してリストに変換"""
        if v:
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return []
    
    def get_cors_origins(self) -> List[str]:
        """
        CORS設定を取得（環境変数 + デフォルト値）
        
        Returns:
            CORS許可オリジンのリスト
        """
        all_origins = list(set(self.CORS_DEFAULT_ORIGINS + self.CORS_ORIGINS))
        return all_origins
    
    def get_database_url(self) -> str:
        """
        データベースURLを取得
        
        Returns:
            データベース接続URL
        """
        return self.DATABASE_URL
    
    def get_smtp_config(self) -> dict:
        """
        SMTP設定を辞書形式で取得
        
        Returns:
            SMTP設定の辞書
        """
        return {
            'mail_from': self.MAIL_FROM,
            'mail_host': self.MAIL_HOST,
            'mail_port': self.MAIL_PORT,
        }
    
    def get_email_templates(self) -> dict:
        """
        メールテンプレート設定を取得
        
        Returns:
            メールテンプレート設定の辞書
        """
        subject_templates = []
        if self.EMAIL_SUBJECT_TEMPLATES:
            subject_templates = [template.strip() for template in self.EMAIL_SUBJECT_TEMPLATES.split(",") if template.strip()]
        
        body_templates = []
        if self.EMAIL_BODY_TEMPLATES:
            body_templates = [template.strip() for template in self.EMAIL_BODY_TEMPLATES.split(",") if template.strip()]
        
        return {
            'default_recipient': self.DEFAULT_RECIPIENT_EMAIL,
            'subject_templates': subject_templates,
            'default_subject': self.EMAIL_SUBJECT_DEFAULT,
            'body_templates': body_templates,
        }
    
    def is_development(self) -> bool:
        """
        開発環境かどうかを判定
        
        Returns:
            開発環境の場合True
        """
        return self.DEBUG or os.getenv('ENVIRONMENT', '').lower() == 'development'
    
    def is_production(self) -> bool:
        """
        本番環境かどうかを判定
        
        Returns:
            本番環境の場合True
        """
        return not self.is_development()
    
    class Config:
        """Pydantic設定"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# グローバル設定インスタンス
settings = Settings()


def get_settings() -> Settings:
    """
    設定インスタンスを取得（依存性注入用）
    
    Returns:
        設定インスタンス
    """
    return settings 