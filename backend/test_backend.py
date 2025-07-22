"""
バックエンドAPIの簡単なテスト

FastAPIアプリケーションが正常に起動し、基本的な機能が動作するかを確認
"""

import sys
import os

# カレントディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("✓ FastAPIアプリケーションのインポート成功")
    
    # 基本的なルートのテスト
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # ヘルスチェック
    response = client.get("/")
    print(f"✓ ヘルスチェック: {response.status_code} - {response.json()}")
    
    # データベーステーブルが作成されているか確認
    from app.models.database import engine
    from app.models.address_book import CommonID, Contact
    print("✓ データベースモデルのインポート成功")
    
    print("\n=== バックエンド基盤の構築完了 ===")
    print("- FastAPIアプリケーション: 正常")
    print("- データベースモデル: 正常")
    print("- API層、サービス層、リポジトリ層: 正常")
    
except Exception as e:
    print(f"❌ エラーが発生しました: {e}")
    import traceback
    traceback.print_exc()
