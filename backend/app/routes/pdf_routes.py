"""
PDFファイル出力用のAPIルート

現状: フロントエンドの「PDF形式」ボタンは /pdf/export に HTMLフラグメントを送り、
    ここで PdfExportService.html_to_pdf (独自/二重実装) を用いて PDF を生成している。
課題: メール送信 (/mail/send-pdf) と別テンプレート・別生成ロジックのため、
    meeting_minutes.html の変更 (分類削除, page-break, action-item スタイル) が
    ダウンロード PDF に反映されない。

対応: meetingInfo + minutesHtml が送られてきた場合は mail_routes と同じテンプレート
    (meeting_minutes.html) ＆ generate_pdf_from_html を使用して統一。既存互換として
    legacy な html_content パラメータも引き続き受け付ける。
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io
import re
import urllib.parse

from services.minutes_pdf_service import generate_minutes_pdf, normalize_meeting
from services.pdf_service import generate_pdf_from_html  # 旧互換ルートで直接使用

router = APIRouter(tags=["pdf"])

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
    # 会議タイトルを取得
    meeting_title = meeting_info.get('会議タイトル') or meeting_info.get('title') or '議事録'
    
    # 機密レベルを取得（デフォルトは「社外秘」）
    confidential_level = meeting_info.get('機密レベル') or '社外秘'
    
    # 会議日時を取得してフォーマット
    meeting_datetime = meeting_info.get('会議日時') or meeting_info.get('datetime') or ''
    meeting_date = ''
    
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
        except ValueError:
            # 日付が不正な場合は空文字列
            meeting_date = ''
    
    # ファイル名を構築
    if meeting_date:
        filename = f"【{confidential_level}】_{meeting_date}_{meeting_title}"
    else:
        filename = f"【{confidential_level}】_{meeting_title}"
    
    return sanitize_filename(filename)

def encode_filename_for_header(filename: str) -> str:
    """HTTPヘッダー用にファイル名をエンコード（RFC 6266準拠）"""
    # ASCII文字のみの場合はそのまま
    try:
        filename.encode('ascii')
        return f"attachment; filename=\"{filename}\""
    except UnicodeEncodeError:
        # 日本語など非ASCII文字が含まれる場合はUTF-8エンコード
        encoded = urllib.parse.quote(filename.encode('utf-8'))
        return f"attachment; filename*=UTF-8''{encoded}"


class PdfExportRequest(BaseModel):
    # 旧: 完成済み HTML を渡す
    html_content: Optional[str] = None
    # 新: 会議情報 + 議事録本文 (TinyMCE HTML) を渡す
    meetingInfo: Optional[dict] = None
    minutesHtml: Optional[str] = None
    filename: str = "document"
    title: str = "エクスポートされたドキュメント"


@router.post("/export")
async def export_to_pdf(request: PdfExportRequest):
    """PDFダウンロードエンドポイント (テンプレート統一版)

    優先ロジック:
      1. minutesHtml が提供された場合: meeting_minutes.html テンプレートでレンダリングし generate_pdf_from_html。
      2. それ以外 (互換モード): html_content をそのまま PdfExportService.html_to_pdf。
    """
    try:
        if request.minutesHtml is not None:
            # 会議情報 + 議事録本文 => テンプレートレンダリング
            meeting = normalize_meeting(request.meetingInfo or {})

            # 分類項目はテンプレート側から既に削除済み (meeting_minutes.html)
            # minutesHtml をサニタイズ (mail_routes と同等ポリシー)
            try:
                pdf_bytes = generate_minutes_pdf(meeting, request.minutesHtml or '')
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"PDF生成失敗: {e}")

            # ファイル名を新しい形式で生成（【社外秘】_会議日（YYYY-MM-DD）_会議タイトル）
            pdf_filename = generate_pdf_filename(meeting)

            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": encode_filename_for_header(f"{pdf_filename}.pdf")
                }
            )

        # 互換: 従来の html_content ルート
        if not request.html_content:
            raise HTTPException(status_code=400, detail="minutesHtml もしくは html_content のいずれかが必要です")

        # 旧互換ルート: 受け取った HTML をそのまま wkhtmltopdf ラッパへ渡す
        try:
            # To ensure legacy html_content also uses shared CSS, wrap it in a
            # minimal HTML that inlines backend/templates/pdf.css if present.
            from pathlib import Path
            backend_dir = Path(__file__).resolve().parents[2]  # project root/backend/app/.. -> backend/
            templates_dir = backend_dir / 'templates'
            css_text = ''
            css_path = templates_dir / 'pdf.css'
            try:
                if css_path.exists():
                    css_text = css_path.read_text(encoding='utf-8')
            except Exception:
                css_text = ''

            raw_html = request.html_content or ''
            if css_text:
                wrapped = f"""
<!doctype html>
<html>
<head>
<meta charset=\"utf-8\"> 
<style>
{css_text}
</style>
</head>
<body>
{raw_html}
</body>
</html>
"""
            else:
                wrapped = raw_html

            pdf_data = generate_pdf_from_html(wrapped, confidential_level=request.meeting_info.get('機密レベル', '社外秘') if request.meeting_info else '社外秘')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF生成失敗 (互換ルート): {e}")
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": encode_filename_for_header(f"{request.filename}.pdf")
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))