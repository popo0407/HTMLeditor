# HTMLエディタシステム移植スクリプト
# 移植元から移植先に必要なファイルのみをコピーします

param(
    [string]$SourcePath = "C:\Users\user\Downloads\HTMLEditer",
    [string]$DestinationPath = "D:\HTMLEditor",
    [switch]$SkipNodeModules = $true,
    [switch]$SkipVenv = $true
)

Write-Host "HTMLエディタシステム移植開始..." -ForegroundColor Green

# 除外パターンの設定
$excludePatterns = @()
if ($SkipNodeModules) { $excludePatterns += "node_modules" }
if ($SkipVenv) { $excludePatterns += ".venv", "__pycache__" }
$excludePatterns += "build", "*.db", ".env", ".git"

# ディレクトリ作成
if (!(Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Path $DestinationPath -Force
}

# ファイルコピー（除外パターンを適用）
Write-Host "ファイルをコピー中..." -ForegroundColor Yellow
robocopy $SourcePath $DestinationPath /E /XD $excludePatterns /XF "*.db" ".env"

Write-Host "移植完了！移植先で環境構築を行ってください。" -ForegroundColor Green
