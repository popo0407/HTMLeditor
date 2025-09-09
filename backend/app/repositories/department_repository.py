"""
部門管理のリポジトリ層
"""

import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from app.config.database import get_db_connection
from app.models.department_models import (
    Department, DepartmentCreate, DepartmentUpdate,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate,
    JobType, JobTypeCreate, JobTypeUpdate,
    DepartmentMember, DepartmentMemberCreate, DepartmentMemberUpdate,
    DepartmentWithDetails
)

logger = logging.getLogger(__name__)


class DepartmentRepository:
    """部門データのリポジトリ"""
    
    @staticmethod
    def get_all_departments() -> List[Department]:
        """すべての部門を取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, bu_name, ka_name, job_type, email_address, created_at 
                FROM departments 
                ORDER BY bu_name, ka_name
            """)
            rows = cursor.fetchall()
            
            departments = []
            for row in rows:
                departments.append(Department(
                    id=row['id'],
                    bu_name=row['bu_name'],
                    ka_name=row['ka_name'],
                    job_type=row['job_type'],
                    email_address=row['email_address'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                ))
            
            return departments
        finally:
            conn.close()
    
    @staticmethod
    def get_department_by_id(department_id: int) -> Optional[Department]:
        """IDで部門を取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, bu_name, ka_name, job_type, email_address, created_at 
                FROM departments 
                WHERE id = ?
            """, (department_id,))
            row = cursor.fetchone()
            
            if row:
                return Department(
                    id=row['id'],
                    bu_name=row['bu_name'],
                    ka_name=row['ka_name'],
                    job_type=row['job_type'],
                    email_address=row['email_address'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                )
            return None
        finally:
            conn.close()
    
    @staticmethod
    def create_department(department: DepartmentCreate) -> Department:
        """新しい部門を作成"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO departments (bu_name, ka_name, job_type, email_address) 
                VALUES (?, ?, ?, ?)
            """, (department.bu_name, department.ka_name, department.job_type, department.email_address))
            
            department_id = cursor.lastrowid
            conn.commit()
            
            # 作成された部門を取得して返す
            return DepartmentRepository.get_department_by_id(department_id)
        finally:
            conn.close()
    
    @staticmethod
    def update_department(department_id: int, department: DepartmentUpdate) -> Optional[Department]:
        """部門を更新"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # 更新するフィールドを動的に構築
            update_fields = []
            update_values = []
            
            if department.bu_name is not None:
                update_fields.append("bu_name = ?")
                update_values.append(department.bu_name)
            if department.ka_name is not None:
                update_fields.append("ka_name = ?")
                update_values.append(department.ka_name)
            if department.job_type is not None:
                update_fields.append("job_type = ?")
                update_values.append(department.job_type)
            if department.email_address is not None:
                update_fields.append("email_address = ?")
                update_values.append(department.email_address)
            
            if not update_fields:
                # 更新フィールドがない場合は現在の部門情報を返す
                return DepartmentRepository.get_department_by_id(department_id)
            
            update_values.append(department_id)
            sql = f"UPDATE departments SET {', '.join(update_fields)} WHERE id = ?"
            
            cursor.execute(sql, update_values)
            
            if cursor.rowcount == 0:
                return None
            
            conn.commit()
            
            # 更新された部門を取得して返す
            return DepartmentRepository.get_department_by_id(department_id)
        finally:
            conn.close()
    
    @staticmethod
    def get_department_with_details(department_id: int) -> Optional[DepartmentWithDetails]:
        """部門の詳細情報（メンバー、誤字修正リスト含む）を取得"""
        department = DepartmentRepository.get_department_by_id(department_id)
        if not department:
            return None
        
        corrections = TypoCorrectionRepository.get_corrections_by_department(department_id)
        members = DepartmentMemberRepository.get_members_by_department(department_id)
        
        return DepartmentWithDetails(
            id=department.id,
            bu_name=department.bu_name,
            ka_name=department.ka_name,
            job_type=department.job_type,
            email_address=department.email_address,
            created_at=department.created_at,
            corrections=corrections,
            members=members
        )
    
    @staticmethod
    def delete_department(department_id: int) -> bool:
        """部門を削除"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM departments WHERE id = ?", (department_id,))
            result = cursor.rowcount > 0
            conn.commit()
            return result
        finally:
            conn.close()


