"""
部門管理のサービス層
"""

from typing import List, Optional, Dict, Any
import logging
from app.models.department_models import (
    Department, DepartmentCreate, DepartmentCreateWithCopy, DepartmentWithCorrections, DepartmentUpdate,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate,
    TypoCorrectionList, ClipboardData,
    JobType, JobTypeCreate, JobTypeUpdate,
    DepartmentMember, DepartmentMemberCreate, DepartmentMemberUpdate,
    DepartmentWithDetails
)
from app.repositories.department_repository import (
    DepartmentRepository, TypoCorrectionRepository,
    JobTypeRepository, DepartmentMemberRepository
)

logger = logging.getLogger(__name__)


class DepartmentService:
    """部門管理のビジネスロジック"""
    
    @staticmethod
    def get_all_departments() -> List[Department]:
        """すべての部門を取得"""
        return DepartmentRepository.get_all_departments()
    
    @staticmethod
    def get_department_with_corrections(department_id: int) -> Optional[DepartmentWithCorrections]:
        """部門と関連する誤字修正リストを取得"""
        department = DepartmentRepository.get_department_by_id(department_id)
        if not department:
            return None
        
        corrections = TypoCorrectionRepository.get_corrections_by_department(department_id)
        
        return DepartmentWithCorrections(
            id=department.id,
            bu_name=department.bu_name,
            ka_name=department.ka_name,
            job_type=department.job_type,
            email_address=department.email_address,
            created_at=department.created_at,
            corrections=corrections
        )
    
    @staticmethod
    def get_department_with_details(department_id: int) -> Optional[DepartmentWithDetails]:
        """部門の詳細情報（メンバー、誤字修正リスト含む）を取得"""
        return DepartmentRepository.get_department_with_details(department_id)
    
    @staticmethod
    def get_corrections_for_clipboard_with_issuer(department_id: int, issuer: str) -> Optional[ClipboardData]:
        """クリップボード用の部門情報と誤字修正リスト（発行者付き）を取得"""
        department = DepartmentRepository.get_department_by_id(department_id)
        if not department:
            return None
        
        corrections = TypoCorrectionRepository.get_corrections_by_department(department_id)
        
        # クリップボード用の形式に変換
        corrections_dict = []
        for correction in corrections:
            corrections_dict.append({
                "reading": correction.correct_reading,
                "display": correction.correct_display,
                "description": correction.description
            })
        
        # 部門情報を「部/課」の形式で作成
        department_display = f"{department.bu_name}/{department.ka_name}"
        
        return ClipboardData(
            Department=department_display,
            Issuer=issuer,
            typoCorrectionList=corrections_dict
        )
    
    @staticmethod
    def create_department(department: DepartmentCreate) -> Department:
        """新しい部門を作成"""
        return DepartmentRepository.create_department(department)
    
    @staticmethod
    def create_department_with_copy(department: DepartmentCreateWithCopy) -> Department:
        """新しい部門を作成（誤字修正リストのコピー付き）"""
        # まず部門を作成（job_typeとemail_addressを含む）
        dept_create = DepartmentCreate(
            bu_name=department.bu_name, 
            ka_name=department.ka_name,
            job_type=department.job_type,
            email_address=department.email_address
        )
        
        new_department = DepartmentRepository.create_department(dept_create)
        
        # コピー元が指定されている場合、誤字修正リストをコピー
        if department.copy_from_department_id:
            source_corrections = TypoCorrectionRepository.get_corrections_by_department(
                department.copy_from_department_id
            )
            
            # 各誤字修正を新しい部門にコピー
            for correction in source_corrections:
                copy_correction = TypoCorrectionCreate(
                    department_id=new_department.id,
                    correct_reading=correction.correct_reading,
                    correct_display=correction.correct_display,
                    description=correction.description
                )
                TypoCorrectionRepository.create_correction(copy_correction)
        
        return new_department
    
    @staticmethod
    def update_department(department_id: int, department: DepartmentUpdate) -> Optional[Department]:
        """部門を更新"""
        return DepartmentRepository.update_department(department_id, department)
    
    @staticmethod
    def delete_department(department_id: int) -> bool:
        """部門を削除（関連するデータも削除）"""
        # 部門の存在確認
        department = DepartmentRepository.get_department_by_id(department_id)
        if not department:
            return False
        
        # 関連するメンバーを削除
        members = DepartmentMemberRepository.get_members_by_department(department_id)
        for member in members:
            DepartmentMemberRepository.delete_member(member.id)
        
        # 関連する誤字修正リストを削除
        corrections = TypoCorrectionRepository.get_corrections_by_department(department_id)
        for correction in corrections:
            TypoCorrectionRepository.delete_correction(correction.id)
        
        # 部門を削除
        return DepartmentRepository.delete_department(department_id)
    
    @staticmethod
    def add_correction(correction: TypoCorrectionCreate) -> TypoCorrection:
        """誤字修正を追加"""
        # 部門の存在確認
        department = DepartmentRepository.get_department_by_id(correction.department_id)
        if not department:
            raise ValueError(f"部門ID {correction.department_id} が見つかりません")
        
        return TypoCorrectionRepository.create_correction(correction)
    
    @staticmethod
    def update_correction(correction_id: int, correction: TypoCorrectionUpdate) -> Optional[TypoCorrection]:
        """誤字修正を更新"""
        return TypoCorrectionRepository.update_correction(correction_id, correction)
    
    @staticmethod
    def delete_correction(correction_id: int) -> bool:
        """誤字修正を削除"""
        return TypoCorrectionRepository.delete_correction(correction_id)


