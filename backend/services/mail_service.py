"""
メール送信サービス

開発憲章の「設定とロジックを分離」原則に従い、
設定ファイルからSMTP設定を取得してメール送信を実行
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any


class MailService:
    """
    メール送信サービス
    
    開発憲章の「単一責任の原則」に従い、
    メール送信のみを担当
    """
    
    def __init__(
        self,
        smtp_server: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        sender_email: str,
        sender_name: str
    ):
        """
        メール送信サービスを初期化
        
        Args:
            smtp_server: SMTPサーバーアドレス
            smtp_port: SMTPポート番号
            smtp_username: SMTPユーザー名
            smtp_password: SMTPパスワード
            sender_email: 送信者メールアドレス
            sender_name: 送信者名
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.sender_email = sender_email
        self.sender_name = sender_name
    
    def send_html_email(
        self,
        to_email: str,
        subject: str,
        html_content: str
    ) -> Dict[str, Any]:
        """
        HTMLメールを送信
        
        Args:
            to_email: 宛先メールアドレス
            subject: 件名
            html_content: HTML本文
            
        Returns:
            送信結果の辞書
        """
        try:
            # メールメッセージの作成
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # HTML本文の追加
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # SMTPサーバーに接続して送信
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return {
                'success': True,
                'message': f"メールを {to_email} に送信しました"
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                'success': False,
                'error': 'SMTP認証に失敗しました。ユーザー名とパスワードを確認してください。'
            }
        except smtplib.SMTPRecipientsRefused:
            return {
                'success': False,
                'error': '宛先メールアドレスが拒否されました。'
            }
        except smtplib.SMTPServerDisconnected:
            return {
                'success': False,
                'error': 'SMTPサーバーとの接続が切断されました。'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'メール送信中にエラーが発生しました: {str(e)}'
            }
