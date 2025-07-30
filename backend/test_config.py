"""
設定クラスのテスト

開発憲章の「テストによる振る舞いの保証」に従い、
設定クラスの動作を検証するテスト
"""

import os
import sys
from pathlib import Path

# バックエンドディレクトリをパスに追加
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.config import get_settings

def test_settings():
    """設定クラスの基本動作をテスト"""
    print("=== 設定クラステスト開始 ===")
    
    try:
        # 設定インスタンスを取得
        settings = get_settings()
        print(f"✓ 設定インスタンスの取得: 成功")
        
        # 基本設定の確認
        print(f"✓ PORT_NO: {settings.PORT_NO}")
        print(f"✓ HOST: {settings.HOST}")
        print(f"✓ DATABASE_URL: {settings.DATABASE_URL}")
        
        # CORS設定の確認
        cors_origins = settings.get_cors_origins()
        print(f"✓ CORS Origins: {cors_origins}")
        
        # SMTP設定の確認
        smtp_config = settings.get_smtp_config()
        print(f"✓ SMTP Server: {smtp_config['server']}")
        print(f"✓ SMTP Port: {smtp_config['port']}")
        
        # 環境判定の確認
        print(f"✓ 開発環境: {settings.is_development()}")
        print(f"✓ 本番環境: {settings.is_production()}")
        
        print("=== 設定クラステスト完了 ===")
        return True
        
    except Exception as e:
        print(f"✗ 設定クラステスト失敗: {e}")
        return False

if __name__ == "__main__":
    success = test_settings()
    sys.exit(0 if success else 1) 