"""
アドレス帳関連のデータモデル

要件定義に基づき、以下のエンティティを定義：
- CommonID: 共通ID管理
- Contact: 連絡先情報

単一責任の原則に従い、各モデルは明確な責務を持つ
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class CommonID(Base):
    """
    共通ID管理テーブル
    
    責務:
    - 共通IDの一意性保証
    - アドレス帳の識別子として機能
    """
    __tablename__ = "common_ids"

    id = Column(Integer, primary_key=True, index=True)
    common_id = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # リレーション: 1つの共通IDに対して複数の連絡先
    contacts = relationship("Contact", back_populates="common_id_ref")

class Contact(Base):
    """
    連絡先管理テーブル
    
    責務:
    - 個別の連絡先情報の管理
    - 共通IDとの関連付け
    """
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    common_id = Column(String(100), ForeignKey("common_ids.common_id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # リレーション: 各連絡先は1つの共通IDに属する
    common_id_ref = relationship("CommonID", back_populates="contacts")