class JobTypeService:
    """職種管理のビジネスロジック"""
    
    @staticmethod
    def get_all_job_types() -> List[JobType]:
        """すべての職種を取得"""
        return JobTypeRepository.get_all_job_types()
    
    @staticmethod
    def get_job_type_by_id(job_type_id: int) -> Optional[JobType]:
        """IDで職種を取得"""
        return JobTypeRepository.get_job_type_by_id(job_type_id)
    
    @staticmethod
    def create_job_type(job_type: JobTypeCreate) -> JobType:
        """新しい職種を作成"""
        return JobTypeRepository.create_job_type(job_type)
    
    @staticmethod
    def update_job_type(job_type_id: int, job_type: JobTypeUpdate) -> Optional[JobType]:
        """職種を更新"""
        return JobTypeRepository.update_job_type(job_type_id, job_type)
    
    @staticmethod
    def delete_job_type(job_type_id: int) -> bool:
        """職種を削除"""
        return JobTypeRepository.delete_job_type(job_type_id)


class DepartmentMemberService:
    """部門メンバー管理のビジネスロジック"""
    
    @staticmethod
    def get_members_by_department(department_id: int) -> List[DepartmentMember]:
        """部門のメンバーリストを取得"""
        return DepartmentMemberRepository.get_members_by_department(department_id)
    
    @staticmethod
    def create_member(member: DepartmentMemberCreate) -> DepartmentMember:
        """新しいメンバーを作成"""
        # 重複チェック
        if DepartmentMemberRepository.check_member_exists(member.department_id, member.member_name):
            raise ValueError(f"メンバー '{member.member_name}' は既に存在します")
        
        return DepartmentMemberRepository.create_member(member)
    
    @staticmethod
    def create_member_if_not_exists(department_id: int, member_name: str) -> DepartmentMember:
        """メンバーが存在しない場合のみ作成"""
        if not DepartmentMemberRepository.check_member_exists(department_id, member_name):
            member = DepartmentMemberCreate(department_id=department_id, member_name=member_name)
            return DepartmentMemberRepository.create_member(member)
        else:
            # 既存のメンバーを取得
            members = DepartmentMemberRepository.get_members_by_department(department_id)
            for member in members:
                if member.member_name == member_name:
                    return member
            raise ValueError("メンバーの取得に失敗しました")
    
    @staticmethod
    def update_member(member_id: int, member: DepartmentMemberUpdate) -> Optional[DepartmentMember]:
        """メンバーを更新"""
        return DepartmentMemberRepository.update_member(member_id, member)
    
    @staticmethod
    def delete_member(member_id: int) -> bool:
        """メンバーを削除"""
        return DepartmentMemberRepository.delete_member(member_id)
