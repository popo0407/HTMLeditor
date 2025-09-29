# コーディング規約・スタイルガイド

## 基本原則
1. 単一責任の原則 (SRP) の厳守
2. 関心の分離 (SoC) の優先
3. DRY原則の適用
4. 設定とロジックの分離

## アーキテクチャルール
- **API Layer**: HTTP I/F, バリデーション (`backend/app/routes/`)
- **Service Layer**: ビジネスロジック (`backend/app/services/`)
- **Repository Layer**: データアクセス (`backend/app/repositories/`)
- **Config Layer**: 環境変数・設定管理 (`backend/app/config/`)

## フロントエンド規約
- コンポーネントベースアーキテクチャ
- 状態管理の一元化
- UI状態はコンポーネント内で管理
- ビジネスロジックとDOM操作の分離

## バックエンド規約
- 依存性注入 (DI) の徹底
- 機能別モジュール分割
- ファサードサービスでの複雑な処理調整
- 適切なログレベル使用

## ファイル配置基準
- `components/`: 再利用可能な汎用UI部品
- `features/`: 特定機能の統合コンポーネント
- 単一ファイル500行以下を目安