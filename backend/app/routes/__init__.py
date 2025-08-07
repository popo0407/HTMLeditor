"""
ルートモジュールの初期化

開発憲章の「関心の分離」に従い、
APIルートを機能別に分割して管理
"""

from . import mail_routes, pdf_routes

__all__ = ["mail_routes", "pdf_routes"]
