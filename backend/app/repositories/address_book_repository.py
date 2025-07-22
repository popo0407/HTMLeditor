"""
アドレス帳リポジトリ

データアクセス層の責務:
- データベースとの具体的なやり取りのみを担当
- SQLAlchemyを使用したCRUD操作の実装
- ビジネスロジックは含まない（上位のServiceが担当）

開発憲章の「依存性注入を徹底」「関心の分離」の原則に従う
"""

from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.address_book import CommonID, Contact
from app.models.schemas import CommonIDCreate, ContactCreate

class AddressBookRepository:
    """
    アドレス帳データアクセス専用クラス
    
    単一責任の原則に従い、データベース操作のみに特化
    """

    def __init__(self, db: Session):
        """
        依存性注入でデータベースセッションを受け取る
        
        Args:
            db: SQLAlchemyセッション
        """
        self.db = db

    def get_common_id(self, common_id: str) -> Optional[CommonID]:
        """
        共通IDを取得
        
        Args:
            common_id: 検索する共通ID文字列
            
        Returns:
            CommonIDオブジェクト（存在しない場合はNone）
        """
        return self.db.query(CommonID).filter(CommonID.common_id == common_id).first()

    def create_common_id(self, common_id_data: CommonIDCreate) -> CommonID:
        """
        新しい共通IDを作成
        
        Args:
            common_id_data: 作成する共通IDのデータ
            
        Returns:
            作成されたCommonIDオブジェクト
        """
        db_common_id = CommonID(common_id=common_id_data.common_id)
        self.db.add(db_common_id)
        self.db.commit()
        self.db.refresh(db_common_id)
        return db_common_id

    def get_contacts_by_common_id(self, common_id: str) -> List[Contact]:
        """
        指定した共通IDに属する連絡先リストを取得
        
        Args:
            common_id: 共通ID文字列
            
        Returns:
            連絡先のリスト
        """
        return self.db.query(Contact).filter(Contact.common_id == common_id).all()

    def create_contact(self, common_id: str, contact_data: ContactCreate) -> Contact:
        """
        新しい連絡先を作成
        
        Args:
            common_id: 所属する共通ID
            contact_data: 作成する連絡先のデータ
            
        Returns:
            作成されたContactオブジェクト
        """
        db_contact = Contact(
            common_id=common_id,
            name=contact_data.name,
            email=contact_data.email
        )
        self.db.add(db_contact)
        self.db.commit()
        self.db.refresh(db_contact)
        return db_contact

    def delete_contact(self, contact_id: int) -> bool:
        """
        連絡先を削除
        
        Args:
            contact_id: 削除する連絡先のID
            
        Returns:
            削除成功時True、対象が存在しない場合False
        """
        contact = self.db.query(Contact).filter(Contact.id == contact_id).first()
        if contact:
            self.db.delete(contact)
            self.db.commit()
            return True
        return False
