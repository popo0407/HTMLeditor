# 開発環境コマンド

## セットアップ
```bash
# フロントエンド
cd frontend
npm install

# バックエンド
cd backend
pip install -r requirements.txt

# Playwright ブラウザインストール
cd backend
python -m playwright install chromium
```

## 開発サーバー起動
```bash
# バックエンド
cd backend
uvicorn main:app --reload --port 8002

# フロントエンド
cd frontend
npm start
```

## テスト実行
```bash
# フロントエンド
cd frontend
npm test

# バックエンド
cd backend
python -m pytest tests/
```

## 本番デプロイ
```powershell
# パッケージ作成
.\create-deploy-package.ps1

# IISデプロイ
.\deploy-to-iis.ps1
```

## 便利なコマンド
```bash
# Windows用のユーティリティ
dir         # ディレクトリ一覧
cd          # ディレクトリ移動
type        # ファイル内容表示
findstr     # 文字列検索 (grep相当)
```