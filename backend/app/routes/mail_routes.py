"""
メール送信関連API

フェーズ3で詳細実装予定
現在は基本的な構造のみ定義
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.models.database import get_db

router = APIRouter()

class MailSendRequest(BaseModel):
    """メール送信リクエスト（暫定）"""
    common_id: str
    recipients: List[str]
    html_content: str

@router.post("/send-mail")
async def send_mail(
    request: MailSendRequest,
    db: Session = Depends(get_db)
):
    """
    HTMLコンテンツをメール送信
    
    要件 F-005-1: 編集内容を指定宛先にメール送信できる
    
    注意: フェーズ3で詳細実装予定
    """
    # TODO: フェーズ3で実装
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="メール送信機能はフェーズ3で実装予定です"
    )
