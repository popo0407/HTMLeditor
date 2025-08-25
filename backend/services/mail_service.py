"""
メール送信サービス

責務: メール送信 (HTML送信 + JSON本文+PDF添付)
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class MailService:
    """メール送信サービス"""

    def __init__(self, host: str, port: int, username: str, password: str = "", default_recipient: str = ""):
        self.host = host
        self.port = port
        self.username = username
        self.password = password or os.getenv('SMTP_PASSWORD', '')
        self.default_recipient = default_recipient
        self.context = ssl.create_default_context()
    # send_fixed_email and send_html_email removed: application only sends PDF-attached emails now

    def send_json_with_pdf(self,
                           to_emails: List[str],
                           subject: str,
                           body_json_text: str,
                           pdf_bytes: bytes,
                           pdf_filename: str = 'document.pdf',
                           cc_emails: Optional[List[str]] = None,
                           bcc_emails: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            message = MIMEMultipart()
            message["Subject"] = subject
            message["From"] = self.username
            message["To"] = ", ".join(to_emails)

            if cc_emails:
                message["Cc"] = ", ".join(cc_emails)

            # JSON as plain text
            text_part = MIMEText(body_json_text, "plain", _charset='utf-8')
            message.attach(text_part)

            # attach PDF
            attachment = MIMEBase('application', 'pdf')
            attachment.set_payload(pdf_bytes)
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', f'attachment; filename="{pdf_filename}"')
            message.attach(attachment)

            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)

            with smtplib.SMTP(self.host, self.port, timeout=20) as server:
                try:
                    server.ehlo()
                except Exception:
                    pass
                try:
                    if server.has_extn('starttls'):
                        server.starttls(context=self.context)
                        server.ehlo()
                except Exception:
                    logger.debug('STARTTLS not available; continuing')

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed: {e}")
                        return {"success": False, "error": str(e)}

                server.send_message(message, to_addrs=all_recipients)

            return {"success": True, "message": "PDF添付メールが正常に送信されました", "recipients": all_recipients}
        except Exception as e:
            logger.error(f"JSON+PDF 添付メール送信エラー: {e}")
            return {"success": False, "error": str(e)}

    def test_connection(self) -> Dict[str, Any]:
        try:
            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                try:
                    server.ehlo()
                except Exception:
                    pass
                try:
                    if server.has_extn('starttls'):
                        server.starttls(context=self.context)
                        server.ehlo()
                except Exception as e:
                    logger.debug(f"STARTTLS check failed: {e}")

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed during test: {e}")
                        return {"success": False, "error": str(e)}

            return {"success": True, "message": "SMTPサーバーに正常に接続できました"}
        except Exception as e:
            logger.error(f"SMTP接続テストエラー: {e}")
            return {"success": False, "error": str(e)}
            
