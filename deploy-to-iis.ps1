# HTMLエディタ IIS デプロイメント自動化スクリプト
# 管理者権限で実行してください

param(
    [string]$SiteName = "HTMLEditor",
    [string]$FrontendPort = "80",
    [string]$BackendPort = "8000",
    [string]$DeployPath = "C:\inetpub\wwwroot\HTMLEditor"
)

# カラー出力用関数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "=========================================="
Write-ColorOutput Green "HTMLエディタ IIS デプロイメント開始"
Write-ColorOutput Green "=========================================="

# 1. 管理者権限チェック
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-ColorOutput Red "このスクリプトは管理者権限で実行してください。"
    Read-Host "Enterキーを押して終了..."
    exit 1
}

# 2. 必要なモジュールの確認とインストール
Write-ColorOutput Yellow "ステップ 1: 必要なモジュールの確認..."

# IIS管理モジュールの確認
if (!(Get-Module -ListAvailable -Name WebAdministration)) {
    Write-ColorOutput Red "IIS管理モジュールが見つかりません。IISの機能を有効化してください。"
    exit 1
}

Import-Module WebAdministration

# 3. ソースディレクトリの確認
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendSource = Join-Path $SourceDir "frontend"
$BackendSource = Join-Path $SourceDir "backend"

if (!(Test-Path $FrontendSource) -or !(Test-Path $BackendSource)) {
    Write-ColorOutput Red "ソースディレクトリが見つかりません: $SourceDir"
    exit 1
}

Write-ColorOutput Green "ソースディレクトリ: $SourceDir"

# 4. デプロイディレクトリの作成
Write-ColorOutput Yellow "ステップ 2: デプロイディレクトリの作成..."

if (!(Test-Path $DeployPath)) {
    New-Item -ItemType Directory -Path $DeployPath -Force
    Write-ColorOutput Green "デプロイディレクトリを作成しました: $DeployPath"
}

$FrontendDeploy = Join-Path $DeployPath "frontend"
$BackendDeploy = Join-Path $DeployPath "backend"

# 5. フロントエンドのビルドとデプロイ
Write-ColorOutput Yellow "ステップ 3: フロントエンドのビルド..."

Set-Location $FrontendSource

# Node.js/npmの確認
try {
    $npmVersion = npm --version
    Write-ColorOutput Green "npm バージョン: $npmVersion"
} catch {
    Write-ColorOutput Red "npmが見つかりません。Node.jsをインストールしてください。"
    exit 1
}

# 依存関係のインストール
Write-ColorOutput Yellow "依存関係をインストール中..."
npm install

# プロダクションビルド
Write-ColorOutput Yellow "プロダクションビルドを実行中..."
npm run build

# ビルド成果物のコピー
Write-ColorOutput Yellow "ビルド成果物をコピー中..."
if (Test-Path $FrontendDeploy) {
    Remove-Item $FrontendDeploy -Recurse -Force
}
Copy-Item -Path "build" -Destination $FrontendDeploy -Recurse

# web.configのコピー
Copy-Item -Path "web.config.sample" -Destination (Join-Path $FrontendDeploy "web.config") -ErrorAction SilentlyContinue

Write-ColorOutput Green "フロントエンドのデプロイが完了しました。"

# 6. バックエンドのデプロイ
Write-ColorOutput Yellow "ステップ 4: バックエンドのデプロイ..."

Set-Location $BackendSource

# Pythonの確認
try {
    $pythonVersion = python --version
    Write-ColorOutput Green "Python バージョン: $pythonVersion"
} catch {
    Write-ColorOutput Red "Pythonが見つかりません。Pythonをインストールしてください。"
    exit 1
}

# バックエンドファイルのコピー
if (Test-Path $BackendDeploy) {
    Remove-Item $BackendDeploy -Recurse -Force
}
Copy-Item -Path $BackendSource -Destination $BackendDeploy -Recurse

# 依存関係のインストール
Set-Location $BackendDeploy
Write-ColorOutput Yellow "Python依存関係をインストール中..."
pip install -r requirements.txt

Write-ColorOutput Green "バックエンドのデプロイが完了しました。"

# 7. IISサイトの作成
Write-ColorOutput Yellow "ステップ 5: IISサイトの作成..."

# 既存サイトの削除（存在する場合）
$existingSite = Get-Website -Name "$SiteName-Frontend" -ErrorAction SilentlyContinue
if ($existingSite) {
    Remove-Website -Name "$SiteName-Frontend"
    Write-ColorOutput Yellow "既存のフロントエンドサイトを削除しました。"
}

$existingBackendSite = Get-Website -Name "$SiteName-Backend" -ErrorAction SilentlyContinue
if ($existingBackendSite) {
    Remove-Website -Name "$SiteName-Backend"
    Write-ColorOutput Yellow "既存のバックエンドサイトを削除しました。"
}

