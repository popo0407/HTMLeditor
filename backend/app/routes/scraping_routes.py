"""
スクレイピングAPI ルーター

開発憲章の「API層」として、HTTPリクエストの受信・検証・レスポンス返却に特化
- 入力検証
- サービス呼び出し
- エラーハンドリング
"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.scraping_schemas import ScrapingRequest, ScrapingResponse
from app.services.scraping_service import ScrapingService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# スクレイピングサービスのインスタンス（DI）
def get_scraping_service() -> ScrapingService:
    """スクレイピングサービスの依存性注入"""
    return ScrapingService()


@router.post("/execute", response_model=ScrapingResponse)
async def execute_scraping(
    request: ScrapingRequest,
    scraping_service: ScrapingService = Depends(get_scraping_service)
) -> ScrapingResponse:
    """
    Webスクレイピング実行エンドポイント
    
    - 認証情報を使用してログイン
    - 指定URLからデータを取得
    - 処理完了後に認証情報を削除
    """
    try:
        # デバッグログ
        logger.info(f"Scraping request received:")
        logger.info(f"  - url_configs: {request.url_configs}")
        logger.info(f"  - target_urls: {request.target_urls}")
        logger.info(f"  - mode: {request.mode}")
        logger.info(f"  - credentials login_url: {request.credentials.login_url}")
        
        # ビジネスロジック層に処理委譲
        result = await scraping_service.execute_scraping(request)
        
        logger.info(f"Scraping completed successfully. Session: {result.session_id}")
        return result
        
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Scraping execution failed: {e}")
        raise HTTPException(status_code=500, detail="スクレイピング処理中にエラーが発生しました")


@router.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy", "service": "scraping"}


@router.post("/validate")
async def validate_request(request: ScrapingRequest):
    """リクエスト形式の検証用エンドポイント"""
    try:
        logger.info(f"Validation request: {request}")
        return {
            "status": "valid",
            "url_configs": request.url_configs,
            "target_urls": request.target_urls,
            "mode": request.mode,
            "credentials_provided": bool(request.credentials.username and request.credentials.password)
        }
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config")
async def get_scraping_config():
    """スクレイピング設定情報取得（デバッグ用）"""
    from app.config.settings import get_settings
    
    settings = get_settings()
    return {
        "max_browser_instances": settings.MAX_BROWSER_INSTANCES,
        "session_timeout": settings.SESSION_TIMEOUT,
        "page_load_timeout": settings.PAGE_LOAD_TIMEOUT,
        "max_scroll_loops": settings.MAX_SCROLL_LOOPS
    }
