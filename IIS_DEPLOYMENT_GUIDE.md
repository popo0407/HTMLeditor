# IIS で HTML エディタシステムを起動する手順

## 📋 システム概要

- **フロントエンド**: React (TypeScript) - 静的ファイル
- **バックエンド**: FastAPI (Python) - Web API
- **データベース**: SQLite (ファイルベース)

## 🔧 事前準備

### 1. IIS の有効化と Python 環境準備

#### IIS 機能の有効化

1. **コントロールパネル** → **プログラムと機能** → **Windows 機能の有効化または無効化**
2. 以下の機能を有効化:
   ```
   ☑ インターネット インフォメーション サービス
     ☑ World Wide Web サービス
       ☑ アプリケーション開発機能
         ☑ CGI
         ☑ ISAPI 拡張
         ☑ ISAPI フィルター
       ☑ 一般的な HTTP 機能 (すべて)
       ☑ セキュリティ (すべて)
     ☑ Web 管理ツール
       ☑ IIS 管理コンソール
   ```

#### Python 環境の確認

```powershell
# Python バージョン確認
python --version

# pip パッケージ確認
cd C:\Users\user\Downloads\HTMLEditer\backend
pip install -r requirements.txt
```

### 2. フロントエンドのビルド

```powershell
# フロントエンドディレクトリに移動
cd C:\Users\user\Downloads\HTMLEditer\frontend

# 依存関係のインストール
npm install

# 本番用ビルド
npm run build
```

## 🌐 IIS 設定手順

### Phase 1: フロントエンド（静的サイト）の設定

#### 1-1. IIS サイトの作成

1. **IIS マネージャー** を起動
2. **サイト** を右クリック → **Web サイトの追加**
3. 設定内容:
   ```
   サイト名: HTMLEditor-Frontend
   物理パス: C:\Users\user\Downloads\HTMLEditer\frontend\build
   ポート: 80 (または利用可能なポート)
   ```

#### 1-2. デフォルトドキュメントの設定

1. 作成したサイトを選択
2. **既定のドキュメント** をダブルクリック
3. `index.html` が最上位にあることを確認

#### 1-3. MIME タイプの設定（必要な場合）

1. **MIME の種類** をダブルクリック
2. 以下のタイプが存在することを確認:
   ```
   .js  → application/javascript
   .css → text/css
   .json → application/json
   ```

### Phase 2: バックエンド（FastAPI）の設定

#### 2-1. Python Web アプリケーション用サイトの作成

1. **サイト** を右クリック → **Web サイトの追加**
2. 設定内容:
   ```
   サイト名: HTMLEditor-Backend
   物理パス: C:\Users\user\Downloads\HTMLEditer\backend
   ポート: 8000
   ```

#### 2-2. CGI モジュールの設定

1. 作成したサイトを選択
2. **ハンドラーマッピング** をダブルクリック
3. **スクリプトマップの追加** をクリック
4. 設定内容:
   ```
   要求パス: *
   実行可能ファイル: C:\Path\To\Python\python.exe C:\Users\user\Downloads\HTMLEditer\backend\main.py
   名前: FastAPI-Handler
   ```

#### 2-3. web.config の作成

バックエンドディレクトリに `web.config` ファイルを作成:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="Python FastAPI"
           path="*"
           verb="*"
           modules="CgiModule"
           scriptProcessor="C:\Path\To\Python\python.exe -u C:\Users\user\Downloads\HTMLEditer\backend\main.py"
           resourceType="Unspecified"
           requireAccess="Script" />
    </handlers>
    <httpErrors>
      <remove statusCode="404" subStatusCode="-1" />
      <error statusCode="404" path="/api/*" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

## ⚙️ 代替案: FastAPI 専用サーバー + IIS リバースプロキシ

### 推奨アプローチ（より安定）

#### 1. FastAPI をサービスとして起動

