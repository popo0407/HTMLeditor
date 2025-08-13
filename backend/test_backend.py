#!/usr/bin/env python3
"""
バックエンドAPIの基本テスト

開発憲章に従ったテスト設計
- 単一責任の原則に従い、各テストは1つの機能のみをテスト
- 依存性注入を使用してテスト可能な設計
"""

import requests
import json
import time
from typing import Dict, Any

def test_health_check():
    """ヘルスチェックエンドポイントのテスト"""
    try:
        response = requests.get("http://localhost:8002/")
        if response.status_code == 200:
            print("✅ ヘルスチェック成功")
            return True
        else:
            print(f"❌ ヘルスチェック失敗: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ サーバーに接続できません")
        return False

def test_cors_headers():
    """CORSヘッダーのテスト"""
    try:
        response = requests.get("http://localhost:8002/")
        cors_headers = response.headers.get("Access-Control-Allow-Origin")
        if cors_headers:
            print("✅ CORSヘッダー設定済み")
            return True
        else:
            print("❌ CORSヘッダーが設定されていません")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ サーバーに接続できません")
        return False

if __name__ == "__main__":
    print("🚀 バックエンドAPIテストを開始します...")
    
    # サーバー起動待機
    print("⏳ サーバー起動を待機中...")
    time.sleep(3)
    
    # テスト実行
    success_count = 0
    total_tests = 2
    
    if test_health_check():
        success_count += 1
    
    if test_cors_headers():
        success_count += 1
    
    # 結果表示
    print(f"\n📊 テスト結果: {success_count}/{total_tests} 成功")
    
    if success_count == total_tests:
        print("🎉 すべてのテストが成功しました")
        exit(0)
    else:
        print("❌ 一部のテストが失敗しました")
        exit(1)
