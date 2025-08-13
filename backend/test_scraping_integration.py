#!/usr/bin/env python3
"""
スクレイピング機能の統合テスト

開発チャーターに従い、実際の動作を確認するためのテストスクリプト
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

async def test_scraping_functionality():
    """スクレイピング機能の基本動作テスト"""
    print("🚀 スクレイピング機能の統合テストを開始します...")
    
    try:
        # スクレイピングサービスの初期化
        scraping_service = ScrapingService()
        print("✅ ScrapingService初期化完了")
        
        # テスト用のリクエストを作成（両方のページを同時にテスト）
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
                ),
                UrlConfig(
                    url="http://localhost:8080/test_page2.html",
                    mode=ScrapingMode.TITLE_DATE_PARTICIPANT
                )
            ]
        )
        
        print("✅ テストリクエスト作成完了")
        print(f"   対象URL数: {len(test_request.url_configs)}")
        
        # スクレイピング実行
        print("\n📡 スクレイピング実行中...")
        response = await scraping_service.execute_scraping(test_request)
        
        print("✅ スクレイピング完了")
        print(f"   セッションID: {response.session_id}")
        print(f"   処理時間: {response.total_processing_time:.2f}秒")
        print(f"   結果数: {len(response.results)}")
        
        # 結果の詳細表示
        print(f"\n{'='*60}")
        print("📊 スクレイピング結果詳細")
        print(f"{'='*60}")
        
        for i, result in enumerate(response.results, 1):
            print(f"\n🔍 結果 {i}:")
            print(f"   URL: {result.url}")
            print(f"   ステータス: {result.status}")
            print(f"   モード: {result.mode}")
            
            if result.status == "success":
                print(f"   データ長: {len(result.data) if result.data else 0}文字")
                if result.data:
                    print(f"   取得データ:")
                    print(f"   {'-'*50}")
                    print(result.data)
                    print(f"   {'-'*50}")
            else:
                print(f"   ❌ エラー: {result.error_message}")
        
        # 統合データの表示
        if response.combined_data:
            print(f"\n🔗 統合データ:")
            print(f"   データ長: {len(response.combined_data)}文字")
            print(f"   内容:")
            print(f"   {'='*50}")
            print(response.combined_data)
            print(f"   {'='*50}")
        
        # 構造化データの表示
        if response.structured_data:
            print(f"\n🏗️ 構造化データ:")
            if response.structured_data.title:
                print(f"   タイトル: {response.structured_data.title}")
            if response.structured_data.date:
                print(f"   日付: {response.structured_data.date}")
            if response.structured_data.participant:
                print(f"   参加者: {response.structured_data.participant}")
            if response.structured_data.transcript:
                print(f"   トランスクリプト: {len(response.structured_data.transcript)}文字")
        
        print("\n🎉 統合テスト完了！")
        return True
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生しました: {e}")
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
    print("HTMLEditer スクレイピング機能 統合テスト")
    print("=" * 60)
    
    # 非同期テストの実行
    success = asyncio.run(test_scraping_functionality())
    
    if success:
        print("\n✅ すべてのテストが正常に完了しました")
        sys.exit(0)
    else:
        print("\n❌ テストでエラーが発生しました")
        sys.exit(1)
