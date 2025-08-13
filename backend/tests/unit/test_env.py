#!/usr/bin/env python3
"""
環境変数読み込みテストスクリプト
"""

import os
from dotenv import load_dotenv

# ルート直下の.envファイルを読み込み
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

print("=== 環境変数読み込みテスト ===")
print(f"PORT_NO: {os.getenv('PORT_NO')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"CORS_ORIGINS: {os.getenv('CORS_ORIGINS')}")
print(f"REACT_APP_API_BASE_URL: {os.getenv('REACT_APP_API_BASE_URL')}")
print("================================") 