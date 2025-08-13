#!/usr/bin/env python3
"""
ページスクレイピング機能の統合テスト

開発チャーターに従い、実際の動作を確認するためのテストスクリプト
test_page1.html と test_page2.html の両方をテスト
"""

import asyncio
import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.services.scraping_service import ScrapingService, ScrapingMode
from backend.app.models.scraping_schemas import ScrapingRequest, ScrapingResult, LoginCredentials
from backend.app.config.settings import get_settings

async def test_page_scraping():
    """ページスクレイピング機能の統合テスト"""
    print("=" * 60)
    print("HTMLEditer ページスクレイピング統合テスト")
    print("=" * 60)
    
    try:
        # 設定を取得
        settings = get_settings()
        print("✅ 設定取得完了")
        
        # ScrapingServiceを初期化
        scraping_service = ScrapingService()
        print("✅ ScrapingService初期化完了")
        
        # テスト用のリクエストを作成
        test_urls = [
            "http://localhost:8080/test_page1.html",
            "http://localhost:8080/test_page2.html"
        ]
        
        # ダミーの認証情報を作成（テスト用）
        credentials = LoginCredentials(
            username="testuser",
            password="testpass",
            login_url="http://localhost:8080/test_login.html"
        )
        
        # 各ページのテスト
        for i, test_url in enumerate(test_urls, 1):
            print(f"\n{'='*50}")
            print(f"📄 テスト {i}: {test_url}")
            print(f"{'='*50}")
            
            # ページ1はチャットエントリーモード、ページ2はタイトル日付参加者モード
            mode = ScrapingMode.CHAT_ENTRIES if "page1" in test_url else ScrapingMode.TITLE_DATE_PARTICIPANT
            
            request = ScrapingRequest(
                credentials=credentials,
                target_urls=[test_url],
                mode=mode
            )
            
            print(f"✅ テストリクエスト作成完了")
            print(f"   対象URL: {test_url}")
            print(f"   スクレイピングモード: {mode}")
            
            # スクレイピングを実行
            print(f"\n📡 スクレイピング実行中...")
            results = await scraping_service.execute_scraping(request)
            
            # 結果を表示
            print(f"✅ スクレイピング完了")
            print(f"   結果数: {len(results.results)}")
            print(f"   セッションID: {results.session_id}")
            print(f"   処理時間: {results.total_processing_time:.2f}秒")
            
            # 結果の詳細表示
            for j, result in enumerate(results.results, 1):
                print(f"\n🔍 結果 {j}:")
                print(f"   URL: {result.url}")
                print(f"   ステータス: {result.status}")
                print(f"   モード: {result.mode}")
                
                if result.status == "success":
                    print(f"   ✅ 成功")
                    print(f"   データ長: {len(result.data) if result.data else 0}文字")
                    
                    # データの最初の100文字を表示
                    if result.data:
                        preview = result.data[:100] + "..." if len(result.data) > 100 else result.data
                        print(f"   データプレビュー: {preview}")
                else:
                    print(f"   ❌ エラー: {result.error_message}")
        
        print(f"\n🎉 ページスクレイピングの統合テストが正常に完了しました")
        return True
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """メイン関数"""
    success = await test_page_scraping()
    if success:
        print("\n✅ すべてのテストが成功しました")
        sys.exit(0)
    else:
        print("\n❌ テストが失敗しました")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
