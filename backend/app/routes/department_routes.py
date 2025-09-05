"""
部門管理のAPIルート
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
import logging
from app.models.department_models import (
    Department, DepartmentCreate, DepartmentCreateWithCopy, DepartmentWithCorrections,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate,
    TypoCorrectionList
)
from app.services.department_service import DepartmentService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["departments"])


@router.get("/", response_model=List[Department])
async def get_all_departments():
    """すべての部門を取得"""
    try:
        departments = DepartmentService.get_all_departments()
        return departments
    except Exception as e:
        logger.error(f"部門取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の取得に失敗しました"
        )


@router.get("/{department_id}", response_model=DepartmentWithCorrections)
async def get_department_with_corrections(department_id: int):
    """部門と関連する誤字修正リストを取得"""
    try:
        department = DepartmentService.get_department_with_corrections(department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return department
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"部門取得エラー (ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の取得に失敗しました"
        )


@router.get("/{department_id}/corrections/clipboard", response_model=TypoCorrectionList)
async def get_corrections_for_clipboard(department_id: int):
    """クリップボード用の誤字修正リストを取得"""
    try:
        corrections = DepartmentService.get_corrections_for_clipboard(department_id)
        if not corrections:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return corrections
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"誤字修正リスト取得エラー (部門ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="誤字修正リストの取得に失敗しました"
        )


@router.post("/", response_model=Department)
async def create_department(department: DepartmentCreate):
    """新しい部門を作成"""
    try:
        new_department = DepartmentService.create_department(department)
        return new_department
    except Exception as e:
        logger.error(f"部門作成エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の作成に失敗しました"
        )


@router.post("/with-copy", response_model=Department)
async def create_department_with_copy(department: DepartmentCreateWithCopy):
    """新しい部門を作成（誤字修正リストのコピー付き）"""
    try:
        new_department = DepartmentService.create_department_with_copy(department)
        return new_department
    except Exception as e:
        logger.error(f"部門作成エラー (コピー付き): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の作成に失敗しました"
        )


@router.delete("/{department_id}")
async def delete_department(department_id: int):
    """部門を削除（関連する誤字修正リストも削除）"""
    try:
        success = DepartmentService.delete_department(department_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return {"message": "部門と関連する誤字修正リストを削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"部門削除エラー (ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の削除に失敗しました"
        )


@router.post("/{department_id}/corrections", response_model=TypoCorrection)
async def add_correction(department_id: int, correction: TypoCorrectionCreate):
    """誤字修正を追加"""
    try:
        # リクエストボディの department_id を URL パラメータで上書き
        correction.department_id = department_id
        new_correction = DepartmentService.add_correction(correction)
        return new_correction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"誤字修正追加エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="誤字修正の追加に失敗しました"
        )


@router.put("/corrections/{correction_id}", response_model=TypoCorrection)
async def update_correction(correction_id: int, correction: TypoCorrectionUpdate):
    """誤字修正を更新"""
    try:
        updated_correction = DepartmentService.update_correction(correction_id, correction)
        if not updated_correction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="誤字修正が見つかりません"
            )
        return updated_correction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"誤字修正更新エラー (ID: {correction_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="誤字修正の更新に失敗しました"
        )


@router.delete("/corrections/{correction_id}")
async def delete_correction(correction_id: int):
    """誤字修正を削除"""
    try:
        success = DepartmentService.delete_correction(correction_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="誤字修正が見つかりません"
            )
        return {"message": "誤字修正を削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"誤字修正削除エラー (ID: {correction_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="誤字修正の削除に失敗しました"
        )
