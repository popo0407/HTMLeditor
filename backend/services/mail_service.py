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
            
            # RFC 2231準拠のファイル名エンコーディング（日本語対応）
            import urllib.parse
            import base64
            import logging
            logger = logging.getLogger(__name__)
            
            # RFC 2047 Base64エンコーディング（一部のメールクライアント用）
            encoded_b64 = base64.b64encode(pdf_filename.encode('utf-8')).decode('ascii')
            rfc2047_filename = f"=?UTF-8?B?{encoded_b64}?="
            
            # RFC 2231 URLエンコーディング
            encoded_filename = urllib.parse.quote(pdf_filename.encode('utf-8'))
            
            # 複数の形式で設定（メールクライアント互換性向上）
            content_disposition = f'attachment; filename="{rfc2047_filename}"; filename*=UTF-8\'\'{encoded_filename}'
            
            logger.info(f"PDF Content-Disposition header: {content_disposition}")
            logger.info(f"Original PDF filename: {pdf_filename}")
            logger.info(f"RFC 2047 filename: {rfc2047_filename}")
            logger.info(f"RFC 2231 encoded filename: {encoded_filename}")
            
            attachment.add_header('Content-Disposition', content_disposition)
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

    def send_json_with_pdf_and_source_data(self,
                                           to_emails: List[str],
                                           subject: str,
                                           body_json_text: str,
                                           pdf_bytes: bytes,
                                           pdf_filename: str = 'document.pdf',
                                           source_data_attachment: Optional[Dict[str, Any]] = None,
                                           cc_emails: Optional[List[str]] = None,
                                           bcc_emails: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        PDF + 元データファイル/テキストを添付してメール送信
        
        Args:
            source_data_attachment: 元データ添付情報
                - filename: ファイル名
                - content: ファイル内容（bytes）
                - mime_type: MIMEタイプ
        """
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
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(pdf_bytes)
            encoders.encode_base64(pdf_attachment)
            
            # RFC 2231準拠のファイル名エンコーディング（日本語対応）
            import urllib.parse
            import base64
            import logging
            logger = logging.getLogger(__name__)
            
            # RFC 2047 Base64エンコーディング（一部のメールクライアント用）
            encoded_pdf_b64 = base64.b64encode(pdf_filename.encode('utf-8')).decode('ascii')
            rfc2047_pdf_filename = f"=?UTF-8?B?{encoded_pdf_b64}?="
            
            # RFC 2231 URLエンコーディング
            encoded_pdf_filename = urllib.parse.quote(pdf_filename.encode('utf-8'))
            
            # 複数の形式で設定（メールクライアント互換性向上）
            pdf_content_disposition = f'attachment; filename="{rfc2047_pdf_filename}"; filename*=UTF-8\'\'{encoded_pdf_filename}'
            
            logger.info(f"PDF Content-Disposition header: {pdf_content_disposition}")
            logger.info(f"Original PDF filename: {pdf_filename}")
            logger.info(f"RFC 2047 PDF filename: {rfc2047_pdf_filename}")
            logger.info(f"RFC 2231 encoded PDF filename: {encoded_pdf_filename}")
            
            pdf_attachment.add_header('Content-Disposition', pdf_content_disposition)
            message.attach(pdf_attachment)

            # attach source data if provided
            if source_data_attachment:
                if source_data_attachment['mime_type'].startswith('text/'):
                    # テキストファイルの場合
                    source_attachment = MIMEText(
                        source_data_attachment['content'].decode('utf-8'),
                        'plain',
                        _charset='utf-8'
                    )
                else:
                    # バイナリファイルの場合
                    main_type, sub_type = source_data_attachment['mime_type'].split('/', 1)
                    source_attachment = MIMEBase(main_type, sub_type)
                    source_attachment.set_payload(source_data_attachment['content'])
                    encoders.encode_base64(source_attachment)
                
                # RFC 2231準拠のファイル名エンコーディング（日本語対応）
                import urllib.parse
                import base64
                
                source_filename = source_data_attachment["filename"]
                
                # RFC 2047 Base64エンコーディング（一部のメールクライアント用）
                encoded_source_b64 = base64.b64encode(source_filename.encode('utf-8')).decode('ascii')
                rfc2047_source_filename = f"=?UTF-8?B?{encoded_source_b64}?="
                
                # RFC 2231 URLエンコーディング
                encoded_source_filename = urllib.parse.quote(source_filename.encode('utf-8'))
                
                # 複数の形式で設定（メールクライアント互換性向上）
                source_content_disposition = f'attachment; filename="{rfc2047_source_filename}"; filename*=UTF-8\'\'{encoded_source_filename}'
                
                logger.info(f"Source Data Content-Disposition header: {source_content_disposition}")
                logger.info(f"Original source filename: {source_filename}")
                logger.info(f"RFC 2047 source filename: {rfc2047_source_filename}")
                logger.info(f"RFC 2231 encoded source filename: {encoded_source_filename}")
                
                source_attachment.add_header('Content-Disposition', source_content_disposition)
                message.attach(source_attachment)

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

            attachment_info = f" + 元データ ({source_data_attachment['filename']})" if source_data_attachment else ""
            return {
                "success": True, 
                "message": f"PDF{attachment_info}添付メールが正常に送信されました", 
                "recipients": all_recipients
            }
        except Exception as e:
            logger.error(f"JSON+PDF+元データ 添付メール送信エラー: {e}")
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
            
