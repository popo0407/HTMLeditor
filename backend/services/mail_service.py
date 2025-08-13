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
from weasyprint import HTML
import logging

logger = logging.getLogger(__name__)

class MailService:
    """メール送信サービス"""
    
    def __init__(self, host: str, port: int, username: str, password: str = "", default_recipient: str = ""):
        """
        メールサービスの初期化
        
        Args:
            host: SMTPサーバーホスト
            port: SMTPサーバーポート
            username: 送信者メールアドレス
            password: SMTPパスワード（環境変数から取得）
            default_recipient: 固定宛先メールアドレス
        """
        self.host = host
        self.port = port
        self.username = username
        self.password = password or os.getenv('SMTP_PASSWORD', '')
        self.default_recipient = default_recipient
        
        # SSL/TLS設定
        self.context = ssl.create_default_context()
    
    def send_fixed_email(self, subject: str, html_content: str) -> Dict[str, Any]:
        """
        固定宛先にHTMLメールを送信
        
        Args:
            subject: 件名
            html_content: HTML本文
        
        Returns:
            送信結果
        """
        try:
            # メールメッセージの作成
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.username
            message["To"] = self.default_recipient
            
            # HTML本文の追加
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # メール送信
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                server.login(self.username, self.password)
                server.send_message(message, to_addrs=[self.default_recipient])
            
            logger.info(f"固定宛先にHTMLメールを送信しました: {subject}")
            return {
                "success": True,
                "message": "メールが正常に送信されました",
                "recipients": [self.default_recipient]
            }
            
        except Exception as e:
            logger.error(f"固定宛先HTMLメール送信エラー: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_fixed_pdf_email(self, subject: str, html_content: str) -> Dict[str, Any]:
        """
        固定宛先にPDF添付メールを送信
        
        Args:
            subject: 件名
            html_content: HTML本文
        
        Returns:
            送信結果
        """
        try:
            # メールメッセージの作成
            message = MIMEMultipart()
            message["Subject"] = subject
            message["From"] = self.username
            message["To"] = self.default_recipient
            
            # HTML本文の追加
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # PDFの生成と添付
            pdf_attachment = self._create_pdf_from_html(html_content)
            if pdf_attachment:
                message.attach(pdf_attachment)
            
            # メール送信
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                server.login(self.username, self.password)
                server.send_message(message, to_addrs=[self.default_recipient])
            
            logger.info(f"固定宛先にPDF添付メールを送信しました: {subject}")
            return {
                "success": True,
                "message": "PDF添付メールが正常に送信されました",
                "recipients": [self.default_recipient]
            }
            
        except Exception as e:
            logger.error(f"固定宛先PDF添付メール送信エラー: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_html_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        HTMLメールを送信
        
        Args:
            to_emails: 宛先メールアドレスリスト
            subject: 件名
            html_content: HTML本文
            cc_emails: CC宛先（オプション）
            bcc_emails: BCC宛先（オプション）
        
        Returns:
            送信結果
        """
        try:
            # メールメッセージの作成
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.username
            message["To"] = ", ".join(to_emails)
            
            if cc_emails:
                message["Cc"] = ", ".join(cc_emails)
            
            # HTML本文の追加
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # 全宛先の取得
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            # メール送信
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                server.login(self.username, self.password)
                server.send_message(message, to_addrs=all_recipients)
            
            logger.info(f"HTMLメールを送信しました: {subject}")
            return {
                "success": True,
                "message": "メールが正常に送信されました",
                "recipients": all_recipients
            }
            
        except Exception as e:
            logger.error(f"HTMLメール送信エラー: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_pdf_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        PDF添付メールを送信
        
        Args:
            to_emails: 宛先メールアドレスリスト
            subject: 件名
            html_content: HTML本文
            cc_emails: CC宛先（オプション）
            bcc_emails: BCC宛先（オプション）
        
        Returns:
            送信結果
        """
        try:
            # メールメッセージの作成
            message = MIMEMultipart()
            message["Subject"] = subject
            message["From"] = self.username
            message["To"] = ", ".join(to_emails)
            
            if cc_emails:
                message["Cc"] = ", ".join(cc_emails)
            
            # HTML本文の追加
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # PDFの生成と添付
            pdf_attachment = self._create_pdf_from_html(html_content)
            if pdf_attachment:
                message.attach(pdf_attachment)
            
            # 全宛先の取得
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            # メール送信
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=self.context)
                server.login(self.username, self.password)
                server.send_message(message, to_addrs=all_recipients)
            
            logger.info(f"PDF添付メールを送信しました: {subject}")
            return {
                "success": True,
                "message": "PDF添付メールが正常に送信されました",
                "recipients": all_recipients
            }
            
        except Exception as e:
            logger.error(f"PDF添付メール送信エラー: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_pdf_from_html(self, html_content: str) -> Optional[MIMEBase]:
        """
        HTMLからPDFを生成
        
        Args:
            html_content: HTMLコンテンツ
        
        Returns:
            PDF添付ファイル
        """
        try:
            # 一時ファイルにHTMLを保存
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                f.write(html_content)
                html_file = f.name
            
            # PDFファイルパス
            pdf_file = html_file.replace('.html', '.pdf')
            
            # HTMLからPDFを生成
            HTML(filename=html_file).write_pdf(pdf_file)
            
            # PDFファイルを添付
            with open(pdf_file, "rb") as f:
                attachment = MIMEBase("application", "octet-stream")
                attachment.set_payload(f.read())
            
            encoders.encode_base64(attachment)
            attachment.add_header(
                "Content-Disposition",
                f"attachment; filename= {Path(pdf_file).name}"
            )
            
            # 一時ファイルの削除
            os.unlink(html_file)
            os.unlink(pdf_file)
            
            return attachment
            
        except Exception as e:
            logger.error(f"PDF生成エラー: {str(e)}")
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
