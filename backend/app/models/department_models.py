"""
部門管理関連のPydanticモデル
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DepartmentBase(BaseModel):
    bu_name: str  # 部名
    ka_name: str  # 課名
    job_type: Optional[str] = None  # 職種（任意）


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentCreateWithCopy(DepartmentBase):
    copy_from_department_id: Optional[int] = None  # コピー元部門ID（任意）


class Department(DepartmentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TypoCorrectionBase(BaseModel):
    correct_reading: str    # 正しい読み方
    correct_display: str    # 正しい表示
    description: Optional[str] = None  # 説明（NULL許可）


class TypoCorrectionCreate(TypoCorrectionBase):
    department_id: int


class TypoCorrectionUpdate(TypoCorrectionBase):
    pass


class TypoCorrection(TypoCorrectionBase):
    id: int
    department_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DepartmentWithCorrections(Department):
    corrections: List[TypoCorrection] = []


class TypoCorrectionList(BaseModel):
    """クリップボードにコピーする形式のレスポンス"""
    department_info: Department
    corrections: List[dict]  # {reading: str, display: str, description: str} の形式