# フロントエンドサイトの作成
New-Website -Name "$SiteName-Frontend" -Port $FrontendPort -PhysicalPath $FrontendDeploy
Write-ColorOutput Green "フロントエンドサイトを作成しました: http://localhost:$FrontendPort"

# バックエンドサイトの作成（CGI使用時）
# New-Website -Name "$SiteName-Backend" -Port $BackendPort -PhysicalPath $BackendDeploy
# Write-ColorOutput Green "バックエンドサイトを作成しました: http://localhost:$BackendPort"

# 8. アプリケーションプールの設定
Write-ColorOutput Yellow "ステップ 6: アプリケーションプールの設定..."

$poolName = "$SiteName-Pool"
$existingPool = Get-IISAppPool -Name $poolName -ErrorAction SilentlyContinue
if ($existingPool) {
    Remove-WebAppPool -Name $poolName
}

New-WebAppPool -Name $poolName
Set-ItemProperty -Path "IIS:\AppPools\$poolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty -Path "IIS:\AppPools\$poolName" -Name "enable32BitAppOnWin64" -Value $false

# フロントエンドサイトにアプリケーションプールを設定
Set-ItemProperty -Path "IIS:\Sites\$SiteName-Frontend" -Name "applicationPool" -Value $poolName

Write-ColorOutput Green "アプリケーションプールを設定しました: $poolName"

# 9. 権限設定
Write-ColorOutput Yellow "ステップ 7: ファイル権限の設定..."

# IIS_IUSRS に読み取り権限を付与
icacls $FrontendDeploy /grant "IIS_IUSRS:(OI)(CI)R" /T
icacls $BackendDeploy /grant "IIS_IUSRS:(OI)(CI)F" /T

Write-ColorOutput Green "ファイル権限を設定しました。"

# 10. Windowsサービスとしてバックエンドを起動（推奨）
Write-ColorOutput Yellow "ステップ 8: バックエンドサービスの設定..."

$serviceName = "HTMLEditorAPI"
$serviceDisplayName = "HTML Editor API Service"
$serviceDescription = "FastAPI backend for HTML Editor"

# 既存サービスの停止・削除
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName
    Start-Sleep 2
}

# NSSMを使用してサービス作成（NSSMがインストールされている場合）
$nssmPath = "nssm.exe"
try {
    $nssmVersion = & $nssmPath --version 2>$null
    
    # NSSMでサービス作成
    $pythonPath = (Get-Command python).Source
    $startupDir = $BackendDeploy
    $arguments = "-m uvicorn main:app --host 127.0.0.1 --port $BackendPort"
    
    & $nssmPath install $serviceName $pythonPath $arguments
    & $nssmPath set $serviceName AppDirectory $startupDir
    & $nssmPath set $serviceName DisplayName $serviceDisplayName
    & $nssmPath set $serviceName Description $serviceDescription
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    
    # サービス開始
    Start-Service -Name $serviceName
    Write-ColorOutput Green "バックエンドサービスを作成・開始しました: $serviceName"
    
} catch {
    Write-ColorOutput Yellow "NSSM が見つかりません。手動でバックエンドを起動してください:"
    Write-ColorOutput Yellow "cd $BackendDeploy"
    Write-ColorOutput Yellow "python -m uvicorn main:app --host 127.0.0.1 --port $BackendPort"
}

# 11. 最終確認とテスト
Write-ColorOutput Yellow "ステップ 9: デプロイメント完了..."

Write-ColorOutput Green "=========================================="
Write-ColorOutput Green "デプロイメントが完了しました！"
Write-ColorOutput Green "=========================================="
Write-ColorOutput White "フロントエンド URL: http://localhost:$FrontendPort"
Write-ColorOutput White "バックエンド URL: http://localhost:$BackendPort"
Write-ColorOutput White ""
Write-ColorOutput White "デプロイメント場所:"
Write-ColorOutput White "  フロントエンド: $FrontendDeploy"
Write-ColorOutput White "  バックエンド: $BackendDeploy"
Write-ColorOutput White ""

# 動作確認
Write-ColorOutput Yellow "動作確認を実行中..."

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:$FrontendPort" -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-ColorOutput Green "✓ フロントエンドが正常に応答しています"
    }
} catch {
    Write-ColorOutput Red "✗ フロントエンドの応答確認に失敗しました"
}

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:$BackendPort" -UseBasicParsing -TimeoutSec 10
    if ($backendResponse.StatusCode -eq 200) {
        Write-ColorOutput Green "✓ バックエンドが正常に応答しています"
    }
} catch {
    Write-ColorOutput Red "✗ バックエンドの応答確認に失敗しました"
    Write-ColorOutput Yellow "バックエンドを手動で起動してください:"
    Write-ColorOutput Yellow "cd $BackendDeploy && python -m uvicorn main:app --host 127.0.0.1 --port $BackendPort"
}

Write-ColorOutput Green "=========================================="
Write-ColorOutput Green "デプロイメントスクリプトが正常に完了しました"
Write-ColorOutput Green "=========================================="

Read-Host "Enterキーを押して終了..."
