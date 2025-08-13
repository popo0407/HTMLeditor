#!/usr/bin/env python3
"""
スクレイピング問題のデバッグスクリプト
"""

import asyncio
import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.app.services.scraping_service import ScrapingService
from backend.app.models.scraping_schemas import ScrapingRequest, LoginCredentials, ScrapingMode, UrlConfig

async def debug_scraping_issues():
    """スクレイピングの問題をデバッグ"""
    print("🔍 スクレイピング問題のデバッグを開始します...")
    
    try:
        # スクレイピングサービスの初期化
        scraping_service = ScrapingService()
        print("✅ ScrapingService初期化完了")
        
        # 単一のURLでテスト（test_page1.html）
        test_request = ScrapingRequest(
            credentials=LoginCredentials(
                username="test_user",
                password="test_pass",
                login_url="http://localhost:8080/test_login.html"
            ),
            url_configs=[
                UrlConfig(
                    url="http://localhost:8080/test_page1.html",
                    mode=ScrapingMode.CHAT_ENTRIES
                )
            ]
        )
        
        print("✅ テストリクエスト作成完了")
        print(f"   対象URL: {test_request.url_configs[0].url}")
        print(f"   モード: {test_request.url_configs[0].mode}")
        
        # スクレイピング実行
        print("\n📡 スクレイピング実行中...")
        response = await scraping_service.execute_scraping(test_request)
        
        print("✅ スクレイピング完了")
        print(f"   セッションID: {response.session_id}")
        print(f"   処理時間: {response.total_processing_time:.2f}秒")
        print(f"   結果数: {len(response.results)}")
        
        # 結果の詳細表示
        for i, result in enumerate(response.results, 1):
            print(f"\n📊 結果 {i}:")
            print(f"   URL: {result.url}")
            print(f"   ステータス: {result.status}")
            print(f"   モード: {result.mode}")
            if result.status == "success":
                print(f"   データ長: {len(result.data) if result.data else 0}文字")
                if result.data:
                    preview = result.data[:200] + "..." if len(result.data) > 200 else result.data
                    print(f"   プレビュー: {preview}")
            else:
                print(f"   エラー: {result.error_message}")
        
        return True
        
    except Exception as e:
        print(f"❌ デバッグ実行中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # サービスのクリーンアップ
        try:
            await scraping_service.shutdown()
            print("🧹 サービスクリーンアップ完了")
        except Exception as e:
            print(f"⚠️ クリーンアップ中にエラー: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("HTMLEditer スクレイピング問題 デバッグスクリプト")
    print("=" * 60)
    
    # 非同期テストの実行
    success = asyncio.run(debug_scraping_issues())
    
    if success:
        print("\n✅ デバッグが正常に完了しました")
        sys.exit(0)
    else:
        print("\n❌ デバッグでエラーが発生しました")
        sys.exit(1)
