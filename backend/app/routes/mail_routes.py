"""
メール送信API

開発憲章の「関心の分離」に従い、
メール送信機能のみを担当
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.mail_service import MailService
from app.config.settings import get_settings
from services.minutes_pdf_service import generate_minutes_pdf
from services.word_document_service import WordDocumentService
from app.services.department_service import DepartmentService
import datetime
import re

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

def sanitize_filename(filename: str) -> str:
    """ファイル名に使用できない文字をアンダーバーに置き換える"""
    if not filename:
        return "議事録"
    
    # Windows/Linux/macOSで禁止されている文字を置き換え
    forbidden_chars = r'[<>:"/\\|?*\x00-\x1f]'
    sanitized = re.sub(forbidden_chars, '_', filename)
    
    # 先頭・末尾のドット、スペースを削除
    sanitized = sanitized.strip('. ')
    
    # 空文字列の場合はデフォルト名を返す
    if not sanitized:
        return "議事録"
    
    # 長すぎる場合は切り詰め（拡張子分を考慮して200文字以内）
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    
    return sanitized


def generate_pdf_filename(meeting_info: dict) -> str:
    """会議情報に基づいてPDFファイル名を生成（【機密レベル】_会議日（YYYY-MM-DD）_会議タイトル）"""
    
    # デバッグ用：会議情報をログ出力
    logger.info(f"PDF filename generation - meeting_info: {meeting_info}")
    
    # 会議タイトルを取得
    meeting_title = meeting_info.get('会議タイトル', '議事録')
    logger.info(f"PDF filename generation - meeting_title: {meeting_title}")
    
    # 機密レベルを取得（デフォルトは「社外秘」）
    confidential_level = meeting_info.get('機密レベル', '社外秘')
    logger.info(f"PDF filename generation - confidential_level: {confidential_level}")
    
    # 会議日時を取得してフォーマット
    meeting_datetime = meeting_info.get('会議日時', '')
    meeting_date = ''
    logger.info(f"PDF filename generation - meeting_datetime: {meeting_datetime}")
    
    if meeting_datetime:
        try:
            # 様々な日時フォーマットに対応
            from datetime import datetime
            if ' ' in meeting_datetime:
                # "YYYY-MM-DD HH:MM:SS" または "YYYY-MM-DD HH:MM" 形式
                meeting_date = meeting_datetime.split(' ')[0]
            else:
                # "YYYY-MM-DD" 形式
                meeting_date = meeting_datetime
            
            # 日付の妥当性チェック
            datetime.strptime(meeting_date, '%Y-%m-%d')
            logger.info(f"PDF filename generation - parsed meeting_date: {meeting_date}")
        except ValueError as e:
            # 日付が不正な場合は空文字列
            logger.warning(f"PDF filename generation - invalid date format: {meeting_datetime}, error: {e}")
            meeting_date = ''
    
    # ファイル名を構築
    if meeting_date:
        filename = f"【{confidential_level}】_{meeting_date}_{meeting_title}"
    else:
        filename = f"【{confidential_level}】_{meeting_title}"
    
    logger.info(f"PDF filename generation - final filename before sanitization: {filename}")
    sanitized = sanitize_filename(filename)
    logger.info(f"PDF filename generation - final sanitized filename: {sanitized}")
    
    return sanitized


def generate_source_data_filename(meeting_info: dict, extension: str = 'txt') -> str:
    """会議情報に基づいて元データファイル名を生成（【機密レベル】_会議日（YYYY-MM-DD）_会議タイトル_元データ）"""
    
    # デバッグ用：会議情報をログ出力
    logger.info(f"Source data filename generation - meeting_info: {meeting_info}")
    
    # 会議タイトルを取得
    meeting_title = meeting_info.get('会議タイトル', '議事録')
    logger.info(f"Source data filename generation - meeting_title: {meeting_title}")
    
    # 機密レベルを取得（デフォルトは「社外秘」）
    confidential_level = meeting_info.get('機密レベル', '社外秘')
    logger.info(f"Source data filename generation - confidential_level: {confidential_level}")
    
    # 会議日時を取得してフォーマット
    meeting_datetime = meeting_info.get('会議日時', '')
    meeting_date = ''
    logger.info(f"Source data filename generation - meeting_datetime: {meeting_datetime}")
    
    if meeting_datetime:
        try:
            # 様々な日時フォーマットに対応
            from datetime import datetime
            if ' ' in meeting_datetime:
                # "YYYY-MM-DD HH:MM:SS" または "YYYY-MM-DD HH:MM" 形式
                meeting_date = meeting_datetime.split(' ')[0]
            else:
                # "YYYY-MM-DD" 形式
                meeting_date = meeting_datetime
            
            # 日付の妥当性チェック
            datetime.strptime(meeting_date, '%Y-%m-%d')
            logger.info(f"Source data filename generation - parsed meeting_date: {meeting_date}")
        except ValueError as e:
            # 日付が不正な場合は空文字列
            logger.warning(f"Source data filename generation - invalid date format: {meeting_datetime}, error: {e}")
            meeting_date = ''
    
    # ファイル名を構築
    if meeting_date:
        filename = f"【{confidential_level}】_{meeting_date}_{meeting_title}_元データ"
    else:
        filename = f"【{confidential_level}】_{meeting_title}_元データ"
    
    logger.info(f"Source data filename generation - final filename before sanitization: {filename}")
    sanitized = sanitize_filename(filename)
    logger.info(f"Source data filename generation - final sanitized filename: {sanitized}")
    
    return sanitized

class MailRequest(BaseModel):
    """メール送信リクエスト (旧)"""
    subject: str
    html_content: str
    include_pdf: bool = False


class PdfMailRequest(BaseModel):
    subject: Optional[str] = None
    recipient_email: Optional[str] = None
    meetingInfo: Optional[dict] = None
    minutesHtml: Optional[str] = None
    # 元データ関連のフィールド
    sourceDataText: Optional[str] = None
    sourceDataFile: Optional[dict] = None  # {name: str, content: str (base64), mimeType: str}
    # 元データファイル形式の選択
    sourceDataFormat: Optional[str] = "docx"  # "txt" or "docx"

class MailResponse(BaseModel):
    """メール送信レスポンス"""
    success: bool
    message: str
    message_id: Optional[str] = None

# NOTE: /send endpoint (HTML-attached emails) removed.
# Application uses PDF-attached flow only via /send-pdf.

@router.post("/send-pdf", response_model=MailResponse)
async def send_pdf_email(
    request: PdfMailRequest,
    settings = Depends(get_settings)
):
    """
    固定宛先にPDF添付メールを送信
    
    Args:
        request: メール送信リクエスト
        settings: アプリケーション設定
    
    Returns:
        メール送信結果
    """
    try:
        # validate input (minutesHtml required)
        if not request.minutesHtml:
            raise HTTPException(status_code=400, detail='minutesHtml is required')

        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password=""
        )

        # prepare JSON body for email (only the requested fields)
        # prepare body JSON for email; classification fields removed intentionally
        meeting_data = request.meetingInfo or {}
        
        # 改行を/nに変換するヘルパー関数
        def convert_newlines_to_slash_n(text):
            if not text:
                return ''
            return str(text).replace('\n', '/n').replace('\r\n', '/n')
        
        body_json = {
            "会議タイトル": meeting_data.get('会議タイトル', ''),
            "参加者": meeting_data.get('参加者', []),
            "会議日時": meeting_data.get('会議日時', ''),
            "会議場所": meeting_data.get('会議場所', ''),
            "部": meeting_data.get('部', ''),
            "課": meeting_data.get('課', ''),
            "職種": meeting_data.get('職種', ''),
            "大分類": meeting_data.get('大分類', ''),
            "中分類": meeting_data.get('中分類', ''),
            "小分類": meeting_data.get('小分類', ''),
            "キーワード": meeting_data.get('キーワード', ''),
            "要約": convert_newlines_to_slash_n(meeting_data.get('要約', '')),
            "発行者": meeting_data.get('発行者', ''),
        }

        # PDF 生成 (集中化サービス)
        try:
            pdf_bytes = generate_minutes_pdf(request.meetingInfo or {}, request.minutesHtml or '')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF生成失敗: {e}")

        # subject and recipient
        subject = request.subject or '議事録'
        
        # 部門のメールアドレスを取得して送信先を決定
        recipients = []
        if request.recipient_email:
            # 明示的に受信者が指定されている場合はそれを使用
            recipients = [request.recipient_email]
        else:
            # 部門情報から送信先を決定
            meeting_data = request.meetingInfo or {}
            bu_name = meeting_data.get('部', '')
            ka_name = meeting_data.get('課', '')
            
            if not bu_name or not ka_name:
                raise HTTPException(status_code=400, detail="部門情報（部名・課名）が不完全です")
            
            # 部門のメールアドレスを検索
            department_email = None
            departments = DepartmentService.get_all_departments()
            for dept in departments:
                if dept.bu_name == bu_name and dept.ka_name == ka_name and dept.email_address:
                    department_email = dept.email_address
                    logger.info(f"部門メールアドレスを取得: {department_email} (部門: {bu_name}/{ka_name})")
                    break
            
            if not department_email:
                raise HTTPException(status_code=400, detail=f"部門 {bu_name}/{ka_name} のメールアドレスが登録されていません")
            
            recipients = [department_email]
            logger.info(f"部門メールアドレスに送信: {department_email}")

        # ファイル名を新しい形式で生成（【社外秘】_会議日（YYYY-MM-DD）_会議タイトル）
        pdf_filename = f"{generate_pdf_filename(request.meetingInfo or {})}.pdf"
        
        # デバッグログ
        logger.info(f"Generated PDF filename: {pdf_filename}")

        # 元データファイルの準備
        source_data_attachment = None
        if request.sourceDataFile:
            # アップロードされたファイル
            import base64
            try:
                file_content = base64.b64decode(request.sourceDataFile['content'])
                # 元のファイル名から拡張子を抽出
                original_filename = request.sourceDataFile['name']
                file_extension = original_filename.split('.')[-1] if '.' in original_filename else 'bin'
                source_filename = f"{generate_source_data_filename(request.meetingInfo or {}, file_extension)}.{file_extension}"
                
                # デバッグログ
                logger.info(f"Generated source data filename: {source_filename}")
                source_data_attachment = {
                    'filename': source_filename,
                    'content': file_content,
                    'mime_type': request.sourceDataFile.get('mimeType', 'application/octet-stream')
                }
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"ファイルのデコードに失敗しました: {e}")
        elif request.sourceDataText and request.sourceDataText.strip():
            # テキストデータ
            source_format = request.sourceDataFormat or "docx"  # デフォルトはdocx
            
            if source_format.lower() == "docx":
                # Wordファイルとして生成
                try:
                    word_bytes = WordDocumentService.create_document_from_text(
                        request.sourceDataText, 
                        request.meetingInfo or {}
                    )
                    source_filename = f"{generate_source_data_filename(request.meetingInfo or {}, 'docx')}.docx"
                    source_data_attachment = {
                        'filename': source_filename,
                        'content': word_bytes,
                        'mime_type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    }
                    logger.info(f"Generated source Word filename: {source_filename}")
                    logger.info(f"Word document size: {len(word_bytes)} bytes")
                except Exception as e:
                    logger.error(f"Wordファイル生成エラー: {e}")
                    # フォールバックとしてTXTファイルを作成
                    source_filename = f"{generate_source_data_filename(request.meetingInfo or {}, 'txt')}.txt"
                    text_content = '\ufeff' + request.sourceDataText  # BOM (U+FEFF) を先頭に追加
                    source_data_attachment = {
                        'filename': source_filename,
                        'content': text_content.encode('utf-8'),
                        'mime_type': 'text/plain; charset=utf-8'
                    }
                    logger.warning(f"Wordファイル生成に失敗したため、TXTファイルで送信: {source_filename}")
            else:
                # TXTファイルとして生成（従来通り）
                source_filename = f"{generate_source_data_filename(request.meetingInfo or {}, 'txt')}.txt"
                text_content = '\ufeff' + request.sourceDataText  # BOM (U+FEFF) を先頭に追加
                source_data_attachment = {
                    'filename': source_filename,
                    'content': text_content.encode('utf-8'),
                    'mime_type': 'text/plain; charset=utf-8'
                }
                logger.info(f"Generated source text filename: {source_filename}")
            
            logger.info(f"Source text content length: {len(request.sourceDataText)}")

        # send email: body is pretty JSON
        import json
        body_text = json.dumps(body_json, ensure_ascii=False, indent=2)

        result = mail_service.send_json_with_pdf_and_source_data(
            to_emails=recipients,
            subject=subject,
            body_json_text=body_text,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename,
            source_data_attachment=source_data_attachment
        )

        if result.get("success"):
            return MailResponse(success=True, message="PDF添付メールが正常に送信されました", message_id=result.get("message_id"))
        else:
            raise HTTPException(status_code=500, detail=f"PDFメール送信に失敗しました: {result.get('error')}")
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDFメール送信中にエラーが発生しました: {str(e)}"
        )

@router.get("/test-connection")
async def test_mail_connection(settings = Depends(get_settings)):
    """
    メールサーバー接続テスト
    
    Args:
        settings: アプリケーション設定
    
    Returns:
        接続テスト結果
    """
    try:
        mail_service = MailService(
            host=settings.MAIL_HOST,
            port=settings.MAIL_PORT,
            username=settings.SENDER_EMAIL,
            password=""  # 環境変数から取得
        )
        
        # 接続テスト
        result = mail_service.test_connection()
        
        if result["success"]:
            return {
                "success": True,
                "message": "メールサーバーに正常に接続できました"
            }
        else:
            return {
                "success": False,
                "message": f"メールサーバー接続に失敗しました: {result['error']}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"接続テスト中にエラーが発生しました: {str(e)}"
        }
