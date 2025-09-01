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

- **PDF添付メール送信**: 議事録をPDF形式でメール送信
- **元データ添付機能**: 議事録の元データを同時添付
  - テキストデータ入力: 手動入力したテキストを UTF-8 BOM付き .txt ファイルとして添付
  - ファイルアップロード: Word・Excel・PDFファイルのドラッグ&ドロップ対応
  - 添付ファイル名規則: `【社外秘】_YYYY-MM-DD_会議タイトル_元データ.{拡張子}`
- **複数ファイル同時添付**: 議事録PDF + 元データファイルを一度のメール送信で添付
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
- [x] PDF添付メール送信機能
- [x] 元データ添付機能
  - [x] テキストデータ入力 (UTF-8 BOM付き .txt ファイル)
  - [x] Word・Excel・PDFファイルのドラッグ&ドロップ対応
  - [x] ファイルアップロード時のテキスト入力無効化
  - [x] 複数ファイル同時添付 (議事録PDF + 元データ)
  - [x] 元データファイル名規則: 【社外秘】_YYYY-MM-DD_会議タイトル_元データ

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

## � 改修者向けアーキテクチャ概要 (@serena)

以下は新規機能追加やトラブルシュート時に最低限把握しておくべき内部構造と責務分担です。コード探索の起点や変更インパクトの見積りに利用してください。

### 全体レイヤー

| レイヤー               | 役割                                            | 主ディレクトリ/ファイル                                        | 補足                                           |
| ---------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Presentation (API)     | HTTP I/F, 入出力スキーマバリデーション          | `backend/app/routes/*.py`                                      | FastAPI ルーター。プレーンな依存注入のみ。     |
| Service (Domain Logic) | 認証/スクレイピング/メール/PDF など業務ロジック | `backend/app/services/*.py`                                    | 外部 I/O をまとめ、例外 → 統一フォーマット化。 |
| Infrastructure         | Playwright, SMTP, ファイル I/O                  | `browser_service.py`, `mail_service.py`, `pdfExportService.py` | 低レベル詳細の隠蔽。                           |
| Config                 | 環境変数 → 型付き設定                           | `backend/app/config/settings.py`                               | `.env` との境界。                              |
| Frontend UI            | React/TinyMCE/機能ページ                        | `frontend/src/*`                                               | UI 状態と API 呼出分離。                       |
| Frontend Services      | API 呼び出し/例外正規化                         | `frontend/src/services/*.ts`                                   | fetch ラッパ。                                 |

### 重要な依存チェーン

`frontend(scrapingService.ts) → /api/scraping/execute (scraping_routes) → ScrapingService.execute_scraping → BrowserService + Playwright`

`frontend(apiService.ts sendMail) → /api/mail/send (mail_routes) → mail_service.send_html_mail`

`PDF 出力 (フロント) → /api/pdf/... → pdfExportService`

### スクレイピング処理フロー（同期的逐次実行）

1. ルート `/api/scraping/execute` が `ScrapingRequest` を受領
2. `ScrapingService.execute_scraping`:
   - リクエスト正規化 `_normalize_request`
   - `BrowserService.create_session` でブラウザ/コンテキスト生成
   - `BrowserService.authenticate` でフォームログイン (要: `LoginCredentials`)
   - 認証済み `Page` を再利用し URL 群を逐次処理 (`_scrape_single_url`)
   - モード別抽出: `CHAT_ENTRIES` → `_scrape_chat_entries`, `TITLE_DATE_PARTICIPANT` → `_scrape_title_date_participant`
   - 構造化 `_create_structured_output` で統合 (title/date/participant/transcript → `<タグ>` フォーマット)
   - 終了時 `BrowserService.close_session`

ポイント: 並列化は無効化され意図的に逐次。Playwright コンテキスト再利用によりログイン状態保持。

### BrowserService のライフサイクル

