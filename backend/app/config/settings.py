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
from pydantic import ConfigDict
from pathlib import Path

# 現在のファイルのディレクトリを取得
current_dir = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    """
    アプリケーション設定クラス
    
    開発憲章の「設定とロジックを分離」原則に従い、
    すべての設定値をこのクラスで一元管理
    """
    
    # === サーバー設定 ===
    PORT_NO: int = 0
    HOST: str = ""
    DEBUG: bool = False
    
    # === CORS設定 ===
    CORS_ORIGINS: str = ""
    CORS_DEFAULT_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:82",
        "http://10.166.96.135:82",
    ]
    
    # === メール送信設定（実際に使用されている項目のみ） ===
    MAIL_HOST: str = ""
    MAIL_PORT: int = 0
    SENDER_EMAIL: str = ""
    
    # === 静的ファイル設定 ===
    STATIC_DIR: str = ""
    
    # === スクレイピング設定（実際に使用されている項目名に合わせて統合） ===
    # Playwright設定
    HEADLESS: bool = False
    
    # ページ表示設定
    SHOW_BROWSER: bool = True
    SLOW_MO: int = 100  # 動作を遅くして確認しやすくする（ミリ秒）
    DEVTOOLS: bool = False  # 開発者ツールを開くかどうか
    
    # タイムアウト設定
    PAGE_LOAD_TIMEOUT: int = 45000
    ELEMENT_WAIT_TIMEOUT: int = 15000
    NAVIGATION_TIMEOUT: int = 30000
    
    # スクロール設定
    SCROLL_DELAY: int = 1000
    MAX_SCROLL_LOOPS: int = 8
    
    # 待機設定
    INITIAL_WAIT: int = 3
    
    # セッション設定
    SESSION_TIMEOUT: int = 1800
    SESSION_CLEANUP_INTERVAL: int = 300
    
    # ブラウザインスタンス設定
    MAX_BROWSER_INSTANCES: int = 2
    
    # セキュリティ設定
    ENCRYPT_CREDENTIALS: bool = True
    AUTO_DELETE_CREDENTIALS: bool = True
    
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
    
    def get_smtp_config(self) -> dict:
        """
        SMTP設定を辞書形式で取得
        
        Returns:
            SMTP設定の辞書
        """
        return {
            'mail_host': self.MAIL_HOST,
            'mail_port': self.MAIL_PORT,
        }
    
    def get_email_templates(self) -> dict:
        """
        メールテンプレート設定を取得
        
        Returns:
            メールテンプレート設定の辞書
        """
        return {
            'subject_templates': [],
            'default_subject': "HTML Editor からの送信",
            'body_templates': [],
        }
    
    def get_browser_config(self) -> dict:
        """
        ブラウザ設定を取得
        
        Returns:
            ブラウザ設定の辞書
        """
        return {
            "headless": self.HEADLESS,
            "timeout": self.PAGE_LOAD_TIMEOUT,
            "args": [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-ipc-flooding-protection"
            ]
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
    
    # Pydantic v2 設定: 余分な環境変数(REACT_APP_*)を無視
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# グローバル設定インスタンス
settings = Settings()


def get_settings() -> Settings:
    """
    設定インスタンスを取得（依存性注入用）
    
    Returns:
        設定インスタンス
    """
    return settings 