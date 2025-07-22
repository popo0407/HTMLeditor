@echo off
echo HTML Editor 開発サーバー起動スクリプト
echo.

echo [1/2] バックエンドサーバーを起動しています...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "python main.py"

echo [2/2] フロントエンドサーバーを起動しています...
cd /d "%~dp0frontend" 
start "Frontend Server" cmd /k "npm start"

echo.
echo 両方のサーバーが起動しました:
echo - バックエンド: http://localhost:8000
echo - フロントエンド: http://localhost:3000
echo.
echo ブラウザでフロントエンドにアクセスしてテストを開始してください。
pause
