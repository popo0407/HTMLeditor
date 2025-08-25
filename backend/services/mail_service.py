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

# weasyprint は Windows / IIS 環境で cairo 依存を満たさず導入失敗しやすいためオプション化
try:  # pragma: no cover - 環境差異による
    from weasyprint import HTML  # type: ignore
    WEASY_AVAILABLE = True
except Exception:  # ImportError だけでなく DLL ロード失敗も握りつぶす
    WEASY_AVAILABLE = False

# フォールバック用 (reportlab は既に requirements に存在)
from reportlab.pdfgen import canvas  # type: ignore
from reportlab.lib.pagesizes import A4  # type: ignore
from reportlab.lib.utils import simpleSplit  # type: ignore

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
            with smtplib.SMTP(self.host, self.port, timeout=20) as server:
                # 初期 EHLO を送信してサーバ機能を確認
                try:
                    server.ehlo()
                except Exception:
                    pass

                # STARTTLS をサポートしていれば有効化（サーバによっては未対応）
                try:
                    if server.has_extn('starttls'):
                        server.starttls(context=self.context)
                        server.ehlo()
                except Exception:
                    # STARTTLS が失敗しても続行を試みる（サーバによっては不要）
                    logger.debug('STARTTLS が利用できませんでした。未使用で続行します。')

                # 認証はパスワードが設定されている場合のみ行う
                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed: {e}")
                        return {"success": False, "error": str(e)}

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
                    logger.debug('STARTTLS が利用できませんでした。未使用で続行します。')

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed: {e}")
                        return {"success": False, "error": str(e)}

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
                    logger.debug('STARTTLS が利用できませんでした。未使用で続行します。')

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed: {e}")
                        return {"success": False, "error": str(e)}

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
                    logger.debug('STARTTLS が利用できませんでした。未使用で続行します。')

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed: {e}")
                        return {"success": False, "error": str(e)}

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
        """HTML から PDF を生成 (weasyprint 優先 / 無ければ簡易テキスト PDF)

        weasyprint が利用可能: レイアウトを維持した PDF
        フォールバック: HTML タグ除去後のテキストを A4 縦で単純出力
        """
        try:
            if WEASY_AVAILABLE:
                with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                    f.write(html_content)
                    html_file = f.name
                pdf_file = html_file.replace('.html', '.pdf')
                try:
                    HTML(filename=html_file).write_pdf(pdf_file)  # type: ignore
                except Exception as we_err:  # weasy が存在しても描画失敗時はフォールバック
                    logger.warning(f"weasyprint PDF 生成失敗 (fallback使用): {we_err}")
                    os.unlink(html_file)
                    return self._fallback_pdf(html_content)

                with open(pdf_file, "rb") as f:
                    attachment = MIMEBase("application", "octet-stream")
                    attachment.set_payload(f.read())
                encoders.encode_base64(attachment)
                attachment.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {Path(pdf_file).name}"
                )
                os.unlink(html_file)
                os.unlink(pdf_file)
                return attachment
            else:
                return self._fallback_pdf(html_content)
        except Exception as e:
            logger.error(f"PDF生成エラー: {e}")
            return None

    def _fallback_pdf(self, html_content: str) -> Optional[MIMEBase]:
        """weasyprint が使えない場合の簡易テキスト PDF 生成"""
        try:
            # タグ除去 (極めて単純) & HTML エンティティ簡易置換
            text = re.sub(r'<[^>]+>', '', html_content)
            text = text.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')

            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
                pdf_path = f.name  # reportlab は直接書き込むので一度閉じる

            c = canvas.Canvas(pdf_path, pagesize=A4)
            width, height = A4
            margin = 40
            max_width = width - margin * 2
            y = height - margin
            font_name = 'Helvetica'
            font_size = 10
            c.setFont(font_name, font_size)

            # 行分割 (reportlab の simpleSplit で横幅に合わせる)
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
        """
        SMTPサーバー接続テスト
        
        Returns:
            接続テスト結果
        """
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
                    # STARTTLS が無くても接続自体は成功している可能性がある
                    logger.debug(f"STARTTLS check failed: {e}")

                if self.username and self.password:
                    try:
                        server.login(self.username, self.password)
                    except Exception as e:
                        logger.error(f"SMTP login failed during test: {e}")
                        return {"success": False, "error": str(e)}

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
