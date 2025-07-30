"""
HTMLエディタ バックエンドアプリケーション

開発憲章に従った3-Tier階層型アーキテクチャの実装
- プレゼンテーション層: FastAPI Routes
- ビジネスロジック層: Services
- データアクセス層: Repositories + SQLAlchemy

設定管理:
- 開発憲章の「設定とロジックを分離」原則に従い、設定クラスを使用
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import mail_routes, gantt_routes
from app.models.database import engine, Base
from app.config import get_settings
from pathlib import Path

# 設定インスタンスを取得
settings = get_settings()

# データベーステーブルの作成
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HTML Editor API",
    description="ブロックエディタとメール送信機能を提供するAPI",
    version="1.0.0"
)

# CORS設定（設定クラスから取得）
origins = settings.get_cors_origins()
print(f"CORS Origins: {origins}")

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
# ガントチャートAPIは /api/gantt を起点とする
app.include_router(gantt_routes.router, prefix="/api/gantt", tags=["gantt"])


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "HTML Editor Backend API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT_NO)