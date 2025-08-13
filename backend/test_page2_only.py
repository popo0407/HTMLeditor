#!/usr/bin/env python3
"""
test_page2.html専用テスト
test_page2.htmlのスクレイピング機能をテストします
"""

import asyncio
import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.app.services.scraping_service import ScrapingService, ScrapingMode
from backend.app.models.scraping_schemas import ScrapingRequest, ScrapingResult, LoginCredentials
from backend.app.config.settings import get_settings

async def test_page2_only():
    """test_page2.html専用テスト"""
    print("=" * 60)
    print("HTMLEditer test_page2.html専用テスト")
    print("=" * 60)
    
    try:
        # 設定を取得
        settings = get_settings()
        print("✅ 設定取得完了")
        
        # ScrapingServiceを初期化
        scraping_service = ScrapingService()
        print("✅ ScrapingService初期化完了")
        
        # テスト用のリクエストを作成
        test_url = "http://localhost:8080/test_page2.html"
        
        # ダミーの認証情報を作成（テスト用）
        credentials = LoginCredentials(
            username="testuser",
            password="testpass",
            login_url="http://localhost:8080/test_login.html"
        )
        
        request = ScrapingRequest(
            credentials=credentials,
            target_urls=[test_url],
            mode=ScrapingMode.TITLE_DATE_PARTICIPANT
        )
        print("✅ テストリクエスト作成完了")
        print(f"   対象URL数: {len(request.target_urls)}")
        
        # スクレイピングを実行
        print("\n📡 スクレイピング実行中...")
        print(f"   対象URL: {test_url}")
        print(f"   ログインURL: {credentials.login_url}")
        
        results = await scraping_service.execute_scraping(request)
        
        # 結果を表示
        print("✅ スクレイピング完了")
        print(f"   結果数: {len(results.results)}")
        
        # デバッグ情報を追加
        print(f"\n🔍 デバッグ情報:")
        print(f"   セッションID: {results.session_id}")
        print(f"   処理時間: {results.total_processing_time:.2f}秒")
        if results.combined_data:
            print(f"   結合データ長: {len(results.combined_data)}文字")
        
        print("\n" + "=" * 60)
        print("📊 スクレイピング結果詳細")
        print("=" * 60)
        
        for i, result in enumerate(results.results, 1):
            print(f"\n🔍 結果 {i}:")
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
        
        print("\n🎉 test_page2.htmlのテストが正常に完了しました")
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    # テストサーバーが起動しているか確認
    print("🚀 test_page2.html専用テストを開始します...")
    
    # 非同期テストを実行
    success = asyncio.run(test_page2_only())
    
    if success:
        print("\n✅ テストが正常に完了しました")
        sys.exit(0)
    else:
        print("\n❌ テストが失敗しました")
        sys.exit(1)

