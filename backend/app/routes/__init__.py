"""
ルートパッケージの初期化
"""

from . import address_book_routes
from . import mail_routes
from . import gantt_routes

__all__ = ["address_book_routes", "mail_routes", "gantt_routes"]
