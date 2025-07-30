"""
設定モジュール

開発憲章の「設定とロジックを分離」原則に従い、
アプリケーション設定を一元管理するモジュール
"""

from .settings import Settings, get_settings, settings

__all__ = ['Settings', 'get_settings', 'settings'] 