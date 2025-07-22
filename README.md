# HTML Editor

React + TypeScript + FastAPI で構築されたモダンなブロックベースHTMLエディタ

## 🚀 特徴

- **ブロックベースエディタ**: 見出し、段落、リスト、表、画像などのブロックを組み合わせて文書を作成
- **リアルタイムプレビュー**: 編集内容をリアルタイムでプレビュー表示
- **強調表示**: 重要な内容やアクションアイテムを視覚的に強調
- **高度なテーブル編集**: 行・列の追加・削除、セル編集、ヘッダー行・列の設定
- **HTMLエクスポート**: 作成した文書をHTMLファイルとして保存
- **クリップボード連携**: HTMLコンテンツのインポート・エクスポート
- **Snowsight風UI**: 洗練されたモダンなユーザーインターフェース

## 🛠 技術スタック

### フロントエンド
- React 18
- TypeScript
- CSS3 (Snowsight風デザイン)
- カスタムブロックエディタ

### バックエンド
- FastAPI (Python)
- SQLAlchemy
- SQLite
- Pydantic
- 3-Tier アーキテクチャ

## 📦 セットアップ

### 前提条件
- Node.js 16以上
- Python 3.8以上
- npm または yarn

### インストール手順

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

4. **開発サーバーの起動**
   
   バックエンド:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
   
   フロントエンド:
   ```bash
   cd frontend
   npm start
   ```

5. **アプリケーションへのアクセス**
   - フロントエンド: http://localhost:3000
   - バックエンドAPI: http://localhost:8000

## 📝 使用方法

### 基本操作
1. **ブロックの追加**: 「+」ボタンから希望するブロックタイプを選択
2. **編集**: ブロックをクリックして内容を編集
3. **スタイル変更**: ブロック選択時に表示されるボタンで重要度を設定
4. **プレビュー**: 「👁 プレビューモード」ボタンで最終的な見た目を確認
5. **エクスポート**: HTML保存ボタンで完成した文書を保存

### テーブル機能
- **セル編集**: セルをダブルクリックで編集モード
- **行・列追加**: 「+行」「+列」ボタンで追加
- **行・列削除**: 各行・列の「×」ボタンで削除
- **ヘッダー設定**: 「ヘッダー行」「ヘッダー列」チェックボックスで設定
- **強調表示**: importantやaction-itemスタイル適用時、ヘッダーが強調色で表示

### 強調表示
- **通常**: デフォルトスタイル
- **重要**: 黄色の背景で重要な内容を強調（テーブルヘッダーも黄色系）
- **アクションアイテム**: 緑色の背景でアクションアイテムを強調（テーブルヘッダーも緑色系）

## 🧪 テスト

```bash
cd frontend
npm test
```

詳細なテスト手順は `TESTING_GUIDE.md` を参照してください。

## 📋 プロジェクト構造

```
HTMLEditer/
├── backend/                    # FastAPI バックエンド
│   ├── models/                 # データベースモデル
│   ├── repositories/           # データアクセス層
│   ├── routes/                 # API層
│   ├── services/               # ビジネスロジック層
│   ├── main.py                 # エントリーポイント
│   └── requirements.txt
├── frontend/                   # React フロントエンド
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   │   ├── blocks/         # ブロック系コンポーネント
│   │   │   └── layout/         # レイアウト系コンポーネント
│   │   ├── services/           # API通信・ビジネスロジック
│   │   ├── styles/             # CSS・テーマファイル
│   │   └── types/              # TypeScript型定義
│   └── package.json
├── cursor.md                   # 開発憲章
├── 要件定義.md                  # 要件定義書
├── 実装方針.md                  # 実装方針
├── 実装計画.md                  # 実装計画
├── TESTING_GUIDE.md            # テスト手順書
└── README.md                   # このファイル
```

## 🎯 実装完了機能

### ✅ Phase 1: 基盤構築
- [x] FastAPI + SQLAlchemy バックエンド
- [x] React + TypeScript フロントエンド
- [x] 3-Tier アーキテクチャ
- [x] CRUD API実装

### ✅ Phase 2: ブロックエディタ
- [x] ブロックベースエディタ実装
- [x] クリップボード HTML読み込み・エクスポート
- [x] ブロック操作（追加・編集・削除・移動）
- [x] HTMLダウンロード機能
- [x] Snowsight風UIテーマ適用

### ✅ Phase 3: 高度なブロック機能
- [x] ブロックスタイル機能（important/action-item）
- [x] 高度なテーブル編集機能
- [x] 行・列の追加・削除
- [x] ヘッダー行・列設定
- [x] テーブルセル編集
- [x] 強調表示時のヘッダー色分け
- [x] プレビューモード・編集モードの統合ボタン

### 🚧 今後の機能拡張
- [ ] 画像アップロード機能
- [ ] ドラッグ&ドロップ機能
- [ ] メール送信機能
- [ ] より高度なテーブル操作

## 🔧 開発者向け情報

### 主要コンポーネント
- **BlockEditor**: メインエディタコンポーネント
- **BlockBase**: 各ブロックの共通基底コンポーネント
- **TableBlock**: テーブル編集専用コンポーネント
- **ClipboardService**: クリップボード操作サービス

### API エンドポイント
- `POST /api/address-books/validate` - 共通ID検証
- `POST /api/address-books` - アドレス帳作成
- `POST /api/address-books/{common_id}/contacts` - 連絡先追加
- `GET /api/address-books/{common_id}/contacts` - 連絡先取得

## 💡 開発理念

このプロジェクトは以下の開発憲章に基づいて構築されています：
- **単一責任の原則**: 各コンポーネントは明確な責務を持つ
- **設定とロジックの分離**: 設定とビジネスロジックを明確に分離
- **型安全性の重視**: TypeScriptによる厳密な型チェック
- **保守性の優先**: 理解しやすく変更しやすいコード構造

詳細は各設計ドキュメントを参照してください。

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
