"""
HTMLエディタ バックエンドアプリケーション

開発憲章に従った3-Tier階層型アーキテクチャの実装
- プレゼンテーション層: FastAPI Routes
- ビジネスロジック層: Services
- データアクセス層: ファイルベース（HTML、PDF）

設定管理:
- 開発憲章の「設定とロジックを分離」原則に従い、設定クラスを使用
"""

import logging
import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import mail_routes, pdf_routes, department_routes
from app.config import get_settings
from app.config.database import init_database
from app.middleware.session_middleware import SessionMiddleware
from pathlib import Path

# デバッグ: インポートされたルーターの確認
print(f"DEBUG - mail_routes.router: {hasattr(mail_routes, 'router')}")
print(f"DEBUG - pdf_routes.router: {hasattr(pdf_routes, 'router')}")
print(f"DEBUG - department_routes.router: {hasattr(department_routes, 'router')}")
if hasattr(department_routes, 'router'):
    print(f"DEBUG - department_routes.router routes: {len(department_routes.router.routes)}")
else:
    print("ERROR - department_routes.router not found!")

# ログ設定
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# ログファイル名に日付を含める
log_filename = f"app_{datetime.now().strftime('%Y%m%d')}.log"
log_filepath = log_dir / log_filename

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filepath, encoding='utf-8'),
        logging.StreamHandler()  # コンソールにも出力
    ]
)

logger = logging.getLogger(__name__)
logger.info("=== HTMLエディタ バックエンド アプリケーション開始 ===")

# 設定インスタンスを取得
settings = get_settings()

# データベースの初期化
init_database()

app = FastAPI(
    title="HTML Editor API",
    description="HTMLエディタとスクレイピング機能を提供するAPI",
    version="1.0.0"
)

# CORS設定（設定クラスから取得）
origins = settings.get_cors_origins()
print(f"CORS Origins: {origins}")

# セッション管理ミドルウェアを追加
app.add_middleware(SessionMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルの提供設定
static_dir = Path(settings.STATIC_DIR)
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# --- ルーターの登録 ---
# メールAPIは /api/mail を起点とする
app.include_router(mail_routes.router, prefix="/api/mail", tags=["mail"])
# PDF出力APIは /api/pdf を起点とする
app.include_router(pdf_routes.router, prefix="/api/pdf", tags=["pdf"])
# 部門管理APIは /api/departments を起点とする
app.include_router(department_routes.router, prefix="/api/departments", tags=["departments"])


# デバッグ: 登録されたルートを確認
print("=== 登録されたルート一覧 ===")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"Path: {route.path}, Methods: {route.methods}")
print("========================")


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "HTML Editor Backend API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT_NO)