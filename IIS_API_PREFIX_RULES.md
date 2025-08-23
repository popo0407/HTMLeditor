## IIS 公開向け: /api プレフィックス ルール

目的

- IIS でフロントエンドとバックエンドを同一ホスト配下に公開するとき、API 呼び出しの混乱（CORS / ポート / 二重 /api）を防ぐ。

ルール（必須）

1. バックエンドは `/api/...` で公開する。
2. `REACT_APP_API_URL` は「API のベース（/api を含む）」に設定する。

- 開発: `REACT_APP_API_URL=http://localhost:8002/api`
- 本番: `REACT_APP_API_URL=/api`

3. フロントエンドは常に `fetch(`${API_BASE_URL}/<resource>`)` を使う。
4. `API_BASE_URL` に `/api` が含まれる場合、コード内でさらに `/api` を付けない。

短い例

- 呼び出し（共通）: `fetch(`${API_BASE_URL}/pdf/export`)` → 実リクエストは `http://localhost:8002/api/pdf/export` または `/api/pdf/export`

注意点

- 本番ビルド前に `frontend/.env` を本番値（`/api`）で用意するか、配布後に設定を反映すること。
- もし `404` が出たら、まずリクエスト URL が `/api/api/...` になっていないか確認する。
