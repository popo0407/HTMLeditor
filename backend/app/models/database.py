"""
データベース設定とセッション管理

SQLAlchemyを使用してデータベース接続を管理
設定とロジックの分離原則に従い、接続情報は環境変数で管理可能
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# データベース設定
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./html_editor.db")

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
