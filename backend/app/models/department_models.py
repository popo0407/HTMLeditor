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
    email_address: Optional[str] = None  # メールアドレス（任意）


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentCreateWithCopy(DepartmentBase):
    copy_from_department_id: Optional[int] = None  # コピー元部門ID（任意）


class DepartmentUpdate(DepartmentBase):
    pass  # DepartmentBaseと同じフィールド（部門更新用）


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


# 職種関連モデル
class JobTypeBase(BaseModel):
    name: str  # 職種名


class JobTypeCreate(JobTypeBase):
    pass


class JobTypeUpdate(JobTypeBase):
    pass


class JobType(JobTypeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# 部門メンバー関連モデル
class DepartmentMemberBase(BaseModel):
    member_name: str  # メンバー名


class DepartmentMemberCreate(DepartmentMemberBase):
    department_id: int


class DepartmentMemberUpdate(DepartmentMemberBase):
    pass


class DepartmentMember(DepartmentMemberBase):
    id: int
    department_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class DepartmentWithDetails(Department):
    corrections: List[TypoCorrection] = []
    members: List[DepartmentMember] = []


class ClipboardData(BaseModel):
    """クリップボード用データ"""
    Department: str
    Issuer: str
    typoCorrectionList: List[dict]
