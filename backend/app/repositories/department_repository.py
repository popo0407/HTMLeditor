"""
部門管理のリポジトリ層
"""

import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from app.config.database import get_db_connection
from app.models.department_models import (
    Department, DepartmentCreate,
    TypoCorrection, TypoCorrectionCreate, TypoCorrectionUpdate
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
                SELECT id, bu_name, ka_name, job_type, created_at 
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
                SELECT id, bu_name, ka_name, job_type, created_at 
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
                INSERT INTO departments (bu_name, ka_name, job_type) 
                VALUES (?, ?, ?)
            """, (department.bu_name, department.ka_name, department.job_type))
            
            department_id = cursor.lastrowid
            conn.commit()
            
            # 作成された部門を取得して返す
            return DepartmentRepository.get_department_by_id(department_id)
        finally:
            conn.close()
    
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
