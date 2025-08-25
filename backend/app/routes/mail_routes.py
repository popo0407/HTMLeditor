"""
メール送信API

開発憲章の「関心の分離」に従い、
メール送信機能のみを担当
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.mail_service import MailService
from app.config.settings import get_settings
from services.minutes_pdf_service import generate_minutes_pdf
import datetime
import re

router = APIRouter()

def sanitize_filename(filename: str) -> str:
    """ファイル名に使用できない文字をアンダーバーに置き換える"""
    if not filename:
        return "議事録"
    
    # Windows/Linux/macOSで禁止されている文字を置き換え
    forbidden_chars = r'[<>:"/\\|?*\x00-\x1f]'
    sanitized = re.sub(forbidden_chars, '_', filename)
    
    # 先頭・末尾のドット、スペースを削除
    sanitized = sanitized.strip('. ')
    
    # 空文字列の場合はデフォルト名を返す
    if not sanitized:
        return "議事録"
    
    # 長すぎる場合は切り詰め（拡張子分を考慮して200文字以内）
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    
    return sanitized

class MailRequest(BaseModel):
    """メール送信リクエスト (旧)"""
    subject: str
    html_content: str
    include_pdf: bool = False


class PdfMailRequest(BaseModel):
    subject: Optional[str] = None
    recipient_email: Optional[str] = None
    meetingInfo: Optional[dict] = None
    minutesHtml: Optional[str] = None

class MailResponse(BaseModel):
    """メール送信レスポンス"""
    success: bool
    message: str
    message_id: Optional[str] = None

# NOTE: /send endpoint (HTML-attached emails) removed.
# Application uses PDF-attached flow only via /send-pdf.

@router.post("/send-pdf", response_model=MailResponse)
async def send_pdf_email(
    request: PdfMailRequest,
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
        # validate input (minutesHtml required)
        if not request.minutesHtml:
            raise HTTPException(status_code=400, detail='minutesHtml is required')

        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password="",
            default_recipient=settings.DEFAULT_RECIPIENT_EMAIL
        )

        # prepare JSON body for email (only the requested fields)
        # prepare body JSON for email; classification fields removed intentionally
        body_json = {
            "会議タイトル": (request.meetingInfo or {}).get('会議タイトル') or (request.meetingInfo or {}).get('title') or '',
            "参加者": (request.meetingInfo or {}).get('参加者') or (request.meetingInfo or {}).get('participants') or [],
            "会議日時": (request.meetingInfo or {}).get('会議日時') or (request.meetingInfo or {}).get('datetime') or '',
            "会議場所": (request.meetingInfo or {}).get('会議場所') or (request.meetingInfo or {}).get('location') or '',
            "部門": (request.meetingInfo or {}).get('部門') or (request.meetingInfo or {}).get('department') or '',
            "大分類": (request.meetingInfo or {}).get('大分類') or (request.meetingInfo or {}).get('category1') or '',
            "中分類": (request.meetingInfo or {}).get('中分類') or (request.meetingInfo or {}).get('category2') or '',
            "小分類": (request.meetingInfo or {}).get('小分類') or (request.meetingInfo or {}).get('category3') or '',
        }

        # PDF 生成 (集中化サービス)
        try:
            pdf_bytes = generate_minutes_pdf(request.meetingInfo or {}, request.minutesHtml or '')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF生成失敗: {e}")

        # subject and recipient
        subject = request.subject or '議事録'
        recipients = [request.recipient_email] if request.recipient_email else [settings.DEFAULT_RECIPIENT_EMAIL]

        # ファイル名を会議タイトルに基づいて生成
        meeting_title = (request.meetingInfo or {}).get('会議タイトル') or (request.meetingInfo or {}).get('title') or '議事録'
        pdf_filename = f"{sanitize_filename(meeting_title)}.pdf"

        # send email: body is pretty JSON
        import json
        body_text = json.dumps(body_json, ensure_ascii=False, indent=2)

        result = mail_service.send_json_with_pdf(
            to_emails=recipients,
            subject=subject,
            body_json_text=body_text,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename
        )

        if result.get("success"):
            return MailResponse(success=True, message="PDF添付メールが正常に送信されました", message_id=result.get("message_id"))
        else:
            raise HTTPException(status_code=500, detail=f"PDFメール送信に失敗しました: {result.get('error')}")
            
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
