"""
アドレス帳サービス

ビジネスロジック層の責務:
- アプリケーション固有のルールやデータ処理フローを実装
- 複数のRepositoryを協調させる統括的な処理
- 上位層（API層）に対してビジネス機能を提供

開発憲章の「サービスレイヤパターン」「複数の責務を束ねる統括サービス」に従う
"""

from sqlalchemy.orm import Session
from typing import List, Tuple
from app.repositories.address_book_repository import AddressBookRepository
from app.models.schemas import (
    CommonIDCreate, ContactCreate, CommonIDResponse, ContactResponse,
    AddressBookValidationResponse
)

class AddressBookService:
    """
    アドレス帳管理の統括サービス
    
    ビジネスルール:
    - 共通IDの存在チェックと自動作成
    - アドレス帳と連絡先の整合性管理
    """

    def __init__(self, db: Session):
        """
        依存性注入でデータベースセッションを受け取り、
        必要なRepositoryを初期化
        """
        self.repository = AddressBookRepository(db)

    def validate_common_id(self, common_id: str) -> AddressBookValidationResponse:
        """
        共通IDの検証と存在チェック
        
        ビジネスルール:
        - 共通IDが存在する場合: 関連する連絡先リストと共に返す
        - 存在しない場合: exists=Falseで返す（作成判断は呼び出し元に委ねる）
        
        Args:
            common_id: 検証する共通ID
            
        Returns:
            検証結果と連絡先リスト
        """
        db_common_id = self.repository.get_common_id(common_id)
        
        if db_common_id:
            # 既存の共通IDの場合、関連する連絡先も取得
            contacts = self.repository.get_contacts_by_common_id(common_id)
            contact_responses = [
                ContactResponse.model_validate(contact) for contact in contacts
            ]
            
            return AddressBookValidationResponse(
                exists=True,
                common_id=common_id,
                contacts=contact_responses
            )
        else:
            # 存在しない場合
            return AddressBookValidationResponse(
                exists=False,
                common_id=common_id,
                contacts=[]
            )

    def create_address_book(self, common_id: str) -> CommonIDResponse:
        """
        新しいアドレス帳（共通ID）を作成
        
        ビジネスルール:
        - 既に存在する共通IDの場合はエラー
        - 作成後は空の連絡先リストを持つアドレス帳となる
        
        Args:
            common_id: 作成する共通ID
            
        Returns:
            作成された共通IDの情報
            
        Raises:
            ValueError: 共通IDが既に存在する場合
        """
        # 重複チェック
        existing = self.repository.get_common_id(common_id)
        if existing:
            raise ValueError(f"共通ID '{common_id}' は既に存在します")

        # 新規作成
        common_id_data = CommonIDCreate(common_id=common_id)
        db_common_id = self.repository.create_common_id(common_id_data)
        
        return CommonIDResponse.model_validate(db_common_id)

    def add_contact(self, common_id: str, contact_data: ContactCreate) -> ContactResponse:
        """
        指定したアドレス帳に新しい連絡先を追加
        
        ビジネスルール:
        - 共通IDが存在しない場合はエラー
        - 同一アドレス帳内でのメールアドレス重複は許可（要件定義で制限なし）
        
        Args:
            common_id: 追加先の共通ID
            contact_data: 追加する連絡先データ
            
        Returns:
            追加された連絡先の情報
            
        Raises:
            ValueError: 共通IDが存在しない場合
        """
        # 共通IDの存在チェック
        existing_common_id = self.repository.get_common_id(common_id)
        if not existing_common_id:
            raise ValueError(f"共通ID '{common_id}' が存在しません")

        # 連絡先追加
        db_contact = self.repository.create_contact(common_id, contact_data)
        
        return ContactResponse.model_validate(db_contact)

    def get_address_book_with_contacts(self, common_id: str) -> Tuple[CommonIDResponse, List[ContactResponse]]:
        """
        アドレス帳と全連絡先を取得
        
        Args:
            common_id: 取得する共通ID
            
        Returns:
            (共通ID情報, 連絡先リスト)のタプル
            
        Raises:
            ValueError: 共通IDが存在しない場合
        """
        db_common_id = self.repository.get_common_id(common_id)
        if not db_common_id:
            raise ValueError(f"共通ID '{common_id}' が存在しません")

        contacts = self.repository.get_contacts_by_common_id(common_id)
        
        common_id_response = CommonIDResponse.model_validate(db_common_id)
        contact_responses = [ContactResponse.model_validate(contact) for contact in contacts]
        
        return common_id_response, contact_responses
