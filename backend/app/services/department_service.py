"""
部門管理のサービス層
"""

from typing import List, Optional, Dict, Any
import logging
from app.models.department_models import (
    Department, DepartmentCreate, DepartmentCreateWithCopy, DepartmentWithCorrections,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate,
    TypoCorrectionList
)
from app.repositories.department_repository import DepartmentRepository, TypoCorrectionRepository

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
            created_at=department.created_at,
            corrections=corrections
        )
    
    @staticmethod
    def get_corrections_for_clipboard(department_id: int) -> Optional[TypoCorrectionList]:
        """クリップボード用の誤字修正リストを取得"""
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
        
        return TypoCorrectionList(
            department_info=department,
            corrections=corrections_dict
        )
    
    @staticmethod
    def create_department(department: DepartmentCreate) -> Department:
        """新しい部門を作成"""
        return DepartmentRepository.create_department(department)
    
    @staticmethod
    def create_department_with_copy(department: DepartmentCreateWithCopy) -> Department:
        """新しい部門を作成（誤字修正リストのコピー付き）"""
        # まず部門を作成（job_typeを含む）
        dept_create = DepartmentCreate(
            bu_name=department.bu_name, 
            ka_name=department.ka_name,
            job_type=department.job_type
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
    def delete_department(department_id: int) -> bool:
        """部門を削除（関連する誤字修正リストも削除）"""
        # 部門の存在確認
        department = DepartmentRepository.get_department_by_id(department_id)
        if not department:
            return False
        
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
