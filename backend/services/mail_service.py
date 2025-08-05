"""
メール送信サービス

開発憲章の「設定とロジックを分離」原則に従い、
設定ファイルからSMTP設定を取得してメール送信を実行
"""

import smtplib
import logging
from email.mime.text import MIMEText
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
