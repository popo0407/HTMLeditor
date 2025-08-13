# HTML Editor

React + TypeScript + FastAPI で構築されたモダンなブロックベース HTML エディタ

## 🚀 特徴

- **リッチテキストエディタ**: TinyMCE ベースの直感的なリッチテキストエディタ
- **HTML エクスポート**: 作成した文書を HTML ファイルとして保存
- **Web スクレイピング機能**: 指定 URL からのデータ自動取得とクリップボード連携
- **本番環境対応**: IIS での運用とチーム共有機能

## 🛠 技術スタック

### フロントエンド

- React 18
- TypeScript 4.9.5
- CSS3 (Snowsight 風デザイン)
- TinyMCE ベースリッチテキストエディタ
- カスタムブロックエディタ
- カレンダー機能

### バックエンド

- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- SQLite
- Pydantic 2.10.1+
- Playwright 1.40.0 (Web スクレイピング)
- Plotly 5.17.0 (ガントチャート生成)
- Pandas 2.1.4 (データ処理)
- 3-Tier アーキテクチャ

### 開発・運用

- Python 3.8+
- Node.js 16+
- IIS (本番環境)
- NSSM (Windows サービス化)

## 📦 セットアップ

### 前提条件

- Node.js 16 以上
- Python 3.8 以上
- npm または yarn

### 開発環境セットアップ

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd HTMLEditer
   ```

2. **フロントエンドのセットアップ**

   ```bash
   cd frontend
   npm install
   ```

3. **バックエンドのセットアップ**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Playwright ブラウザのインストール**

   ```bash
   # Windowsの場合
   install-browsers.bat

   # または手動で
   cd backend
   python -m playwright install chromium
   ```

5. **環境変数の設定**

   ```bash
   # backend/.env ファイルを作成
   cp backend/.env.example backend/.env
   # 必要に応じて設定を編集
   ```

6. **開発サーバーの起動**

   バックエンド:

   ```bash
   cd backend
   uvicorn main:app --reload --port 8002
   ```

   フロントエンド:

   ```bash
   cd frontend
   npm start
   ```

7. **アプリケーションへのアクセス**
   - フロントエンド: http://localhost:3000
   - バックエンド API: http://localhost:8002

### 本番環境セットアップ

詳細な本番環境構築手順は `CORS_SETUP_GUIDE.md` を参照してください。

#### クイックデプロイ

```powershell
# 開発PCでパッケージ作成
.\create-deploy-package.ps1

