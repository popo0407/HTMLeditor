"""
HTMLエディタ バックエンドアプリケーション

開発憲章に従った3-Tier階層型アーキテクチャの実装
- プレゼンテーション層: FastAPI Routes
- ビジネスロジック層: Services
- データアクセス層: Repositories + SQLAlchemy
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import address_book_routes, mail_routes
from app.models.database import engine, Base

# 環境変数を .env ファイルから読み込み（ルートディレクトリから）
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# データベーステーブルの作成
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HTML Editor API",
    description="ブロックエディタとメール送信機能を提供するAPI",
    version="1.0.0"
)

# CORS設定の動的生成
def get_cors_origins():
    cors_env = os.getenv("CORS_ORIGINS", "")
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:82",
        "http://10.166.96.135:82",
    ]
    if cors_env:
        env_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
        all_origins = list(set(default_origins + env_origins))
        print(f"CORS Origins (from env): {all_origins}")
        return all_origins
    else:
        print(f"CORS Origins (default): {default_origins}")
        return default_origins

origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ルーターの登録（修正箇所） ---
# アドレス帳APIは /api を起点とする
app.include_router(address_book_routes.router, prefix="/api", tags=["address-books"])
# メールAPIは /api/mail を起点とする
app.include_router(mail_routes.router, prefix="/api/mail", tags=["mail"])


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "HTML Editor API is running"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT_NO", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)