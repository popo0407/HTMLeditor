"""
メール送信API
"""

from fastapi import APIRouter, HTTPException, Form, Depends
from sqlalchemy.orm import Session
import os
import tempfile
from services.mail_service import MailService
from app.services.address_book_service import AddressBookService
from app.models.database import get_db

# 修正点：prefixを削除し、URLの管理をmain.pyに一任します
router = APIRouter(tags=["mail"])
mail_service = MailService()

# 修正点：「/send-mail」から「/send」に変更し、main.pyのprefixと正しく組み合わせられるようにします
@router.post("/send")
async def send_mail(
    common_id: str = Form(...),
    subject: str = Form(...),
    html_content: str = Form(...),
    recipient_emails: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    HTMLコンテンツをメール送信
    """
    try:
        address_book_service = AddressBookService(db)
        _, contacts = address_book_service.get_address_book_with_contacts(common_id)
        
        recipients = [contact.email for contact in contacts]
        if recipient_emails:
            additional_emails = [email.strip() for email in recipient_emails.split(',') if email.strip()]
            recipients.extend(additional_emails)
        
        if not recipients:
            raise HTTPException(status_code=400, detail="受信者が指定されていません")

        # HTMLファイルを一時ファイルとして作成
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(html_content)
            temp_file_path = temp_file.name
        
        try:
            await mail_service.send_html_mail(
                recipients=recipients,
                subject=subject,
                html_content=html_content,
                attachment_path=temp_file_path,
                attachment_name="document.html"
            )
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

        return {
            "success": True,
            "message": f"{len(recipients)}件のメールを送信しました",
            "recipients": recipients
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"メール送信に失敗しました: {str(e)}")

@router.get("/test-connection")
async def test_mail_connection():
    try:
        await mail_service.test_connection()
        return {"success": True, "message": "メールサーバーに正常に接続できました"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"メールサーバー接続に失敗しました: {str(e)}")