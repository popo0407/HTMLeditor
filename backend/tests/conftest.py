"""
pytest設定ファイル

開発チャーターに従い、テストの共通設定とフィクスチャを一元管理
"""

import pytest
import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.config.settings import get_settings
from backend.app.services.scraping_service import ScrapingService

@pytest.fixture
def settings():
    """設定インスタンスのフィクスチャ"""
    return get_settings()

@pytest.fixture
def scraping_service():
    """ScrapingServiceインスタンスのフィクスチャ"""
    return ScrapingService()

@pytest.fixture
def test_credentials():
    """テスト用認証情報のフィクスチャ"""
    from backend.app.models.scraping_schemas import LoginCredentials
    
    return LoginCredentials(
        username="testuser",
        password="testpass",
        login_url="http://localhost:8080/test_login.html"
    )

@pytest.fixture
def test_urls():
    """テスト用URLのフィクスチャ"""
    return [
        "http://localhost:8080/test_page1.html",
        "http://localhost:8080/test_page2.html"
    ]

@pytest.fixture
def mock_browser_config():
    """モックブラウザ設定のフィクスチャ"""
    return {
        "headless": True,
        "timeout": 5000,
        "args": [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security"
        ]
    }
