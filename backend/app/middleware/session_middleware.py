"""
セッション管理ミドルウェア

API リクエストにセッションIDを付与し、ペルソナキャッシュの管理を支援
"""

import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

logger = logging.getLogger(__name__)

class SessionMiddleware(BaseHTTPMiddleware):
    """セッション管理ミドルウェア"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # セッションIDをヘッダーまたはクッキーから取得
        session_id = None
        
        # まずはヘッダーから取得を試行
        if "X-Session-ID" in request.headers:
            session_id = request.headers["X-Session-ID"]
        # 次にクッキーから取得を試行
        elif "session_id" in request.cookies:
            session_id = request.cookies["session_id"]
        
        # セッションIDがない場合は新規作成
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"Created new session ID: {session_id}")
        else:
            logger.debug(f"Using existing session ID: {session_id}")
        
        # リクエストオブジェクトにセッションIDを設定
        request.state.session_id = session_id
        
        # レスポンスを処理
        response = await call_next(request)
        
        # レスポンスヘッダーにセッションIDを設定
        response.headers["X-Session-ID"] = session_id
        
        # クッキーにも設定（フロントエンドで利用可能）
        if isinstance(response, Response):
            response.set_cookie(
                key="session_id",
                value=session_id,
                max_age=3600,  # 1時間
                httponly=False,  # フロントエンドからアクセス可能
                secure=False,   # HTTPでも利用可能（開発環境）
                samesite="lax"
            )
        
        return response