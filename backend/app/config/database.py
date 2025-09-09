"""
データベース設定とモデル定義
"""

import sqlite3
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# データベースファイルのパス
DB_PATH = Path("data") / "departments.db"

def init_database():
    """データベースの初期化"""
    # dataディレクトリを作成
    DB_PATH.parent.mkdir(exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 部門マスタテーブルの作成
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bu_name TEXT NOT NULL,
                ka_name TEXT NOT NULL,
                job_type TEXT,
                email_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(bu_name, ka_name)
            )
        """)
        
        # 既存テーブルにjob_typeカラムが存在しない場合は追加
        cursor.execute("PRAGMA table_info(departments)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'job_type' not in columns:
            cursor.execute("ALTER TABLE departments ADD COLUMN job_type TEXT")
            logger.info("job_typeカラムを追加しました")
        if 'email_address' not in columns:
            cursor.execute("ALTER TABLE departments ADD COLUMN email_address TEXT")
            logger.info("email_addressカラムを追加しました")
        
        # 職種マスタテーブルの作成
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 部門メンバーテーブルの作成
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS department_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                department_id INTEGER NOT NULL,
                member_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
                UNIQUE(department_id, member_name)
            )
        """)
        
        # 誤字修正リストテーブルの作成
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS typo_corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                department_id INTEGER NOT NULL,
                correct_reading TEXT NOT NULL,
                correct_display TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
            )
        """)
        
        # 既存テーブルにdescriptionカラムが存在しない場合は追加
        cursor.execute("PRAGMA table_info(typo_corrections)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'description' not in columns:
            cursor.execute("ALTER TABLE typo_corrections ADD COLUMN description TEXT")
            logger.info("descriptionカラムを追加しました")
        
        # インデックスの作成
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_corrections_department 
            ON typo_corrections(department_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_corrections_reading 
            ON typo_corrections(correct_reading)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_members_department 
            ON department_members(department_id)
        """)
        
        conn.commit()
        logger.info("データベーステーブルを作成しました")
        
        # サンプルデータの挿入（テスト用）
        insert_sample_data(cursor)
        conn.commit()
        
    except Exception as e:
        logger.error(f"データベース初期化エラー: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def insert_sample_data(cursor):
    """サンプルデータの挿入"""
    # 既存データがあるかチェック
    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] > 0:
        return  # 既存データがある場合はスキップ
    
    # サンプル職種データ
    sample_job_types = [
        "システムエンジニア",
        "プログラマー",
        "プロジェクトマネージャー",
        "営業担当者",
        "営業アシスタント",
        "人事担当者",
        "経理担当者",
        "総務担当者",
    ]
    
    for job_type in sample_job_types:
        cursor.execute("""
            INSERT OR IGNORE INTO job_types (name) 
            VALUES (?)
        """, (job_type,))
    
    # サンプル部門データ
    sample_departments = [
        ("営業部", "第一課", "システムエンジニア", "eigyo1@company.com"),
        ("営業部", "第二課", "営業担当者", "eigyo2@company.com"),
        ("開発部", "システム課", "システムエンジニア", "dev-sys@company.com"),
        ("開発部", "品質管理課", "プロジェクトマネージャー", None),
        ("総務部", "人事課", "人事担当者", "hr@company.com"),
        ("総務部", "経理課", "経理担当者", None),
    ]
    
    department_ids = []
    for bu_name, ka_name, job_type, email in sample_departments:
        cursor.execute("""
            INSERT OR IGNORE INTO departments (bu_name, ka_name, job_type, email_address) 
            VALUES (?, ?, ?, ?)
        """, (bu_name, ka_name, job_type, email))
        
        # 挿入されたIDを取得
        cursor.execute("""
            SELECT id FROM departments WHERE bu_name = ? AND ka_name = ?
        """, (bu_name, ka_name))
        dept_id = cursor.fetchone()[0]
        department_ids.append(dept_id)
    
    # サンプルメンバーデータ
    sample_members = [
        (department_ids[0], "田中太郎"),
        (department_ids[0], "佐藤花子"),
        (department_ids[1], "山田次郎"),
        (department_ids[1], "鈴木美咲"),
        (department_ids[2], "高橋健太"),
        (department_ids[2], "渡辺あい"),
        (department_ids[2], "中村大輔"),
        (department_ids[4], "伊藤みどり"),
        (department_ids[5], "加藤正雄"),
    ]
    
    for dept_id, member_name in sample_members:
        cursor.execute("""
            INSERT OR IGNORE INTO department_members (department_id, member_name) 
            VALUES (?, ?)
        """, (dept_id, member_name))
    
    # サンプル誤字修正データ
    sample_corrections = [
        (department_ids[0], "えいぎょう", "営業", "営業部でよく使用される用語"),
        (department_ids[0], "しょうひん", "商品", "商品に関する表記"),
        (department_ids[0], "かくにん", "確認", "確認作業の表記"),
        (department_ids[1], "うりあげ", "売上", "売上実績の表記"),
        (department_ids[1], "もくひょう", "目標", "目標設定の表記"),
        (department_ids[2], "かいはつ", "開発", "システム開発用語"),
        (department_ids[2], "しすてむ", "システム", "システム関連用語"),
        (department_ids[2], "ぷろぐらみんぐ", "プログラミング", "プログラミング関連用語"),
    ]
    
    for dept_id, reading, display, description in sample_corrections:
        cursor.execute("""
            INSERT INTO typo_corrections (department_id, correct_reading, correct_display, description) 
            VALUES (?, ?, ?, ?)
        """, (dept_id, reading, display, description))
    
    logger.info("サンプルデータを挿入しました")


def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 辞書形式でアクセス可能にする
    return conn
