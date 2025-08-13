#!/usr/bin/env python3
"""
スクレイピング機能の統合テスト

開発チャーターに従い、実際の動作を確認するためのテストスクリプト
単体テストの実装パターンに合わせて修正
各ページに適切なスクレイピングモードを設定
"""

import asyncio
import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.app.services.scraping_service import ScrapingService, ScrapingMode
from backend.app.models.scraping_schemas import ScrapingRequest, ScrapingResult, LoginCredentials, UrlConfig
from backend.app.config.settings import get_settings

async def test_scraping_integration():
    """スクレイピング機能の統合テスト（両方のページを同時にテスト）"""
    print("=" * 60)
    print("HTMLEditer スクレイピング機能 統合テスト")
    print("=" * 60)
    
    try:
        # 設定を取得
        settings = get_settings()
        print("✅ 設定取得完了")
        
        # ScrapingServiceを初期化
        scraping_service = ScrapingService()
        print("✅ ScrapingService初期化完了")
        
        # 各ページに適切なスクレイピングモードを設定
        url_configs = [
            UrlConfig(
                url="http://localhost:8080/test_page1.html",
                mode=ScrapingMode.CHAT_ENTRIES  # page1用のモード
            ),
            UrlConfig(
                url="http://localhost:8080/test_page2.html",
                mode=ScrapingMode.TITLE_DATE_PARTICIPANT  # page2用のモード
            )
        ]
        
        # ダミーの認証情報を作成（テスト用）
        credentials = LoginCredentials(
            username="testuser",
            password="testpass",
            login_url="http://localhost:8080/test_login.html"
        )
        
        # 各URLに適切なモードを設定したリクエストを作成
        request = ScrapingRequest(
            credentials=credentials,
            url_configs=url_configs
        )
        print("✅ テストリクエスト作成完了")
        print(f"   対象URL数: {len(request.url_configs)}")
        print(f"   対象URLs:")
        for config in request.url_configs:
            print(f"     - {config.url} (モード: {config.mode})")
        
        # スクレイピングを実行
        print("\n📡 スクレイピング実行中...")
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
        
        # 統合データの表示
        if results.combined_data:
            print(f"\n🔗 統合データ:")
            print(f"   データ長: {len(results.combined_data)}文字")
            print(f"   内容:")
            print(f"   {'='*50}")
            print(results.combined_data)
            print(f"   {'='*50}")
        
        # 構造化データの表示
        if results.structured_data:
            print(f"\n🏗️ 構造化データ:")
            if results.structured_data.title:
                print(f"   タイトル: {results.structured_data.title}")
            if results.structured_data.date:
                print(f"   日付: {results.structured_data.date}")
            if results.structured_data.participant:
                print(f"   参加者: {results.structured_data.participant}")
            if results.structured_data.transcript:
                print(f"   トランスクリプト: {len(results.structured_data.transcript)}文字")
                print(f"   トランスクリプトプレビュー:")
                preview = results.structured_data.transcript[:200] + "..." if len(results.structured_data.transcript) > 200 else results.structured_data.transcript
                print(f"   {preview}")
            else:
                print(f"   ❌ トランスクリプト: データなし")
        else:
            print(f"\n🏗️ 構造化データ: なし")
        
        # フォーマット済み出力の表示
        if results.formatted_output:
            print(f"\n📝 フォーマット済み出力:")
            print(f"   データ長: {len(results.formatted_output)}文字")
            print(f"   内容:")
            print(f"   {'='*50}")
            print(results.formatted_output)
            print(f"   {'='*50}")
        else:
            print(f"\n📝 フォーマット済み出力: なし")
        
        print("\n🎉 統合テストが正常に完了しました")
        
    except Exception as e:
        print(f"❌ テスト実行中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    # テストサーバーが起動しているか確認
    print("🚀 スクレイピング機能の統合テストを開始します...")
    
    # 非同期テストを実行
    success = asyncio.run(test_scraping_integration())
    
    if success:
        print("\n✅ 統合テストが正常に完了しました")
        sys.exit(0)
    else:
        print("\n❌ 統合テストが失敗しました")
        sys.exit(1)
