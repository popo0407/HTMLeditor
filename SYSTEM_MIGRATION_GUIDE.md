# システム移植ガイド

## 📋 移植対象ファイル・フォルダ

### ✅ 移植が必要なファイル・フォルダ

```
HTMLEditor/
├── 📁 backend/
│   ├── 📄 main.py                    # メインアプリケーション
│   ├── 📄 requirements.txt           # Python依存関係
│   ├── 📄 .env.example              # 環境設定例
│   ├── 📁 app/                      # アプリケーション本体
│   ├── 📁 routes/                   # API ルート
│   ├── 📁 services/                 # ビジネスロジック
│   └── 📄 web.config.sample         # IIS設定例
├── 📁 frontend/
│   ├── 📄 package.json              # Node.js依存関係
│   ├── 📄 package-lock.json         # 依存関係ロック
│   ├── 📄 tsconfig.json             # TypeScript設定
│   ├── 📁 src/                      # ソースコード
│   ├── 📁 public/                   # 静的ファイル
│   └── 📄 web.config.sample         # IIS設定例
├── 📄 AI_PROMPT_GUIDE.md            # AI議事録作成ガイド
├── 📄 TEAMS_MAIL_SETUP.md           # Teams設定ガイド
├── 📄 IIS_DEPLOYMENT_GUIDE.md       # IISデプロイガイド
├── 📄 TESTING_GUIDE.md              # テストガイド
├── 📄 deploy-to-iis.ps1             # 自動デプロイスクリプト
├── 📄 要件定義.md                    # 設計ドキュメント
├── 📄 実装計画.md
├── 📄 実装方針.md
└── 📄 cursor.md
```

### ❌ 移植不要なファイル・フォルダ（移植先で再構築）

```
❌ .venv/                    # Python仮想環境
❌ .vscode/                  # VSCode設定
❌ frontend/node_modules/    # Node.js依存関係
❌ frontend/build/           # ビルド成果物
❌ backend/__pycache__/      # Pythonキャッシュ
❌ backend/*.db             # SQLiteデータベース（開発用）
❌ backend/.env             # 環境設定（機密情報）
❌ .git/                    # Git履歴（必要に応じて）
```

## 🚀 移植手順

### 1. ソースコードのコピー

#### 圧縮ファイルでの移植

```powershell
# 方法1: 必要なファイルのみを一時フォルダにコピーしてから圧縮
$source = "C:\Users\user\Downloads\HTMLEditer"
$tempDir = "C:\Users\user\Downloads\HTMLEditor_temp"
$destination = "C:\Users\user\Downloads\DATAZIP_summary.zip"

# 一時ディレクトリ作成
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force

# 除外パターン
$excludePatterns = @('.venv', '.vscode', 'node_modules', 'build', '__pycache__', '*.db', '.env', '.git')

# robocopyで除外しながらコピー
robocopy $source $tempDir /E /XD .venv .vscode node_modules build __pycache__ .git /XF *.db .env

# 圧縮
Compress-Archive -Path "$tempDir\*" -DestinationPath $destination -Force

# 一時ディレクトリ削除
Remove-Item $tempDir -Recurse -Force

Write-Host "圧縮完了: $destination" -ForegroundColor Green
```

### 2. 移植先での環境構築

#### Python 環境の構築

```powershell
# 移植先ディレクトリに移動
cd D:\NewLocation\HTMLEditor\backend

# 仮想環境作成
python -m venv .venv

# 仮想環境有効化
.venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

#### Node.js 環境の構築

```powershell
# フロントエンドディレクトリに移動
cd D:\NewLocation\HTMLEditor\frontend

# 依存関係インストール
npm install

# 開発用ビルド確認
npm run build
```

### 3. 環境設定ファイルの作成

#### バックエンド環境設定

```powershell
# .env ファイルを作成
cd backend
copy .env.example .env

# .env ファイルを編集して実際の設定値を入力
notepad .env
```

#### 必要な環境変数の設定例

```bash
# .env ファイルの内容例
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@company.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@company.com
SENDER_NAME=議事録システム
```

### 4. データベースの初期化

#### SQLite データベースの作成

```powershell
cd backend

# アプリケーション起動（初回はDB自動作成）
python main.py
```

#### データベースが作成されることを確認

```powershell
# database.db ファイルが生成されることを確認
dir *.db
```

## 🔧 移植用スクリプト

### 自動移植スクリプト (migrate-system.ps1)

```powershell
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
```

### スクリプトの実行方法

```powershell
# 基本実行（デフォルトパス使用）
.\migrate-system.ps1

# カスタムパス指定
.\migrate-system.ps1 -SourcePath "C:\MyProject" -DestinationPath "E:\NewProject"

# 実行後は「2. 移植先での環境構築」セクションに従って環境を構築してください
```

## ✅ 移植後の動作確認

### 1. バックエンド動作確認

```powershell
cd backend
.venv\Scripts\activate
python main.py

# ブラウザで確認
# http://localhost:8000
```

### 2. フロントエンド動作確認

```powershell
cd frontend
npm start

# ブラウザで確認
# http://localhost:3000
```

### 3. 統合テスト

```powershell
# フロントエンドでテスト
# 1. ブロック作成・編集
# 2. クリップボード読み込み
# 3. HTML保存
# 4. メール送信（設定済みの場合）
```

## 🚨 移植時の注意点

### 1. パス区切り文字の違い

- Windows: `\` (バックスラッシュ)
- Linux/Mac: `/` (スラッシュ)
- Python/Node.js は自動対応するが、設定ファイルで注意

### 2. 権限設定

```powershell
# Windows IIS環境での権限設定例
icacls "D:\HTMLEditor" /grant IIS_IUSRS:F /T
```

### 3. ポート番号の競合

- バックエンド: 8000 番ポート
- フロントエンド: 3000 番ポート
- 必要に応じて `main.py` や `package.json` で変更

### 4. 環境変数の再設定

- `.env` ファイルの再作成
- メール設定の確認
- データベースパスの確認

## 📋 移植チェックリスト

### 事前準備

- [ ] Python 3.11 以降がインストール済み
- [ ] Node.js 18 以降がインストール済み
- [ ] 移植先のディスク容量確認

### ファイル移植

- [ ] ソースコードのコピー完了
- [ ] 不要ファイルの除外確認
- [ ] 権限設定の適用

### 環境構築

- [ ] Python 仮想環境の作成
- [ ] Python 依存関係のインストール
- [ ] Node.js 依存関係のインストール
- [ ] 環境設定ファイルの作成

### 動作確認

- [ ] バックエンドの起動確認
- [ ] フロントエンドの起動確認
- [ ] API 通信の確認
- [ ] メール送信機能の確認（設定済みの場合）

この手順により、システムを新しい環境に安全かつ効率的に移植できます！
