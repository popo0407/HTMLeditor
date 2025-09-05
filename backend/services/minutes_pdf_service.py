"""Minutes PDF generation service.

Single responsibility: sanitize minutes HTML, normalize meeting info, render Jinja2 template, invoke wkhtmltopdf.
Used by: mail_routes (/mail/send-pdf) and pdf_routes (/pdf/export with minutesHtml).
"""
from __future__ import annotations

import re
from pathlib import Path
import datetime
import os
from typing import Any, Dict
import bleach
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .pdf_service import generate_pdf_from_html


def validate_datetime_format(datetime_str: str) -> bool:
    """
    日時文字列がYYYY-MM-DD hh:mm:ss形式かを検証する
    
    Args:
        datetime_str: 検証する日時文字列
        
    Returns:
        bool: 有効な形式の場合True
    """
    if not datetime_str or not isinstance(datetime_str, str):
        return True  # 空の場合は検証をスキップ
    
    # YYYY-MM-DD hh:mm:ss 形式の正規表現
    pattern = r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
    
    if not re.match(pattern, datetime_str):
        return False
    
    try:
        # 実際にパースして有効な日時かチェック
        datetime.datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
        return True
    except ValueError:
        return False


# Allow class/style so action-item etc. remain, but explicitly exclude style and script tags
_ALLOWED_TAGS = set(bleach.sanitizer.ALLOWED_TAGS).union({
    'h1','h2','h3','h4','h5','p','br','ul','ol','li','table','thead','tbody','tr','th','td','div','span','img'
})
_ALLOWED_TAGS.discard('style')  # Explicitly remove style tag to prevent CSS from appearing in content
_ALLOWED_TAGS.discard('script')  # Explicitly remove script tag for security

def _allowed_attrs():  # dynamic to avoid mutating global constant
    raw_allowed = bleach.sanitizer.ALLOWED_ATTRIBUTES
    if isinstance(raw_allowed, dict):
        allowed = dict(raw_allowed)
        existing = allowed.get('*')
        if existing is None:
            allowed['*'] = ['class', 'style']
        else:
            if not isinstance(existing, (list, tuple)):
                existing = [existing]
            for a in ('class','style'):
                if a not in existing:
                    existing.append(a)
            allowed['*'] = existing
        
        # 画像タグの属性を許可
        allowed['img'] = ['src', 'alt', 'width', 'height', 'class', 'style']
    else:
        allowed = {'*': list(raw_allowed) + ['class','style'], 'img': ['src', 'alt', 'width', 'height', 'class', 'style']}
    return allowed


def normalize_meeting(meeting: Dict[str, Any] | None) -> Dict[str, Any]:
    if not meeting:
        return {}
    
    normalized = {
        'title': meeting.get('title') or meeting.get('会議タイトル') or '',
        'datetime': meeting.get('datetime') or meeting.get('会議日時') or '',
        'location': meeting.get('location') or meeting.get('会議場所') or '',
        'department': meeting.get('department') or meeting.get('部門') or '',
        'bu': meeting.get('bu') or meeting.get('部') or '',
        'ka': meeting.get('ka') or meeting.get('課') or '',
        'job_type': meeting.get('job_type') or meeting.get('職種') or '',
        'participants': meeting.get('participants') or meeting.get('参加者') or [],
        'summary': meeting.get('summary') or meeting.get('要約') or '',
        'review': meeting.get('review') or meeting.get('講評') or '',
        'major_category': meeting.get('major_category') or meeting.get('大分類') or '',
        'middle_category': meeting.get('middle_category') or meeting.get('中分類') or '',
        'minor_category': meeting.get('minor_category') or meeting.get('小分類') or '',
        '機密レベル': meeting.get('機密レベル') or '社外秘'  # 機密レベルフィールドを追加
    }
    
    # 日時形式の検証
    if normalized['datetime'] and not validate_datetime_format(normalized['datetime']):
        raise ValueError(f"会議日時の形式が正しくありません。YYYY-MM-DD hh:mm:ss の形式で入力してください。入力値: {normalized['datetime']}")
    
    return normalized


def render_minutes_html(meeting: Dict[str, Any], minutes_html: str) -> str:
    # templates directory (backend/services/ -> backend/templates/)
    backend_dir = Path(__file__).resolve().parents[1]  # backend/
    templates_dir = backend_dir / 'templates'
    
    if not templates_dir.exists():
        raise FileNotFoundError(f"Templates directory not found: {templates_dir}")
    
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=select_autoescape(['html','xml']))
    
    # 改行処理のカスタムフィルタを追加（\n と /n の両方に対応）
    def process_line_breaks(text):
        if not text:
            return ''
        return str(text).replace('\\n', '<br/>').replace('/n', '<br/>').replace('\n', '<br/>')
    
    env.filters['process_line_breaks'] = process_line_breaks
    
    template = env.get_template('meeting_minutes.html')

    # Load shared PDF CSS (if present) and pass its contents to template
    pdf_css_path = templates_dir / 'pdf.css'
    pdf_css = ''
    try:
        if pdf_css_path.exists():
            pdf_css = pdf_css_path.read_text(encoding='utf-8')
    except Exception:
        pdf_css = ''

    return template.render(
        meeting=meeting,
        minutes_html=minutes_html,
        now=datetime.datetime.utcnow().isoformat(),
        pdf_css=pdf_css
    )


def generate_minutes_pdf(meeting_info: Dict[str, Any] | None, minutes_html_raw: str) -> bytes:
    import logging
    logger = logging.getLogger(__name__)
    
    meeting = normalize_meeting(meeting_info or {})
    logger.info(f"Generate minutes PDF - meeting_info: {meeting_info}")
    logger.info(f"Generate minutes PDF - normalized meeting: {meeting}")
    
    # 機密レベルを取得（デフォルトは「社外秘」）
    confidential_level = meeting.get('機密レベル', '社外秘')
    logger.info(f"Generate minutes PDF - confidential_level: {confidential_level}")
    
    # Remove CSS content and style tags completely
    cleaned_html = minutes_html_raw or ''
    
    # Remove <style> tags and their content
    cleaned_html = re.sub(r'<style[^>]*>.*?</style>', '', cleaned_html, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove <script> tags and their content for security
    cleaned_html = re.sub(r'<script[^>]*>.*?</script>', '', cleaned_html, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove any remaining CSS-like content (standalone CSS rules without HTML tags)
    # This handles cases where CSS is directly in the content without <style> tags
    cleaned_html = re.sub(r'\s*[a-zA-Z-]+\s*{\s*[^}]*}\s*', '', cleaned_html, flags=re.MULTILINE)
    
    # Clean with bleach to ensure only allowed tags and attributes
    safe_minutes_html = bleach.clean(
        cleaned_html,
        tags=_ALLOWED_TAGS,
        attributes=_allowed_attrs(),
        protocols=['http', 'https', 'data'],  # data: プロトコルを許可（base64画像用）
        strip=True
    )
    
    rendered_html = render_minutes_html(meeting, safe_minutes_html)
    return generate_pdf_from_html(rendered_html, confidential_level=confidential_level)
