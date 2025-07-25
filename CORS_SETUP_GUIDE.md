# 📖 本番環境 導入・運用ガイド（CORS 設定含む）

このドキュメントは、「HTML エディタシステム」を**本番サーバー（Node.js/npm 利用不可）**で公開し、チームで共有するための完全な手順をまとめたものです。環境変数を使って、開発環境と IIS 本番環境の両方で動作する CORS 設定を実装しています。

---

## Part 1: 【開発 PC での作業】 公開用パッケージの作成 📦

### 1-1. フロントエンドのビルド

開発 PC で、React アプリケーションを本番公開用の静的なファイル群に変換（ビルド）します。
これにより、`frontend`フォルダ内に`build`フォルダが作成されます。この中には HTML、CSS、JavaScript ファイルが含まれており、Web サーバーに置くだけで動作します。

```powershell
# フロントエンドのプロジェクトフォルダに移動
cd C:\Path\To\Your\Project\HTMLEditer\frontend

# 依存関係が未インストールの場合は実行
npm install

# 本番用ビルドを実行
npm run build
```

### 1-2. 公開用パッケージの作成

次に、本番サーバーに必要な**「バックエンドのソースコード」**と**「フロントエンドの完成品(`build`フォルダ)」**だけを抜き出して、一つの ZIP ファイルにまとめます。
以下の PowerShell スクリプトを実行してください。

create-deploy-package.ps1

---

## Part 2: 【本番サーバーでの作業】 環境構築と IIS での公開 🖥️

ここからの作業は、すべて会社の PC（本番サーバー）で行います。

### 2-1. IIS の機能と必須モジュールの有効化とプロキシ設定(最初のアプリのみ)

コントロールパネルの「Windows の機能の有効化または無効化」で、以下の項目にチェックが入っていることを確認してください。

- **インターネット インフォメーション サービス**

さらに、IIS で Python アプリケーションを安定稼働させるための**推奨モジュール**をインストールします。

1.  **[Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)** をインストールします。
2.  **[Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)** をインストールします。


#### プロキシの設定 🔐
設定＞ネットワークとインターネット＞プロキシ＞プロキシサーバーを使う＞　サーバーIPを;区切りで追加

### 2-3. 自動デプロイスクリプトの実行

**スクリプトの実行**:
Powershellを管理者で開いて以下のコードを実行します。処理内容は後述
    ```
    PowerShell.exe -ExecutionPolicy Bypass -File "C:\webapp\HTMLEditor\deploy-to-iis.ps1"
    ```