class TypoCorrectionRepository:
    """誤字修正データのリポジトリ"""
    
    @staticmethod
    def get_corrections_by_department(department_id: int) -> List[TypoCorrection]:
        """部門IDで誤字修正リストを取得（読み方順）"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, department_id, correct_reading, correct_display, description,
                       created_at, updated_at 
                FROM typo_corrections 
                WHERE department_id = ? 
                ORDER BY correct_reading
            """, (department_id,))
            rows = cursor.fetchall()
            
            corrections = []
            for row in rows:
                corrections.append(TypoCorrection(
                    id=row['id'],
                    department_id=row['department_id'],
                    correct_reading=row['correct_reading'],
                    correct_display=row['correct_display'],
                    description=row['description'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(row['updated_at'].replace('Z', '+00:00'))
                ))
            
            return corrections
        finally:
            conn.close()
    
    @staticmethod
    def create_correction(correction: TypoCorrectionCreate) -> TypoCorrection:
        """誤字修正を作成"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            cursor.execute("""
                INSERT INTO typo_corrections 
                (department_id, correct_reading, correct_display, description, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?)
            """, (correction.department_id, correction.correct_reading, 
                  correction.correct_display, correction.description, now, now))
            
            correction_id = cursor.lastrowid
            conn.commit()
            
            # 作成された修正を取得して返す
            cursor.execute("""
                SELECT id, department_id, correct_reading, correct_display, description,
                       created_at, updated_at
                FROM typo_corrections 
                WHERE id = ?
            """, (correction_id,))
            row = cursor.fetchone()
            
            return TypoCorrection(
                id=row['id'],
                department_id=row['department_id'],
                correct_reading=row['correct_reading'],
                correct_display=row['correct_display'],
                description=row['description'],
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        finally:
            conn.close()
    
    @staticmethod
    def update_correction(correction_id: int, correction: TypoCorrectionUpdate) -> Optional[TypoCorrection]:
        """誤字修正を更新"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            cursor.execute("""
                UPDATE typo_corrections 
                SET correct_reading = ?, correct_display = ?, description = ?, updated_at = ?
                WHERE id = ?
            """, (correction.correct_reading, correction.correct_display, correction.description, now, correction_id))
            
            if cursor.rowcount == 0:
                return None
            
            conn.commit()
            
            # 更新された修正を取得して返す
            cursor.execute("""
                SELECT id, department_id, correct_reading, correct_display, description,
                       created_at, updated_at
                FROM typo_corrections 
                WHERE id = ?
            """, (correction_id,))
            row = cursor.fetchone()
            
            return TypoCorrection(
                id=row['id'],
                department_id=row['department_id'],
                correct_reading=row['correct_reading'],
                correct_display=row['correct_display'],
                description=row['description'],
                created_at=datetime.fromisoformat(row['created_at']),
                updated_at=datetime.fromisoformat(row['updated_at'])
            )
        finally:
            conn.close()
    
    @staticmethod
    def delete_correction(correction_id: int) -> bool:
        """誤字修正を削除"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM typo_corrections WHERE id = ?", (correction_id,))
            result = cursor.rowcount > 0
            conn.commit()
            return result
        finally:
            conn.close()


