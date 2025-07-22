"""
モデルパッケージの初期化

明示的なインポートでモジュール間の依存関係を明確化
"""

from .database import Base, get_db, engine
from .address_book import CommonID, Contact
from . import schemas

__all__ = [
    "Base",
    "get_db", 
    "engine",
    "CommonID",
    "Contact",
    "schemas"
]
