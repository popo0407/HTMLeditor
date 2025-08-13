@echo off
echo Starting simple HTTP server for test files...
echo Test pages will be available at:
echo   http://localhost:8080/test_login.html
echo   http://localhost:8080/test_page1.html
echo   http://localhost:8080/test_page2.html
echo.
echo Press Ctrl+C to stop the server
cd /d "%~dp0\static"
python -m http.server 8080