| ステップ   | メソッド                     | 主要責務                                                                                      |
| ---------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| 初期化     | `create_session`             | playwright 起動, chromium.launch, context 生成, セッション登録                                |
| 認証       | `authenticate`               | 汎用的なセレクタ列挙で username/password/submit を探索しログイン。成功で `authenticated=True` |
| ページ取得 | `get_page`                   | context 健全性チェック → new_page。壊れていれば `_recreate_session_context`                   |
| 終了       | `close_session` / `shutdown` | context/browser クローズ, playwright.stop                                                     |

セッションは `SESSION_TIMEOUT` を超過時 `cleanup_expired_sessions` で破棄（呼び出し側での定期実行は未実装: Cron / 背景タスク候補）。

### 設定 (`settings.py`)

- `.env` から Pydantic Settings で読み込み
- CORS: `CORS_ORIGINS` (カンマ区切り) + `CORS_DEFAULT_ORIGINS` マージ
- ブラウザ設定: `get_browser_config()` から launch args 供給
- タイムアウト群: `PAGE_LOAD_TIMEOUT`, `NAVIGATION_TIMEOUT`, `ELEMENT_WAIT_TIMEOUT`
- スクロール/待機: `MAX_SCROLL_LOOPS`, `SCROLL_DELAY`, `INITIAL_WAIT`

変更時の注意: 既存テストが固定タイムアウト前提の場合があるため閾値縮小は flaky 化リスク。

### エラー/ロギング方針

- サービス層で `logger.error` → 例外再送出 (FastAPI が 500 化)
- スクレイピングは URL 毎に `ScrapingResult(status="error")` を蓄積し全体は成功扱い可能
- Playwright セレクタは網羅的列挙 + fallback, 失敗は debug ログ。根本構造変更時は対象 HTML に併せてセレクタ配列更新。

### フロントエンドサービス分離

- `apiService.ts` (メール/PDF) / `scrapingService.ts` (スクレイピング) は BASE_URL を `REACT_APP_API_URL` で切替。
- 例外は throw → 呼び出し元 UI コンポーネントでメッセージ表示 (共通ハンドラ: `errorHandlerService.ts` 想定)。

### 代表的な変更インパクト早見表

| 変更意図                 | 変更ポイント                                                                               | 影響テスト                                                    | 副作用リスク                        |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------- |
| スクレイピングモード追加 | `ScrapingMode` enum / ルートバリデーション / `ScrapingService._scrape_single_url` dispatch | integration: `tests/integration/test_scraping_integration.py` | タイムアウト延長, メモリ使用量      |
| 認証ステップ変更         | `BrowserService.authenticate`                                                              | ログイン成功検出ロジック                                      | ログイン失敗ループ/アカウントロック |
| ダウンロード機能強化     | 新規 service + route + frontend service                                                    | 新規 API テスト                                               | CORS 設定差異                       |
| タイムアウト短縮         | `settings.py`                                                                              | flaky テスト増加                                              | 部分結果欠落                        |

### テスト配置

- Unit: 設定/ユーティリティ (`backend/tests/unit`)
- Integration: スクレイピングシナリオ (`backend/tests/integration`) - ローカル静的 HTML を対象
- 静的テスト HTML: `backend/tests/static/*.html`

### 改修時よくある落とし穴

1. Playwright 周辺: `HEADLESS=True` にすると UI 依存の遅延が増え要素検出失敗 → `SLOW_MO` を適宜増やす
2. CORS: `CORS_ORIGINS` 未設定で社内ポートアクセス拒否 → `.env` に追記後サーバ再起動
3. セッション多重: 並列化を戻す場合 `MAX_BROWSER_INSTANCES` 超過制御と `authenticate` の競合を考慮
4. 文字化け: Windows サービス(IIS) 下での標準出力コードページ差異 → ログ出力は UTF-8 前提設定必要

### 次ステップ候補

- 期限切れセッション自動クリーンアップのバックグラウンドタスク化 (FastAPI startup event + asyncio.create_task)
- スクレイピング結果の永続化 (SQLite or file) + キャッシュ層
- ログレベル/構造化ログ(JSON) 切替設定

---

この節は @serena により生成。更新時は最新のサービス層/設定差分を反映してください。

## �🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
