"""
メール送信API
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import smtplib
import tempfile
import os
import re
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from services.mail_service import MailService
from app.services.address_book_service import AddressBookService
from app.models.database import get_db
from app.models.database import get_db

router = APIRouter(prefix="/api/mail", tags=["mail"])
mail_service = MailService()

def generate_teams_subject(html_content: str, default_subject: str = "") -> str:
    """
    HTMLコンテンツから Teams 向けの件名を自動生成
    
    Args:
        html_content: HTMLコンテンツ
        default_subject: デフォルトの件名
    
    Returns:
        str: Teams向けに最適化された件名
    """
    try:
        # HTMLからタイトルを抽出
        title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html_content, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
            
            # 日付を抽出（YYYY/MM/DD または YYYY-MM-DD 形式）
            date_match = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', html_content)
            if date_match:
                year, month, day = date_match.groups()
                formatted_date = f"{year}/{month.zfill(2)}/{day.zfill(2)}"
            else:
                # 現在の日付を使用
                formatted_date = datetime.now().strftime("%Y/%m/%d")
            
            # 議事録か会議資料かを判定
            if "議事録" in title or "minutes" in title.lower():
                prefix = "[議事録]"
            elif "資料" in title or "material" in title.lower():
                prefix = "[会議資料]"
            elif "アクション" in html_content or "action" in html_content.lower():
                prefix = "[アクション項目]"
            else:
                prefix = "[議事録]"
            
            # 件名を構成
            if formatted_date in title:
                return f"{prefix} {title}"
            else:
                return f"{prefix} {formatted_date} {title}"
        
        # タイトルが見つからない場合はデフォルト件名を使用
        if default_subject:
            if not default_subject.startswith("["):
                return f"[議事録] {default_subject}"
            return default_subject
        
        # 最後の手段：現在日時を使用
        current_date = datetime.now().strftime("%Y/%m/%d")
        return f"[議事録] {current_date} 会議資料"
        
    except Exception:
        # エラーが発生した場合はデフォルト件名を返す
        return default_subject or f"[議事録] {datetime.now().strftime('%Y/%m/%d')} 会議資料"

def is_teams_channel_email(email: str) -> bool:
    """
    メールアドレスがTeamsチャネルかどうかを判定
    
    Args:
        email: メールアドレス
    
    Returns:
        bool: Teamsチャネルの場合True
    """
    teams_domains = [
        ".onmicrosoft.com",
        "@teams.ms",
        "teams.microsoft.com"
    ]
    return any(domain in email.lower() for domain in teams_domains)

@router.post("/send")
async def send_mail(
    common_id: str = Form(...),
    subject: str = Form(...),
    html_content: str = Form(...),
    recipient_emails: str = Form(None),  # カンマ区切りの追加受信者
    auto_generate_subject: bool = Form(False),  # 件名自動生成フラグ
    db: Session = Depends(get_db)
):
    """
    メール送信API（Teams対応）
    
    Args:
        common_id: 共通ID（アドレス帳から受信者を取得）
        subject: メールの件名
        html_content: HTMLコンテンツ
        recipient_emails: 追加受信者のメールアドレス（カンマ区切り）
        auto_generate_subject: Teams向け件名自動生成フラグ
    """
    try:
        # アドレス帳サービスの初期化
        address_book_service = AddressBookService(db)
        
        # アドレス帳から受信者リストを取得
        try:
            common_id_info, contacts = address_book_service.get_address_book_with_contacts(common_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        
        # 受信者リストを作成
        recipients = [contact.email for contact in contacts]
        
        # 追加受信者がある場合は追加
        if recipient_emails:
            additional_emails = [email.strip() for email in recipient_emails.split(',') if email.strip()]
            recipients.extend(additional_emails)
        
        if not recipients:
            raise HTTPException(status_code=400, detail="受信者が指定されていません")
        
        # Teamsチャネル宛の場合、または自動生成が有効な場合は件名を最適化
        has_teams_recipients = any(is_teams_channel_email(email) for email in recipients)
        final_subject = subject
        
        if auto_generate_subject or has_teams_recipients:
            final_subject = generate_teams_subject(html_content, subject)
        
        # HTMLファイルを一時ファイルとして作成
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(html_content)
            temp_file_path = temp_file.name
        
        try:
            # メール送信
            result = await mail_service.send_html_mail(
                recipients=recipients,
                subject=final_subject,
                html_content=html_content,
                attachment_path=temp_file_path,
                attachment_name="document.html"
            )
            
            return {
                "success": True,
                "message": f"{len(recipients)}件のメールを送信しました",
                "recipients": recipients,
                "subject": final_subject,
                "has_teams_recipients": has_teams_recipients
            }
            
        finally:
            # 一時ファイルを削除
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"メール送信に失敗しました: {str(e)}")

@router.post("/generate-teams-subject")
async def generate_subject_for_teams(
    html_content: str = Form(...),
    current_subject: str = Form("")
):
    """
    Teams向け件名生成API
    
    Args:
        html_content: HTMLコンテンツ
        current_subject: 現在の件名
    
    Returns:
        dict: 生成された件名
    """
    try:
        generated_subject = generate_teams_subject(html_content, current_subject)
        return {
            "success": True,
            "subject": generated_subject,
            "original_subject": current_subject
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"件名生成に失敗しました: {str(e)}")

@router.get("/test-connection")
async def test_mail_connection():
    """
    メールサーバー接続テスト
    """
    try:
        result = await mail_service.test_connection()
        return {"success": True, "message": "メールサーバーに正常に接続できました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"メールサーバー接続に失敗しました: {str(e)}")
