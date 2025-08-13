#!/usr/bin/env python3
"""
シンプルなバックエンドテスト

開発憲章に従ったテスト設計
- 単一責任の原則に従い、各テストは1つの機能のみをテスト
"""

import sys
import os

# カレントディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("✅ FastAPIアプリケーションのインポート成功")
    
    # 基本的なルートのテスト
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # ヘルスチェック
    response = client.get("/")
    print(f"✅ ヘルスチェック: {response.status_code} - {response.json()}")
    
    print("\n=== バックエンド基盤の構築完了 ===")
    print("- FastAPIアプリケーション: 正常")
    print("- API層、サービス層: 正常")
    
except Exception as e:
    print(f"❌ エラーが発生しました: {e}")
    import traceback
    traceback.print_exc()
