"""
メール送信サービス

開発憲章の「関心の分離」に従い、
メール送信機能のみを担当
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import os
from pathlib import Path
import tempfile
import logging
import re
logger = logging.getLogger(__name__)
try:  # pragma: no cover - 環境差異による
    from weasyprint import HTML  # type: ignore
    WEASY_AVAILABLE = True
except Exception:
    WEASY_AVAILABLE = False

# フォールバック用 (reportlab は既に requirements に存在)
from reportlab.pdfgen import canvas  # type: ignore
from reportlab.lib.pagesizes import A4  # type: ignore
from reportlab.lib.utils import simpleSplit  # type: ignore
class MailService:
    """メール送信サービス（認証なし、件名/本文を固定）"""

    def __init__(self, host: str, port: int, username: str, password: str = "", default_recipient: str = ""):
        """初期化。password は無視する（認証しない）。"""
        self.host = host
        self.port = port
        self.username = username
        self.password = ""  # 常に空にする
        self.default_recipient = default_recipient
        self.context = ssl.create_default_context()

    def send_fixed_email(self, subject: str, html_content: str) -> Dict[str, Any]:
        """固定宛先に HTML メールを送信（件名/本文は固定）"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "議事録"
            msg["From"] = self.username
            msg["To"] = self.default_recipient

            # 本文は固定（プレーンテキスト）
            text_part = MIMEText("議事録", "plain")
            msg.attach(text_part)

            # HTMLファイルを添付（document.html）
            attachment = MIMEBase('text', 'html')
            attachment.set_payload(html_content.encode('utf-8'))
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', 'attachment; filename="document.html"')
            msg.attach(attachment)

            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                # 認証は行わない
                server.send_message(msg, to_addrs=[self.default_recipient])

            logger.info("固定宛先にHTMLメールを送信しました")
            return {"success": True, "message": "メールが正常に送信されました", "recipients": [self.default_recipient]}
        except Exception as e:
            logger.error(f"固定宛先HTMLメール送信エラー: {e}")
            return {"success": False, "error": str(e)}

    def send_fixed_pdf_email(self, subject: str, html_content: str) -> Dict[str, Any]:
        """固定宛先に PDF 添付メールを送信（件名/本文は固定）"""
        try:
            msg = MIMEMultipart()
            msg["Subject"] = "議事録"
            msg["From"] = self.username
            msg["To"] = self.default_recipient

            # 本文は固定
            html_part = MIMEText("議事録", "html")
            msg.attach(html_part)

            # PDF 生成・添付
            pdf_attachment = self._create_pdf_from_html(html_content)
            if pdf_attachment:
                msg.attach(pdf_attachment)

            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                # 認証は行わない
                server.send_message(msg, to_addrs=[self.default_recipient])

            logger.info("固定宛先にPDF添付メールを送信しました")
            return {"success": True, "message": "PDF添付メールが正常に送信されました", "recipients": [self.default_recipient]}
        except Exception as e:
            logger.error(f"固定宛先PDF添付メール送信エラー: {e}")
            return {"success": False, "error": str(e)}

    def send_html_email(self, to_emails: List[str], subject: str, html_content: str, cc_emails: Optional[List[str]] = None, bcc_emails: Optional[List[str]] = None) -> Dict[str, Any]:
        """任意宛先へHTMLメール送信だが件名/本文は固定する"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "議事録"
            msg["From"] = self.username
            msg["To"] = ", ".join(to_emails)
            if cc_emails:
                msg["Cc"] = ", ".join(cc_emails)

            html_part = MIMEText("議事録", "html")
            msg.attach(html_part)

            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)

            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                # 認証は行わない
                server.send_message(msg, to_addrs=all_recipients)

            logger.info("HTMLメールを送信しました")
            return {"success": True, "message": "メールが正常に送信されました", "recipients": all_recipients}
        except Exception as e:
            logger.error(f"HTMLメール送信エラー: {e}")
            return {"success": False, "error": str(e)}

    def send_pdf_email(self, to_emails: List[str], subject: str, html_content: str, cc_emails: Optional[List[str]] = None, bcc_emails: Optional[List[str]] = None) -> Dict[str, Any]:
        """任意宛先へPDF添付メール送信だが件名/本文は固定する"""
        try:
            msg = MIMEMultipart()
            msg["Subject"] = "議事録"
            msg["From"] = self.username
            msg["To"] = ", ".join(to_emails)
            if cc_emails:
                msg["Cc"] = ", ".join(cc_emails)

            html_part = MIMEText("議事録", "html")
            msg.attach(html_part)

            pdf_attachment = self._create_pdf_from_html(html_content)
            if pdf_attachment:
                msg.attach(pdf_attachment)

            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)

            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                # 認証は行わない
                server.send_message(msg, to_addrs=all_recipients)

            logger.info("PDF添付メールを送信しました")
            return {"success": True, "message": "PDF添付メールが正常に送信されました", "recipients": all_recipients}
        except Exception as e:
            logger.error(f"PDF添付メール送信エラー: {e}")
            return {"success": False, "error": str(e)}

    def _create_pdf_from_html(self, html_content: str) -> Optional[MIMEBase]:
        # 既存の実装を維持（そのままコピー）
        try:
            if WEASY_AVAILABLE:
                with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                    f.write(html_content)
                    html_file = f.name
                pdf_file = html_file.replace('.html', '.pdf')
                try:
                    HTML(filename=html_file).write_pdf(pdf_file)  # type: ignore
                except Exception as we_err:
                    logger.warning(f"weasyprint PDF 生成失敗 (fallback使用): {we_err}")
                    os.unlink(html_file)
                    return self._fallback_pdf(html_content)

                with open(pdf_file, "rb") as f:
                    attachment = MIMEBase("application", "octet-stream")
                    attachment.set_payload(f.read())
                encoders.encode_base64(attachment)
                attachment.add_header("Content-Disposition", f"attachment; filename= {Path(pdf_file).name}")
                os.unlink(html_file)
                os.unlink(pdf_file)
                return attachment
            else:
                return self._fallback_pdf(html_content)
        except Exception as e:
            logger.error(f"PDF生成エラー: {e}")
            return None

    def _fallback_pdf(self, html_content: str) -> Optional[MIMEBase]:
        try:
            text = re.sub(r'<[^>]+>', '', html_content)
            text = text.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')

            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
                pdf_path = f.name

            c = canvas.Canvas(pdf_path, pagesize=A4)
            width, height = A4
            margin = 40
            max_width = width - margin * 2
            y = height - margin
            font_name = 'Helvetica'
            font_size = 10
            c.setFont(font_name, font_size)

            for paragraph in text.splitlines():
                if not paragraph.strip():
                    y -= font_size * 1.2
                    if y < margin:
                        c.showPage(); c.setFont(font_name, font_size); y = height - margin
                    continue
                lines = simpleSplit(paragraph, font_name, font_size, max_width)
                for line in lines:
                    c.drawString(margin, y, line)
                    y -= font_size * 1.2
                    if y < margin:
                        c.showPage(); c.setFont(font_name, font_size); y = height - margin
            c.save()

            with open(pdf_path, 'rb') as rf:
                attachment = MIMEBase('application', 'octet-stream')
                attachment.set_payload(rf.read())
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', f'attachment; filename=export.pdf')
            os.unlink(pdf_path)
            return attachment
        except Exception as e:
            logger.error(f"フォールバック PDF 生成失敗: {e}")
            return None

    def test_connection(self) -> Dict[str, Any]:
        try:
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                # 認証は行わない
            logger.info("SMTPサーバー接続テスト成功")
            return {"success": True, "message": "SMTPサーバーに正常に接続できました"}
        except Exception as e:
            logger.error(f"SMTP接続テストエラー: {e}")
            return {"success": False, "error": str(e)}
            logger.error(f"フォールバック PDF 生成失敗: {e}")
            return None
    
    def test_connection(self) -> Dict[str, Any]:
        """
        SMTPサーバー接続テスト
        
        Returns:
            接続テスト結果
        """
        try:
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                server.login(self.username, self.password)
            
            logger.info("SMTPサーバー接続テスト成功")
            return {
                "success": True,
                "message": "SMTPサーバーに正常に接続できました"
            }
            
        except Exception as e:
            logger.error(f"SMTP接続テストエラー: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