class JobTypeRepository:
    """職種データのリポジトリ"""
    
    @staticmethod
    def get_all_job_types() -> List[JobType]:
        """すべての職種を取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, created_at 
                FROM job_types 
                ORDER BY name
            """)
            rows = cursor.fetchall()
            
            job_types = []
            for row in rows:
                job_types.append(JobType(
                    id=row['id'],
                    name=row['name'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                ))
            
            return job_types
        finally:
            conn.close()
    
    @staticmethod
    def get_job_type_by_id(job_type_id: int) -> Optional[JobType]:
        """IDで職種を取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, created_at 
                FROM job_types 
                WHERE id = ?
            """, (job_type_id,))
            row = cursor.fetchone()
            
            if row:
                return JobType(
                    id=row['id'],
                    name=row['name'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                )
            return None
        finally:
            conn.close()
    
    @staticmethod
    def create_job_type(job_type: JobTypeCreate) -> JobType:
        """新しい職種を作成"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO job_types (name) 
                VALUES (?)
            """, (job_type.name,))
            
            job_type_id = cursor.lastrowid
            conn.commit()
            
            # 作成された職種を取得して返す
            return JobTypeRepository.get_job_type_by_id(job_type_id)
        finally:
            conn.close()
    
    @staticmethod
    def update_job_type(job_type_id: int, job_type: JobTypeUpdate) -> Optional[JobType]:
        """職種を更新"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE job_types 
                SET name = ?
                WHERE id = ?
            """, (job_type.name, job_type_id))
            
            if cursor.rowcount == 0:
                return None
            
            conn.commit()
            
            # 更新された職種を取得して返す
            return JobTypeRepository.get_job_type_by_id(job_type_id)
        finally:
            conn.close()
    
    @staticmethod
    def delete_job_type(job_type_id: int) -> bool:
        """職種を削除"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM job_types WHERE id = ?", (job_type_id,))
            result = cursor.rowcount > 0
            conn.commit()
            return result
        finally:
            conn.close()


class DepartmentMemberRepository:
    """部門メンバーデータのリポジトリ"""
    
    @staticmethod
    def get_members_by_department(department_id: int) -> List[DepartmentMember]:
        """部門IDでメンバーリストを取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, department_id, member_name, created_at
                FROM department_members 
                WHERE department_id = ?
                ORDER BY member_name
            """, (department_id,))
            rows = cursor.fetchall()
            
            members = []
            for row in rows:
                members.append(DepartmentMember(
                    id=row['id'],
                    department_id=row['department_id'],
                    member_name=row['member_name'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                ))
            
            return members
        finally:
            conn.close()
    
    @staticmethod
    def get_member_by_id(member_id: int) -> Optional[DepartmentMember]:
        """IDでメンバーを取得"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, department_id, member_name, created_at
                FROM department_members 
                WHERE id = ?
            """, (member_id,))
            row = cursor.fetchone()
            
            if row:
                return DepartmentMember(
                    id=row['id'],
                    department_id=row['department_id'],
                    member_name=row['member_name'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
                )
            return None
        finally:
            conn.close()
    
    @staticmethod
    def create_member(member: DepartmentMemberCreate) -> DepartmentMember:
        """新しいメンバーを作成"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO department_members (department_id, member_name) 
                VALUES (?, ?)
            """, (member.department_id, member.member_name))
            
            member_id = cursor.lastrowid
            conn.commit()
            
            # 作成されたメンバーを取得して返す
            return DepartmentMemberRepository.get_member_by_id(member_id)
        finally:
            conn.close()
    
    @staticmethod
    def update_member(member_id: int, member: DepartmentMemberUpdate) -> Optional[DepartmentMember]:
        """メンバーを更新"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE department_members 
                SET member_name = ?
                WHERE id = ?
            """, (member.member_name, member_id))
            
            if cursor.rowcount == 0:
                return None
            
            conn.commit()
            
            # 更新されたメンバーを取得して返す
            return DepartmentMemberRepository.get_member_by_id(member_id)
        finally:
            conn.close()
    
    @staticmethod
    def delete_member(member_id: int) -> bool:
        """メンバーを削除"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM department_members WHERE id = ?", (member_id,))
            result = cursor.rowcount > 0
            conn.commit()
            return result
        finally:
            conn.close()
    
    @staticmethod
    def check_member_exists(department_id: int, member_name: str) -> bool:
        """指定された部門に同じ名前のメンバーが存在するかチェック"""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM department_members 
                WHERE department_id = ? AND member_name = ?
            """, (department_id, member_name))
            count = cursor.fetchone()[0]
            return count > 0
        finally:
            conn.close()