# 本番サーバーでデプロイ
.\deploy-to-iis.ps1
```

## 📝 使用方法

### 基本操作

#### リッチテキストエディタ

1. **テキスト編集**: 直接テキストを入力・編集
2. **見出し設定**: ツールバーで見出しレベルを切り替え
3. **強調設定**: ツールバーで強調スタイルを切り替え
4. **HTML 出力**: HTML ダウンロード

### Web スクレイピング機能

- **自動ログイン**: フォーム認証による自動ログイン機能
- **並列データ取得**: 最大 2 つの URL から同時にデータを取得
- **ブックマークレット互換**: 既存のブックマークレットロジックをサーバーサイドで実行
- **クリップボード連携**: 取得したデータを自動的にクリップボードにコピー
- **セキュアな認証情報管理**: 処理完了後の認証情報自動削除
- **2 つのスクレイピングモード**:
  - チャットエントリーモード（発言者、タイムスタンプ、メッセージ内容を抽出）
  - タイトル・日付・参加者モード（指定クラスの要素を抽出）

### メール機能

- **HTML メール送信**: 作成した文書をメールで送信
- **ファイル添付**: HTML ファイルの自動添付
- **複数宛先対応**: 直接メールアドレス指定

## 🧪 テスト

### フロントエンドテスト

```bash
cd frontend
npm test
```

### バックエンドテスト

```bash
cd backend
python -m pytest tests/
```

### テスト用サーバー起動

```bash
cd backend/tests
./start-test-server.bat
```

詳細なテスト手順は `TESTING_GUIDE.md` を参照してください。

## 📋 プロジェクト構造

```
HTMLEditer/
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── config/             # 設定管理
│   │   ├── models/             # データベースモデル
│   │   ├── repositories/       # データアクセス層
│   │   ├── routes/             # API層
│   │   │   ├── mail_routes.py
│   │   │   ├── pdf_routes.py
│   │   │   └── scraping_routes.py
│   │   └── services/           # ビジネスロジック層
│   │       ├── browser_service.py
│   │       ├── pdfExportService.py
│   │       └── scraping_service.py
│   ├── services/               # 外部サービス
│   │   └── mail_service.py
│   ├── tests/                  # テストコード
│   │   ├── unit/               # 単体テスト
│   │   ├── integration/        # 統合テスト
│   │   ├── utils/              # テストユーティリティ
│   │   └── static/             # テスト用HTMLファイル
│   ├── dev_scripts/            # 開発用スクリプト
│   ├── static/                 # 静的ファイル
│   ├── main.py                 # エントリーポイント
│   └── requirements.txt
├── frontend/                   # React フロントエンド
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   │   ├── Layout.tsx      # レイアウトコンポーネント
│   │   │   └── Sidebar.tsx     # サイドバーコンポーネント
│   │   ├── features/           # 機能別コンポーネント
│   │   │   └── scraping/       # スクレイピング機能
│   │   │       ├── components/ # スクレイピング関連コンポーネント
│   │   │       └── ScrapingPage.tsx
│   │   ├── tinymceEditor/      # TinyMCEエディタ
│   │   │   ├── components/     # エディタコンポーネント
│   │   │   ├── config/         # エディタ設定
│   │   │   ├── services/       # エディタサービス
│   │   │   ├── types/          # 型定義
│   │   │   └── styles/         # エディタスタイル
│   │   ├── services/           # API通信・ビジネスロジック
│   │   │   ├── apiService.ts
│   │   │   ├── errorHandlerService.ts
│   │   │   ├── pdfExportService.ts
│   │   │   └── scrapingService.ts
│   │   ├── styles/             # CSS・テーマファイル
│   │   └── types/              # TypeScript型定義
│   └── package.json
├── Rule_of_coding.md           # 開発チャーター
├── CORS_SETUP_GUIDE.md         # 本番環境構築ガイド
├── TESTING_GUIDE.md            # テスト手順書
├── create-deploy-package.ps1   # デプロイパッケージ作成スクリプト
├── deploy-to-iis.ps1           # IIS デプロイスクリプト
└── README.md                   # このファイル
```

## 🎯 実装完了機能

### ✅ Phase 1: 基盤構築

- [x] FastAPI + SQLAlchemy バックエンド
- [x] React + TypeScript フロントエンド
- [x] 3-Tier アーキテクチャ
- [x] CRUD API 実装

### ✅ Phase 2: リッチテキストエディタ

- [x] TinyMCE ベースエディタ実装
- [x] ツールバー機能（見出し・強調切り替え）
- [x] キーボードショートカット（Ctrl+B、Ctrl+U、Ctrl+T）
- [x] HTML 出力機能（ダウンロード・クリップボード）
- [x] HTML 生成プロンプト作成

### ✅ Phase 3: メール機能

- [x] メール送信 API 実装
- [x] HTML メール送信機能
- [x] HTML ファイル添付機能

### ✅ Phase 6: 本番環境対応

- [x] IIS デプロイ対応
- [x] Windows サービス化
- [x] CORS 設定の環境変数化
- [x] 自動デプロイスクリプト
- [x] チーム共有機能

### 🚧 今後の機能拡張

#### リッチテキストエディタ

- [ ] HTML 読み込み機能
- [ ] 高度な表機能（セル結合・分割、スタイル設定）
- [ ] アンドゥ・リドゥ機能
- [ ] コピー・ペースト機能

## 🔧 開発者向け情報

### 主要コンポーネント

#### Word ライクエディタ

- **WordLikeEditor**: メインエディタコンポーネント
- **useWordEditor**: エディタ状態管理フック
- **useKeyboardShortcuts**: キーボードショートカットフック
- **HtmlExportService**: HTML 出力サービス

### 設定管理

開発憲章の「設定とロジックの分離」原則に従い、以下の設定ファイルで管理：

- `backend/.env` - 環境変数設定
- `backend/app/config/settings.py` - 設定クラス
- `frontend/.env` - フロントエンド環境変数

### デプロイメント

#### 開発環境

```bash
# バックエンド
cd backend && uvicorn main:app --reload --port 8002

# フロントエンド
cd frontend && npm start
```

#### 本番環境

```powershell
# パッケージ作成
.\create-deploy-package.ps1

# IIS デプロイ
.\deploy-to-iis.ps1
```

## 💡 開発理念

このプロジェクトは以下の開発憲章に基づいて構築されています：

- **単一責任の原則**: 各コンポーネントは明確な責務を持つ
- **関心の分離**: プレゼンテーション層、ビジネスロジック層、データアクセス層の明確な分離
- **設定とロジックの分離**: 設定とビジネスロジックを明確に分離
- **型安全性の重視**: TypeScript による厳密な型チェック
- **保守性の優先**: 理解しやすく変更しやすいコード構造
- **段階的移行**: 既存機能を保護しながらの機能追加

詳細は各設計ドキュメントを参照してください。

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
