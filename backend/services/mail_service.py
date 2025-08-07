"""
メール送信サービス

開発憲章の「設定とロジックを分離」原則に従い、
設定ファイルからSMTP設定を取得してメール送信を実行
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Dict, Any


class MailService:
    """
    メール送信サービス
    
    開発憲章の「単一責任の原則」に従い、
    メール送信のみを担当
    """
    
    def __init__(
        self,
        mail_from: str,
        mail_host: str,
        mail_port: int
    ):
        """
        メール送信サービスを初期化
        
        Args:
            mail_from: 送信者メールアドレス
            mail_host: SMTPサーバーアドレス
            mail_port: SMTPポート番号
        """
        self.mail_from = mail_from
        self.mail_host = mail_host
        self.mail_port = mail_port
    
    def send_notification_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> Dict[str, Any]:
        """
        通知メールを送信（参考関数に基づく）
        
        Args:
            to_email: 宛先メールアドレス
            subject: 件名
            body: 本文
            
        Returns:
            送信結果の辞書
        """
        try:
            # メールメッセージの作成
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = self.mail_from
            msg["To"] = to_email

            # SMTPサーバーに接続して送信
            with smtplib.SMTP(self.mail_host, self.mail_port) as server:
                server.sendmail(self.mail_from, to_email, msg.as_string())
                logging.info("Notification email sent successfully")
            
            return {
                'success': True,
                'message': f"メールを {to_email} に送信しました"
            }
            
        except Exception as e:
            logging.error(f"Failed to send notification email: {str(e)}")
            return {
                'success': False,
                'error': f'メール送信中にエラーが発生しました: {str(e)}'
            }

    def send_html_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_content: str,
        filename: str = "minutes.html"
    ) -> Dict[str, Any]:
        """
        HTML添付メールを送信
        
        Args:
            to_email: 宛先メールアドレス
            subject: 件名
            body: 本文
            html_content: HTMLコンテンツ
            filename: 添付ファイル名
            
        Returns:
            送信結果の辞書
        """
        try:
            # マルチパートメッセージの作成
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = self.mail_from
            msg["To"] = to_email

            # 本文を追加
            text_part = MIMEText(body, "plain", "utf-8")
            msg.attach(text_part)

            # HTML添付ファイルを追加
            html_part = MIMEBase('text', 'html')
            html_part.set_payload(html_content.encode('utf-8'))
            encoders.encode_base64(html_part)
            html_part.add_header(
                'Content-Disposition',
                f'attachment; filename= {filename}'
            )
            msg.attach(html_part)

            # SMTPサーバーに接続して送信
            with smtplib.SMTP(self.mail_host, self.mail_port) as server:
                server.sendmail(self.mail_from, to_email, msg.as_string())
                logging.info("HTML email sent successfully")
            
            return {
                'success': True,
                'message': f"HTML添付メールを {to_email} に送信しました"
            }
            
        except Exception as e:
            logging.error(f"Failed to send HTML email: {str(e)}")
            return {
                'success': False,
                'error': f'HTMLメール送信中にエラーが発生しました: {str(e)}'
            }

    def send_pdf_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        pdf_content: bytes,
        filename: str = "minutes.pdf"
    ) -> Dict[str, Any]:
        """
        PDF添付メールを送信
        
        Args:
            to_email: 宛先メールアドレス
            subject: 件名
            body: 本文
            pdf_content: PDFファイルのバイトデータ
            filename: 添付ファイル名
            
        Returns:
            送信結果の辞書
        """
        try:
            # マルチパートメッセージの作成
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = self.mail_from
            msg["To"] = to_email

            # 本文を追加
            text_part = MIMEText(body, "plain", "utf-8")
            msg.attach(text_part)

            # PDF添付ファイルを追加
            pdf_part = MIMEBase('application', 'pdf')
            pdf_part.set_payload(pdf_content)
            encoders.encode_base64(pdf_part)
            pdf_part.add_header(
                'Content-Disposition',
                f'attachment; filename= {filename}'
            )
            msg.attach(pdf_part)

            # SMTPサーバーに接続して送信
            with smtplib.SMTP(self.mail_host, self.mail_port) as server:
                server.sendmail(self.mail_from, to_email, msg.as_string())
                logging.info("PDF email sent successfully")
            
            return {
                'success': True,
                'message': f"PDF添付メールを {to_email} に送信しました"
            }
            
        except Exception as e:
            logging.error(f"Failed to send PDF email: {str(e)}")
            return {
                'success': False,
                'error': f'PDFメール送信中にエラーが発生しました: {str(e)}'
            }

    def send_html_and_pdf_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_content: str,
        pdf_content: bytes,
        html_filename: str = "minutes.html",
        pdf_filename: str = "minutes.pdf"
    ) -> Dict[str, Any]:
        """
        HTMLとPDFの両方を添付したメールを送信
        
        Args:
            to_email: 宛先メールアドレス
            subject: 件名
            body: 本文
            html_content: HTMLコンテンツ
            pdf_content: PDFファイルのバイトデータ
            html_filename: HTML添付ファイル名
            pdf_filename: PDF添付ファイル名
            
        Returns:
            送信結果の辞書
        """
        try:
            # マルチパートメッセージの作成
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = self.mail_from
            msg["To"] = to_email

            # 本文を追加
            text_part = MIMEText(body, "plain", "utf-8")
            msg.attach(text_part)

            # HTML添付ファイルを追加
            html_part = MIMEBase('text', 'html')
            html_part.set_payload(html_content.encode('utf-8'))
            encoders.encode_base64(html_part)
            html_part.add_header(
                'Content-Disposition',
                f'attachment; filename= {html_filename}'
            )
            msg.attach(html_part)

            # PDF添付ファイルを追加
            pdf_part = MIMEBase('application', 'pdf')
            pdf_part.set_payload(pdf_content)
            encoders.encode_base64(pdf_part)
            pdf_part.add_header(
                'Content-Disposition',
                f'attachment; filename= {pdf_filename}'
            )
            msg.attach(pdf_part)

            # SMTPサーバーに接続して送信
            with smtplib.SMTP(self.mail_host, self.mail_port) as server:
                server.sendmail(self.mail_from, to_email, msg.as_string())
                logging.info("HTML and PDF email sent successfully")
            
            return {
                'success': True,
                'message': f"HTMLとPDF添付メールを {to_email} に送信しました"
            }
            
        except Exception as e:
            logging.error(f"Failed to send HTML and PDF email: {str(e)}")
            return {
                'success': False,
                'error': f'HTMLとPDFメール送信中にエラーが発生しました: {str(e)}'
            }
