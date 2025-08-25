"""Minutes PDF generation service.

Single responsibility: sanitize minutes HTML, normalize meeting info, render Jinja2 template, invoke wkhtmltopdf.
Used by: mail_routes (/mail/send-pdf) and pdf_routes (/pdf/export with minutesHtml).
"""
from __future__ import annotations

from pathlib import Path
import datetime
import os
from typing import Any, Dict
import bleach
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .pdf_service import generate_pdf_from_html


# Allow class/style so action-item etc. remain
_ALLOWED_TAGS = set(bleach.sanitizer.ALLOWED_TAGS).union({
    'h1','h2','h3','h4','h5','p','br','ul','ol','li','table','thead','tbody','tr','th','td','div','span'
})

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
    else:
        allowed = {'*': list(raw_allowed) + ['class','style']}
    return allowed


def normalize_meeting(meeting: Dict[str, Any] | None) -> Dict[str, Any]:
    if not meeting:
        return {}
    return {
        'title': meeting.get('title') or meeting.get('会議タイトル') or '',
        'datetime': meeting.get('datetime') or meeting.get('会議日時') or '',
        'location': meeting.get('location') or meeting.get('会議場所') or '',
        'department': meeting.get('department') or meeting.get('部門') or '',
        'participants': meeting.get('participants') or meeting.get('参加者') or [],
        'summary': meeting.get('summary') or meeting.get('要約') or ''
    }


def render_minutes_html(meeting: Dict[str, Any], minutes_html: str) -> str:
    # templates directory (backend/services/ -> backend/templates/)
    backend_dir = Path(__file__).resolve().parents[1]  # backend/
    templates_dir = backend_dir / 'templates'
    
    if not templates_dir.exists():
        raise FileNotFoundError(f"Templates directory not found: {templates_dir}")
    
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=select_autoescape(['html','xml']))
    template = env.get_template('meeting_minutes.html')
    return template.render(
        meeting=meeting,
        minutes_html=minutes_html,
        now=datetime.datetime.utcnow().isoformat()
    )


def generate_minutes_pdf(meeting_info: Dict[str, Any] | None, minutes_html_raw: str) -> bytes:
    meeting = normalize_meeting(meeting_info or {})
    safe_minutes_html = bleach.clean(
        minutes_html_raw or '',
        tags=_ALLOWED_TAGS,
        attributes=_allowed_attrs(),
        strip=True
    )
    rendered_html = render_minutes_html(meeting, safe_minutes_html)
    return generate_pdf_from_html(rendered_html)