```powershell
# バックエンドを独立サービスとして起動
cd C:\Users\user\Downloads\HTMLEditer\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

#### 2. IIS でリバースプロキシ設定

**前提条件**: Application Request Routing (ARR) モジュールの追加

1. [Web Platform Installer](https://www.microsoft.com/web/downloads/platform.aspx) をダウンロード
2. **Application Request Routing 3.0** をインストール

**プロキシ設定**:

1. IIS マネージャーでサイトを選択
2. **URL Rewrite** をダブルクリック
3. **規則の追加** → **空の規則**
4. 以下の設定:
   ```
   名前: API Proxy
   パターン: api/(.*)
   アクション タイプ: Rewrite
   Rewrite URL: http://127.0.0.1:8000/api/{R:1}
   ```

#### 3. CORS 設定の調整

`backend/main.py` で CORS 設定を本番用に変更:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://your-domain.com", "http://localhost"],  # 本番ドメインに変更
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔐 セキュリティ設定

### 1. アプリケーションプールの設定

1. **アプリケーション プール** を右クリック → **アプリケーション プールの追加**
2. 設定内容:
   ```
   名前: HTMLEditor-Pool
   .NET CLR バージョン: マネージド コードなし
   マネージド パイプライン モード: 統合
   ```

### 2. 権限設定

```powershell
# バックエンドディレクトリに IIS_IUSRS 権限を付与
icacls "C:\Users\user\Downloads\HTMLEditer\backend" /grant IIS_IUSRS:F
```

### 3. SQLite データベースファイルの権限

```powershell
# データベースファイルとディレクトリに書き込み権限を付与
icacls "C:\Users\user\Downloads\HTMLEditer\backend\*.db" /grant IIS_IUSRS:F
```

## 🚀 Windows サービスとして FastAPI を起動（推奨）

### 1. NSSM (Non-Sucking Service Manager) のインストール

1. [NSSM](https://nssm.cc/download) をダウンロード
2. `nssm.exe` を `C:\Windows\System32` にコピー

### 2. サービスの作成

```powershell
# 管理者権限でコマンドプロンプトを起動
nssm install HTMLEditorAPI

# 設定画面で以下を設定:
# Path: C:\Path\To\Python\python.exe
# Startup directory: C:\Users\user\Downloads\HTMLEditer\backend
# Arguments: -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 3. サービスの開始

```powershell
nssm start HTMLEditorAPI
```

## 📁 最終的なディレクトリ構成

```
C:\inetpub\wwwroot\HTMLEditor\
├── frontend\          # IISサイト1: ポート80
│   ├── build\         # Reactビルド成果物
│   │   ├── index.html
│   │   ├── static\
│   │   └── ...
│   └── web.config     # IIS設定
├── backend\           # IISサイト2: ポート8000 (またはサービス)
│   ├── main.py
│   ├── app\
│   ├── routes\
│   ├── web.config     # IIS設定 (CGI使用時)
│   └── database.db    # SQLite DB
└── logs\              # ログファイル
```

## ✅ 動作確認手順

### 1. フロントエンド確認

```
http://localhost/        # IISで配信されるReactアプリ
```

### 2. バックエンド確認

```
http://localhost:8000/   # FastAPI ヘルスチェック
http://localhost:8000/api/address-books/  # API エンドポイント
```

### 3. 統合確認

1. フロントエンドでブロックを作成
2. アドレス帳機能をテスト
3. メール送信機能をテスト

## 🚨 トラブルシューティング

### よくある問題と解決法

#### 1. Python/FastAPI 関連

```powershell
# Pythonパスの確認
where python

# 依存関係の再インストール
pip install --upgrade -r requirements.txt

# FastAPIの直接起動確認
python main.py
```

#### 2. IIS 関連

```powershell
# IISのリセット
iisreset

# アプリケーションプールのリサイクル
```

#### 3. 権限エラー

```powershell
# IIS_IUSRS権限の再設定
icacls "C:\Users\user\Downloads\HTMLEditer" /grant IIS_IUSRS:F /T
```

## 📝 推奨デプロイメント構成

**本番環境推奨構成**:

1. **IIS**: React フロントエンド (ポート 80/443)
2. **Windows サービス**: FastAPI (内部ポート 8000)
3. **IIS URL Rewrite**: `/api/*` → FastAPI サービスへプロキシ
4. **SSL 証明書**: HTTPS 対応

この構成により、安定性とパフォーマンスが最大化されます。
