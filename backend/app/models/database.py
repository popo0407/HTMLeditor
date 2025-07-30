"""
データベース設定とセッション管理

SQLAlchemyを使用してデータベース接続を管理
開発憲章の「設定とロジックを分離」原則に従い、設定クラスから接続情報を取得
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

# 設定インスタンスを取得
settings = get_settings()

# データベース設定（設定クラスから取得）
DATABASE_URL = settings.get_database_url()

# SQLAlchemyエンジンの作成
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# セッション作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()

def get_db():
    """
    データベースセッションの依存性注入用関数
    
    FastAPIの Depends() で使用され、各リクエストで独立したセッションを提供
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
