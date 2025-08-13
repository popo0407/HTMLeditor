"""
テスト用ヘルパー関数

開発チャーターに従い、テストで共通使用する関数を一元管理
"""

import asyncio
from typing import List, Dict, Any
from pathlib import Path

def create_test_request(credentials, urls: List[str], mode: str):
    """テスト用のScrapingRequestを作成"""
    from backend.app.models.scraping_schemas import ScrapingRequest
    
    return ScrapingRequest(
        credentials=credentials,
        target_urls=urls,
        mode=mode
    )

def validate_scraping_result(result) -> bool:
    """スクレイピング結果の妥当性を検証"""
    required_fields = ['url', 'status', 'mode']
    
    # 必須フィールドの存在確認
    for field in required_fields:
        if not hasattr(result, field):
            return False
    
    # ステータスの妥当性確認
    if result.status not in ['success', 'error']:
        return False
    
    # 成功時はデータが存在することを確認
    if result.status == 'success' and not result.data:
        return False
    
    return True

def get_test_data_path(filename: str) -> Path:
    """テストデータファイルのパスを取得"""
    return Path(__file__).parent.parent / 'static' / filename

def create_mock_response(session_id: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """モックレスポンスを作成"""
    return {
        'session_id': session_id,
        'results': results,
        'total_processing_time': 1.5,
        'combined_data': 'Mock combined data',
        'structured_data': None
    }

async def run_with_timeout(coro, timeout: float = 30.0):
    """タイムアウト付きでコルーチンを実行"""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        raise TimeoutError(f"Operation timed out after {timeout} seconds")

def cleanup_test_files():
    """テストで作成された一時ファイルをクリーンアップ"""
    # 必要に応じて一時ファイルの削除処理を実装
    pass
