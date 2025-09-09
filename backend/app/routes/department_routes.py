"""
部門管理のAPIルート
"""

from fastapi import APIRouter, HTTPException, status, Form
from typing import List
import logging
from app.models.department_models import (
    Department, DepartmentCreate, DepartmentCreateWithCopy, DepartmentWithCorrections, DepartmentUpdate,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate,
    TypoCorrectionList, ClipboardData,
    JobType, JobTypeCreate, JobTypeUpdate,
    DepartmentMember, DepartmentMemberCreate, DepartmentMemberUpdate,
    DepartmentWithDetails
)
from app.services.department_service import DepartmentService, JobTypeService, DepartmentMemberService

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


@router.get("/{department_id}/details", response_model=DepartmentWithDetails)
async def get_department_with_details(department_id: int):
    """部門の詳細情報（メンバー、誤字修正リスト含む）を取得"""
    try:
        department = DepartmentService.get_department_with_details(department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return department
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"部門詳細取得エラー (ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門詳細の取得に失敗しました"
        )


@router.get("/{department_id}/corrections/clipboard/{issuer}", response_model=ClipboardData)
async def get_corrections_for_clipboard_with_issuer(department_id: int, issuer: str):
    """クリップボード用の部門情報と誤字修正リスト（発行者付き）を取得"""
    try:
        clipboard_data = DepartmentService.get_corrections_for_clipboard_with_issuer(department_id, issuer)
        if not clipboard_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return clipboard_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"クリップボードデータ取得エラー (部門ID: {department_id}, 発行者: {issuer}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="クリップボードデータの取得に失敗しました"
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


@router.put("/{department_id}", response_model=Department)
async def update_department(department_id: int, department: DepartmentUpdate):
    """部門を更新"""
    try:
        updated_department = DepartmentService.update_department(department_id, department)
        if not updated_department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return updated_department
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"部門更新エラー (ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="部門の更新に失敗しました"
        )


@router.delete("/{department_id}")
async def delete_department(department_id: int):
    """部門を削除（関連するデータも削除）"""
    try:
        success = DepartmentService.delete_department(department_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="部門が見つかりません"
            )
        return {"message": "部門と関連するデータを削除しました"}
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


# 職種管理のエンドポイント
@router.get("/job-types/", response_model=List[JobType])
async def get_all_job_types():
    """すべての職種を取得"""
    try:
        job_types = JobTypeService.get_all_job_types()
        return job_types
    except Exception as e:
        logger.error(f"職種取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="職種の取得に失敗しました"
        )


@router.post("/job-types/", response_model=JobType)
async def create_job_type(job_type: JobTypeCreate):
    """新しい職種を作成"""
    try:
        new_job_type = JobTypeService.create_job_type(job_type)
        return new_job_type
    except Exception as e:
        logger.error(f"職種作成エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="職種の作成に失敗しました"
        )


@router.put("/job-types/{job_type_id}", response_model=JobType)
async def update_job_type(job_type_id: int, job_type: JobTypeUpdate):
    """職種を更新"""
    try:
        updated_job_type = JobTypeService.update_job_type(job_type_id, job_type)
        if not updated_job_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="職種が見つかりません"
            )
        return updated_job_type
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"職種更新エラー (ID: {job_type_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="職種の更新に失敗しました"
        )


@router.delete("/job-types/{job_type_id}")
async def delete_job_type(job_type_id: int):
    """職種を削除"""
    try:
        success = JobTypeService.delete_job_type(job_type_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="職種が見つかりません"
            )
        return {"message": "職種を削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"職種削除エラー (ID: {job_type_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="職種の削除に失敗しました"
        )


# 部門メンバー管理のエンドポイント
@router.get("/{department_id}/members", response_model=List[DepartmentMember])
async def get_department_members(department_id: int):
    """部門のメンバーリストを取得"""
    try:
        members = DepartmentMemberService.get_members_by_department(department_id)
        return members
    except Exception as e:
        logger.error(f"メンバー取得エラー (部門ID: {department_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メンバーの取得に失敗しました"
        )


@router.post("/{department_id}/members", response_model=DepartmentMember)
async def create_department_member(department_id: int, member_name: str = Form(...)):
    """部門にメンバーを追加"""
    try:
        member = DepartmentMemberCreate(department_id=department_id, member_name=member_name)
        new_member = DepartmentMemberService.create_member_if_not_exists(department_id, member_name)
        return new_member
    except ValueError as e:
        logger.warning(f"メンバー作成警告 (部門ID: {department_id}, 名前: {member_name}): {e}")
        # 既存メンバーを返す
        members = DepartmentMemberService.get_members_by_department(department_id)
        for member in members:
            if member.member_name == member_name:
                return member
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"メンバー作成エラー (部門ID: {department_id}, 名前: {member_name}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メンバーの作成に失敗しました"
        )


@router.put("/members/{member_id}", response_model=DepartmentMember)
async def update_department_member(member_id: int, member: DepartmentMemberUpdate):
    """メンバーを更新"""
    try:
        updated_member = DepartmentMemberService.update_member(member_id, member)
        if not updated_member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="メンバーが見つかりません"
            )
        return updated_member
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"メンバー更新エラー (ID: {member_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メンバーの更新に失敗しました"
        )


@router.delete("/members/{member_id}")
async def delete_department_member(member_id: int):
    """メンバーを削除"""
    try:
        success = DepartmentMemberService.delete_member(member_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="メンバーが見つかりません"
            )
        return {"message": "メンバーを削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"メンバー削除エラー (ID: {member_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メンバーの削除に失敗しました"
        )
