"""
アドレス帳関連API

プレゼンテーション層の責務:
- HTTPリクエストを受け取り、バリデーションを行う
- 適切なServiceを呼び出して、結果をHTTPレスポンスとして返す
- ビジネスロジックは含まない（Serviceが担当）

開発憲章の「サービスの責務を厳格に定義」に従う
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import (
    AddressBookValidationRequest, AddressBookValidationResponse,
    CommonIDCreate, CommonIDResponse,
    ContactCreate, ContactResponse
)
from app.services.address_book_service import AddressBookService

router = APIRouter()

@router.post("/address-books/validate", response_model=AddressBookValidationResponse)
async def validate_address_book(
    request: AddressBookValidationRequest,
    db: Session = Depends(get_db)
):
    """
    共通IDの存在チェック
    
    要件 F-004-1: メール送信時に共通IDの入力を要求する
    """
    service = AddressBookService(db)
    
    try:
        result = service.validate_common_id(request.common_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"共通IDの検証中にエラーが発生しました: {str(e)}"
        )

@router.post("/address-books", response_model=CommonIDResponse)
async def create_address_book(
    request: CommonIDCreate,
    db: Session = Depends(get_db)
):
    """
    新しいアドレス帳（共通ID）を作成
    
    要件 F-004-2: 存在しない共通IDの場合、新規作成を確認し、アドレス帳を紐づけて作成する
    """
    service = AddressBookService(db)
    
    try:
        result = service.create_address_book(request.common_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"アドレス帳の作成中にエラーが発生しました: {str(e)}"
        )

@router.post("/address-books/{common_id}/contacts", response_model=ContactResponse)
async def add_contact(
    common_id: str,
    contact: ContactCreate,
    db: Session = Depends(get_db)
):
    """
    指定したアドレス帳に新しい連絡先を追加
    
    要件 F-006-2: メール作成画面から新しい連絡先を追加登録できる
    """
    service = AddressBookService(db)
    
    try:
        result = service.add_contact(common_id, contact)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"連絡先の追加中にエラーが発生しました: {str(e)}"
        )

@router.get("/address-books/{common_id}/contacts", response_model=List[ContactResponse])
async def get_contacts(
    common_id: str,
    db: Session = Depends(get_db)
):
    """
    指定したアドレス帳の連絡先リストを取得
    
    要件 F-005-3: 宛先は共通IDに紐づくアドレス帳から選択
    """
    service = AddressBookService(db)
    
    try:
        _, contacts = service.get_address_book_with_contacts(common_id)
        return contacts
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"連絡先の取得中にエラーが発生しました: {str(e)}"
        )
