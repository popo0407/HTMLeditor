# HTMLEditor プロジェクト概要

## プロジェクト目的
React + TypeScript + FastAPI で構築されたモダンなブロックベース HTML エディタ。
議事録作成・編集、PDF/Word出力、メール送信、Webスクレイピング機能を持つ。

## 技術スタック

### フロントエンド
- React 18 + TypeScript 4.9.5
- TinyMCE ベースリッチテキストエディタ
- CSS3 (Snowsight 風デザイン)

### バックエンド
- FastAPI 0.104.1
- SQLAlchemy 2.0.23 + SQLite
- Pydantic 2.10.1+
- Playwright 1.40.0 (Web スクレイピング)
- 3-Tier アーキテクチャ

### 開発・運用
- Python 3.8+
- Node.js 16+
- IIS (本番環境)
- NSSM (Windows サービス化)

## 主要機能
1. リッチテキストエディタ (TinyMCE)
2. HTML/PDF/Word出力
3. メール送信機能（添付ファイル対応）
4. Webスクレイピング機能
5. 議事録管理・編集

## アーキテクチャ
- Presentation Layer: `backend/app/routes/`
- Business Logic Layer: `backend/app/services/`
- Data Access Layer: `backend/app/repositories/`
- Configuration: `backend/app/config/`
- Models: `backend/app/models/`