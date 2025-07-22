"""
Pydanticスキーマ定義

API入出力のデータ検証とシリアライゼーション用
開発憲章の「設定とロジックの分離」に従い、型定義を独立させる
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class ContactBase(BaseModel):
    """連絡先の基本情報"""
    name: str
    email: str

class ContactCreate(ContactBase):
    """連絡先作成用スキーマ"""
    pass

class ContactResponse(ContactBase):
    """連絡先取得用スキーマ"""
    id: int
    common_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommonIDBase(BaseModel):
    """共通IDの基本情報"""
    common_id: str

class CommonIDCreate(CommonIDBase):
    """共通ID作成用スキーマ"""
    pass

class CommonIDResponse(CommonIDBase):
    """共通ID取得用スキーマ"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    contacts: List[ContactResponse] = []

    class Config:
        from_attributes = True

class AddressBookValidationRequest(BaseModel):
    """アドレス帳検証リクエスト"""
    common_id: str

class AddressBookValidationResponse(BaseModel):
    """アドレス帳検証レスポンス"""
    exists: bool
    common_id: str
    contacts: List[ContactResponse] = []
