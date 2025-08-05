"""
メール送信API

開発憲章の「設定とロジックを分離」原則に従い、
設定ファイルから宛先とテンプレートを取得
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..config.settings import get_settings, Settings
from services.mail_service import MailService

router = APIRouter(prefix="/mail", tags=["mail"])


class MailSendRequest(BaseModel):
    """メール送信リクエスト"""
    subject: str
    body: str
    recipient_email: Optional[str] = None


class MailSendResponse(BaseModel):
    """メール送信レスポンス"""
    success: bool
    message: str


class EmailTemplatesResponse(BaseModel):
    """メールテンプレート取得レスポンス"""
    default_recipient: str
    subject_templates: List[str]
    default_subject: str
    body_templates: List[str]


@router.get("/templates", response_model=EmailTemplatesResponse)
async def get_email_templates(settings: Settings = Depends(get_settings)):
    """
    メールテンプレート設定を取得
    
    Returns:
        設定ファイルから取得したテンプレート情報
    """
    templates = settings.get_email_templates()
    return EmailTemplatesResponse(**templates)


@router.post("/send", response_model=MailSendResponse)
async def send_mail(
    request: MailSendRequest,
    settings: Settings = Depends(get_settings)
):
    """
    HTMLメールを送信
    
    Args:
        request: メール送信リクエスト
        settings: アプリケーション設定
    
    Returns:
        送信結果
    """
    try:
        # 設定からデフォルト値を取得
        templates = settings.get_email_templates()
        smtp_config = settings.get_smtp_config()
        
        # 宛先の決定（リクエスト > 設定ファイルのデフォルト）
        recipient_email = request.recipient_email or templates['default_recipient']
        if not recipient_email:
            raise HTTPException(
                status_code=400, 
                detail="宛先メールアドレスが設定されていません"
            )
        
        # 件名の決定（リクエスト > 設定ファイルのデフォルト）
        subject = request.subject or templates['default_subject']
        
        # メール送信サービスの初期化
        mail_service = MailService(
            mail_from=smtp_config['mail_from'],
            mail_host=smtp_config['mail_host'],
            mail_port=smtp_config['mail_port']
        )
        
        # メール送信
        result = mail_service.send_notification_email(
            to_email=recipient_email,
            subject=subject,
            body=request.body
        )
        
        if result['success']:
            return MailSendResponse(
                success=True,
                message="メールが正常に送信されました"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"メール送信に失敗しました: {result.get('error', '不明なエラー')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"メール送信中にエラーが発生しました: {str(e)}"
        )