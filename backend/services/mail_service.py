"""
メール送信サービス

開発憲章の「設定とロジックを分離」原則に従い、
設定クラスからSMTP設定を取得
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List
from app.config import get_settings

class MailService:
    def __init__(self):
        # 設定クラスからSMTP設定を取得
        settings = get_settings()
        smtp_config = settings.get_smtp_config()
        
        self.smtp_server = smtp_config['server']
        self.smtp_port = smtp_config['port']
        self.smtp_username = smtp_config['username']
        self.smtp_password = smtp_config['password']
        self.sender_email = smtp_config['sender_email']
        self.sender_name = smtp_config['sender_name']
    
    async def send_html_mail(
        self, 
        recipients: List[str], 
        subject: str, 
        html_content: str,
        attachment_path: str = None,
        attachment_name: str = None
    ) -> bool:
        """
        HTMLメールを送信
        
        Args:
            recipients: 受信者のメールアドレスリスト
            subject: 件名
            html_content: HTMLコンテンツ
            attachment_path: 添付ファイルのパス
            attachment_name: 添付ファイル名
        
        Returns:
            bool: 送信成功の場合True
        """
        try:
            # メッセージを作成
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = ", ".join(recipients)
            msg['Subject'] = subject
            
            # HTMLコンテンツを追加
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # 添付ファイルがある場合は追加
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment_name or "attachment.html"}'
                )
                msg.attach(part)
            
            # SMTPサーバーに接続して送信
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # TLS暗号化を有効化
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.sendmail(self.sender_email, recipients, msg.as_string())
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"メール送信エラー: {e}")
            raise e
    
    async def test_connection(self) -> bool:
        """
        SMTPサーバーへの接続をテスト
        
        Returns:
            bool: 接続成功の場合True
        """
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.quit()
            return True
            
        except Exception as e:
            print(f"SMTP接続エラー: {e}")
            raise e
