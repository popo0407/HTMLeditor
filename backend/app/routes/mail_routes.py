"""
メール送信API

開発憲章の「関心の分離」に従い、
メール送信機能のみを担当
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from services.mail_service import MailService
from app.config.settings import get_settings

router = APIRouter()

class MailRequest(BaseModel):
    """メール送信リクエスト"""
    subject: str
    html_content: str
    include_pdf: bool = False

class MailResponse(BaseModel):
    """メール送信レスポンス"""
    success: bool
    message: str
    message_id: Optional[str] = None

@router.post("/send", response_model=MailResponse)
async def send_html_email(
    request: MailRequest,
    settings = Depends(get_settings)
):
    """
    固定宛先にHTMLメールを送信
    
    Args:
        request: メール送信リクエスト
        settings: アプリケーション設定
    
    Returns:
        メール送信結果
    """
    try:
        # メールサービスの初期化
        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password="",  # 環境変数から取得
            default_recipient=settings.DEFAULT_RECIPIENT_EMAIL
        )
        
        # 固定宛先にメール送信
        result = mail_service.send_fixed_email(
            subject=request.subject,
            html_content=request.html_content
        )
        
        if result["success"]:
            return MailResponse(
                success=True,
                message="メールが正常に送信されました",
                message_id=result.get("message_id")
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"メール送信に失敗しました: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"メール送信中にエラーが発生しました: {str(e)}"
        )

@router.post("/send-pdf", response_model=MailResponse)
async def send_pdf_email(
    request: MailRequest,
    settings = Depends(get_settings)
):
    """
    固定宛先にPDF添付メールを送信
    
    Args:
        request: メール送信リクエスト
        settings: アプリケーション設定
    
    Returns:
        メール送信結果
    """
    try:
        # メールサービスの初期化
        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password="",  # 環境変数から取得
            default_recipient=settings.DEFAULT_RECIPIENT_EMAIL
        )
        
        # 固定宛先にPDFメール送信
        result = mail_service.send_fixed_pdf_email(
            subject=request.subject,
            html_content=request.html_content
        )
        
        if result["success"]:
            return MailResponse(
                success=True,
                message="PDF添付メールが正常に送信されました",
                message_id=result.get("message_id")
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"PDFメール送信に失敗しました: {result['error']}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDFメール送信中にエラーが発生しました: {str(e)}"
        )

@router.get("/test-connection")
async def test_mail_connection(settings = Depends(get_settings)):
    """
    メールサーバー接続テスト
    
    Args:
        settings: アプリケーション設定
    
    Returns:
        接続テスト結果
    """
    try:
        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password="",  # 環境変数から取得
            default_recipient=settings.DEFAULT_RECIPIENT_EMAIL
        )
        
        # 接続テスト
        result = mail_service.test_connection()
        
        if result["success"]:
            return {
                "success": True,
                "message": "メールサーバーに正常に接続できました"
            }
        else:
            return {
                "success": False,
                "message": f"メールサーバー接続に失敗しました: {result['error']}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"接続テスト中にエラーが発生しました: {str(e)}"
        }