> **Note** > `deploy-to-iis.ps1`は、バックエンドを**NSSM (Non-Sucking Service Manager)** というツールで Windows サービス化しようと試みます。
NSSM が見つからない場合、手動での起動を促すメッセージが表示されます。
安定運用のために、[NSSM 公式サイト](https://nssm.cc/download)からダウンロードし、
`nssm.exe`を環境変数 PATH の通ったフォルダに配置しておくことを強く推奨します。

---

## Part 3: 【本番サーバーでの作業】共有設定 🤝

他の PC からアクセスできるように、ネットワークとセキュリティの設定を行います。

### 3-1. サーバーの IP アドレスを確認

### 3-3. CORS 設定の更新（環境変数ベース）

1. `backend/.env.example` をコピーして `backend/.env` を作成
2. `.env` ファイルにサーバーの IP アドレスを設定:

# IIS環境用設定（例: サーバーIP = 192.168.1.10）
```
CORS_ORIGINS=http://192.168.1.10,http://192.168.1.10:3000,http://localhost:3000,http://localhost:82
```


---
## ✅ 最終確認とアクセス

### **他の PC からのアクセス**

同じネットワーク内の他の PC のブラウザで、以下のアドレスを入力してアクセスします。

HTTPS（暗号化）でのアクセス（Part 5 実施後）:
`https://<サーバーのIPアドレス>`
**例**: `https://192.168.1.10`

### ⚠️ **重要：チームメンバーへの周知事項**

自己署名証明書を使っている場合、他の PC からアクセスすると、**必ずブラウザにセキュリティ警告が表示されます**。

チームメンバーには、以下の手順でアクセスするよう周知してください。

1.  警告画面が表示されたら、「**詳細設定**」や「**詳細情報**」といったリンクをクリックします。
2.  「**（安全ではない）にアクセスする**」や「**このまま続行**」といったリンクをクリックします。

この操作は、ブラウザごとに初回アクセス時に必要となります。この警告は「証明書が公的な機関に認められていない」というだけで、**通信自体は暗号化されています**。

---

## 🔧 トラブルシューティング

### CORS エラーが発生する場合:

1. ブラウザの開発者ツールでエラー内容を確認
2. サーバーログで実際に設定されたオリジンを確認:
   ```
   CORS Origins (from env): ['http://192.168.1.10']
   ```
3. フロントエンドの API ベース URL が正しいか確認
4. IIS 環境では `web.config` の CORS 設定も確認

### 環境変数が読み込まれない場合:

1. `.env` ファイルの場所を確認（`backend/.env`）
2. ファイルの改行コードを確認（LF 推奨）
3. 環境変数名の綴りを確認（`CORS_ORIGINS`）

### **システム全体のトラブルシューティング**

- **アクセスできない場合**: ファイアウォールの設定（ポート 80、443）を再度確認してください。
- **API エラーが出る場合**: FastAPI サービスが正常に起動しているか確認してください (`nssm status HTMLEditorAPI` や、`backend`フォルダで`.\.venv\Scripts\Activate.ps1`を実行後に`python main.py`を手動実行してエラーが出ないか確認）。
- **権限エラーが出る場合**: `backend`フォルダや`*.db`ファイルに、IIS の実行ユーザー（`IIS_IUSRS`）の書き込み権限が付与されているか確認してください。


---
## ＜参考＞バックエンドの起動 🔐
cd C:\webapp\HTMLEditor\backend

python -m uvicorn main:app --host 0.0.0.0 --port 8002
---

## deploy-to-iis.ps1`スクリプトが行う設定の詳細

手動で確認・変更する場合の参考にしてください。

-----

### \#\# 1. 事前準備

1.  **管理者として実行**: これから行うすべての操作（コマンドプロンプト、IISマネージャーなど）は、管理者権限で実行してください。
2.  **ファイルの配置**: スクリプトの前提通り、ビルド済みのファイルが以下の場所に配置されていることを確認します。
      * フロントエンド: `C:\webapp\HTMLEditor\frontend`
      * バックエンド: `C:\webapp\HTMLEditor\backend`
3.  **ツールのインストール**:
      * **Python**: PCにインストールされていることを確認します。
      * **NSSM**: バックエンドをサービスとして登録するために、`nssm.exe`をダウンロードし、環境変数PATHが通った場所に配置しておきます。

-----

### \#\# 2. バックエンド (Python) の環境設定

1.  **コマンドプロンプトを開く**: スタートメニューで `cmd` と検索し、右クリックして「管理者として実行」を選択します。
2.  **ディレクトリの移動**: 以下のコマンドでバックエンドのフォルダに移動します。
    ```cmd
    cd C:\webapp\HTMLEditor\backend
    ```
3.  **Python仮想環境の作成**: 仮想環境 `.venv` を作成します。
    ```cmd
    python -m venv .venv
    ```
4.  **ライブラリのインストール**: 仮想環境内のpipを使い、必要なライブラリをインストールします。
    ```cmd
    .\.venv\Scripts\pip.exe install -r requirements.txt
    ```

-----

### \#\# 3. IISの設定

1.  **IISマネージャーを開く**: スタートメニューから「インターネット インフォメーション サービス (IIS) マネージャー」を開きます。

2.  **アプリケーションプールの作成**:

      * 左側のツリーでサーバー名の下にある「アプリケーション プール」をクリックします。
      * 右側の「操作」ペインで「アプリケーション プールの追加」をクリックします。
      * **名前**: `HTMLEditor-Pool` と入力します。
      * **.NET CLR バージョン**: \*\*「マネージド コードなし」\*\*を選択します。
      * 「OK」をクリックして作成します。

3.  **Webサイトの作成**:

      * 既存のサイトがあれば削除します。左側ツリーの「サイト」フォルダ内に `HTMLEditor-Frontend` があれば、右クリックして「削除」します。
      * 「サイト」フォルダを右クリックし、「Web サイトの追加」を選択します。
      * **サイト名**: `HTMLEditor-Frontend`
      * **物理パス**: `C:\webapp\HTMLEditor\frontend`
      * **ポート**: `82`
      * **アプリケーション プール**: 「選択」ボタンを押し、先ほど作成した `HTMLEditor-Pool` を選びます。
      * 「OK」をクリックしてサイトを作成します。

-----

### \#\# 4. ファイル権限の設定

1.  **エクスプローラーを開く**: `C:\webapp` を開きます。
2.  **全体フォルダの権限設定**:
      * `HTMLEditor` フォルダを右クリックし、「プロパティ」を選択します。
      * 「セキュリティ」タブを開き、「編集」ボタンをクリックします。
      * 「追加」ボタンをクリックし、`IIS_IUSRS` と入力して「名前の確認」を押し、「OK」をクリックします。
      * `IIS_IUSRS` を選択した状態で、下のアクセス許可欄で\*\*「読み取りと実行」\*\*にチェックが入っていることを確認します。
      * 「OK」をクリックします。
3.  **バックエンドフォルダの権限設定**:
      * `C:\webapp\HTMLEditor\backend` フォルダを右クリックし、「プロパティ」を選択します。
      * 「セキュリティ」タブを開き、「編集」ボタンをクリックします。
      * 一覧から `IIS_IUSRS` を選択し、下のアクセス許可欄で\*\*「フル コントロール」\*\*の「許可」にチェックを入れます。
      * 「OK」をクリックして閉じます。

-----

### \#\# 5. バックエンドサービスの登録 (NSSM)

1.  **コマンドプロンプトを開く**: 管理者権限でコマンドプロンプトを開きます。
2.  **既存サービスの削除（念のため）**: もし古いサービスが残っていたら停止・削除します。
    ```cmd
    sc stop HTMLEditorAPI
    sc delete HTMLEditorAPI
    ```
3.  **NSSMのGUIを開く**: 以下のコマンドを実行すると、NSSMの設定画面が開きます。
    ```cmd
    nssm install HTMLEditorAPI
    ```
4.  **サービスの設定**:
      * **`Application` タブ**:
          * **Path**: `C:\webapp\HTMLEditor\backend\.venv\Scripts\python.exe`
          * **Startup directory**: `C:\webapp\HTMLEditor\backend`
          * **Arguments**: `-m uvicorn main:app --host 127.0.0.1 --port 8002`
      * **`Details` タブ**:
          * **Display name**: `HTML Editor API Service`
          * **Startup type**: `Automatic`
5.  **サービスのインストール**: 「Install service」ボタンをクリックします。
6.  **サービスの開始**: コマンドプロンプトでサービスを開始します。
    ```cmd
    sc start HTMLEditorAPI
    ```

## Part 5 (自己署名証明書版): HTTPS 化によるセキュリティ強化 🔐

### 5-1. 事前準備：ファイアウォールの設定

Part 3-2 で設定したポート`80`に加えて、HTTPS 通信で使われる**`443`番ポート**も許可する規則を Windows ファイアウォールに追加してください。
（ドメイン名や DNS 設定は、外部に公開しない限り必須ではありません。サーバーの IP アドレスやコンピュータ名でアクセスします。）

### 5-2. IIS での自己署名証明書の作成

1.  **IIS マネージャーを起動**します。

2.  左側のツリーから、一番上の**サーバー名**をクリックします。

3.  中央のペインにある「IIS」セクションの中から「**サーバー証明書**」をダブルクリックします。

4.  右側の「操作」ペインから、「**自己署名入り証明書の作成...**」をクリックします。

5.  証明書のフレンドリ名（管理用の分かりやすい名前）を入力します。

    - 例: `HTMLEditor Self-Signed Cert`

6.  証明書のストアは「**個人**」のままで「OK」をクリックします。

これで、サーバー内に証明書が作成されました。

### 5-3. サイトへの証明書の割り当て（バインド）

次に、作成した証明書をフロントエンドのサイトに適用します。

1.  IIS マネージャーの左側ツリーから、**サイト** \> **`HTMLEditor-Frontend`** を選択します。

2.  右側の「操作」ペインから「**バインド...**」をクリックします。

3.  「サイト バインド」ウィンドウで「**追加...**」ボタンをクリックします。

4.  「サイト バインドの追加」ウィンドウで、以下のように設定します。

    - 種類: `https`
    - IP アドレス: `すべて未割り当て`
    - ポート: `443`
    - ホスト名: （空欄で OK）
    - **SSL 証明書**: プルダウンリストから、先ほど作成した証明書（例: `HTMLEditor Self-Signed Cert`）を選択します。

5.  「OK」をクリックし、「閉じる」をクリックします。

### 5-4. HTTP から HTTPS への自動リダイレクト設定 (推奨)

ユーザーが `http://` でアクセスしても、自動的に `https://` へ転送する設定です。

1.  IIS マネージャーで `HTMLEditor-Frontend` サイトを選択し、「**URL 書き換え**」をダブルクリックします。
2.  「規則の追加...」から「**空の規則**」を選択します。
3.  以下の通りに設定します。
    - **名前**: `Redirect to HTTPS`
    - **照合する URL**:
      - パターン: `(.*)`
    - **条件**:
      - 「追加...」ボタンをクリックし、以下を追加します。
        - 条件の入力: `{HTTPS}`
        - パターン: `^OFF$`
    - **アクション**:
      - アクションの種類: `リダイレクト`
      - リダイレクト URL: `https://{HTTP_HOST}/{R:1}`
      - リダイレクトの種類: `永続 (301)`
4.  「**適用**」をクリックして保存します。
