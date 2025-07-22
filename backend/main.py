"""
HTMLエディタ バックエンドアプリケーション

開発憲章に従った3-Tier階層型アーキテクチャの実装
- プレゼンテーション層: FastAPI Routes
- ビジネスロジック層: Services
- データアクセス層: Repositories + SQLAlchemy
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import address_book_routes, mail_routes
from app.models.database import engine, Base

# データベーステーブルの作成
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HTML Editor API",
    description="ブロックエディタとメール送信機能を提供するAPI",
    version="1.0.0"
)

# CORS設定（フロントエンドとの連携のため）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React開発サーバー
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(address_book_routes.router, prefix="/api", tags=["address-books"])
app.include_router(mail_routes.router, prefix="/api", tags=["mail"])

@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "HTML Editor API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
