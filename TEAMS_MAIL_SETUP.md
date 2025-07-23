# Teams チャネルへのメール送信設定ガイド

## 📧 Teams チャネルメールアドレスの取得方法

### 1. チャネルのメールアドレスを有効化

#### Microsoft Teams での操作

1. **対象チャネルを選択**
2. **チャネル名の右にある「...」をクリック**
3. **「メールアドレスを取得」** を選択
4. **「メールアドレスをコピー」** をクリック

**取得されるアドレス形式**:

```
channelname_teamname@yourcompany.onmicrosoft.com
```

または

```
<ランダム文字列>@teams.ms
```

### 2. チャネルメール設定の確認

#### Teams で確認すべき設定:

- ✅ チャネルのメール機能が有効
- ✅ 外部メール受信が許可されている
- ✅ 送信者の制限設定を確認

## 🔧 HTML エディタでの設定

### .env ファイルの設定例

```bash
# Microsoft 365 / Outlook.com 経由でTeamsチャネルに送信
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-work-email@yourcompany.com
SMTP_PASSWORD=your-password-or-app-password
SENDER_EMAIL=your-work-email@yourcompany.com
SENDER_NAME=議事録システム

# または Gmail経由
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-gmail@gmail.com
SENDER_NAME=議事録システム
```

### アドレス帳での設定

HTML エディタのアドレス帳に以下のように Teams チャネルを登録:

```
名前: プロジェクトチーム
メールアドレス: projectteam_company@yourcompany.onmicrosoft.com
共通ID: teams-project

名前: 営業部チャネル
メールアドレス: sales_company@yourcompany.onmicrosoft.com
共通ID: teams-sales
```

## 📋 Teams チャネル向け議事録メール設定

### 1. 件名の推奨フォーマット

```
[議事録] 2025/01/23 週次定例会議 - プロジェクトA進捗
[会議資料] 新機能リリース検討会 - 承認依頼
[アクション項目] 緊急対応事項 - 確認要請
```

### 2. Teams での表示を最適化する HTML メール

現在のシステムの CSS スタイルが Teams でも適切に表示されるように調整:

```css
/* Teams対応のメールスタイル */
body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #323130;
  max-width: 100%;
  margin: 0;
  padding: 16px;
}

/* Teamsでの重要事項表示 */
.important {
  background-color: #fff4ce;
  border-left: 4px solid #ffb900;
  padding: 12px;
  margin: 12px 0;
  border-radius: 4px;
}

/* Teamsでのアクション項目表示 */
.action-item {
  background-color: #e1f5fe;
  border-left: 4px solid #0078d4;
  padding: 12px;
  margin: 12px 0;
  border-radius: 4px;
}
```

## 🔐 認証設定パターン

### パターン 1: Microsoft 365 アカウント使用（推奨）

```bash
# 会社のMicrosoft 365アカウントを使用
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=yourname@yourcompany.com
SMTP_PASSWORD=your-password

# 多要素認証が有効な場合はアプリパスワードを使用
SMTP_PASSWORD=your-app-specific-password
```

**アプリパスワードの作成手順**:

1. Microsoft 365 セキュリティ設定にアクセス
2. 「アプリ パスワード」を選択
3. 新しいアプリパスワードを生成
4. 生成されたパスワードを`.env`ファイルに設定

### パターン 2: Gmail アカウント使用

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📨 Teams チャネル向けメールテンプレート

### AI プロンプトへの追加指示

既存の`AI_PROMPT_GUIDE.md`のプロンプトに以下を追加:

```
【Teamsチャネル向け追加要件】
- 件名は [議事録] または [会議資料] で開始
- 重要な決定事項は目立つようにclass="important"を使用
- アクション項目は担当者とメンション形式で記載
- 次回会議の予定は最後に明記

【Teams表示最適化】
- テーブルはシンプルな構造を使用
- 長い内容は適切に区切りを入れる
- @メンション形式でアクション担当者を記載 (例: @田中さん)
```

### メール件名の自動生成

バックエンドで件名を自動生成する場合の例:

```python
def generate_teams_subject(meeting_type: str, date: str, topic: str) -> str:
    """Teamsチャネル向けの件名を生成"""
    return f"[議事録] {date} {meeting_type} - {topic}"

# 使用例
subject = generate_teams_subject("週次定例会議", "2025/01/23", "プロジェクトA進捗")
# 結果: "[議事録] 2025/01/23 週次定例会議 - プロジェクトA進捗"
```

## 🔍 Teams 表示での注意点

### 1. HTML サポート制限

- Teams メールビューアーは一部の CSS プロパティをサポートしない
- インラインスタイルを推奨
- 複雑なレイアウトは避ける

### 2. 添付ファイル

- HTML ファイルの添付も可能
- Teams でプレビュー表示される
- ファイルサイズは 25MB 以下推奨

### 3. @メンション

- メール内でのメンションは通知されない
- アクション項目では明確に担当者名を記載

## ✅ 設定チェックリスト

### 事前確認

- [ ] Teams チャネルのメールアドレスを取得済み
- [ ] チャネルの外部メール受信が有効
- [ ] 送信用メールアカウントの認証情報を確認済み

### HTML エディタ設定

- [ ] `.env`ファイルに SMTP 設定を記載
- [ ] アドレス帳に Teams チャネルアドレスを登録
- [ ] メール送信テストを実行

### 動作確認

- [ ] テストメールが Teams チャネルに到着
- [ ] HTML スタイルが適切に表示
- [ ] 添付ファイル（ある場合）が正常に送信

## 🚨 トラブルシューティング

### よくある問題

#### 1. メールが届かない

- スパムフォルダを確認
- Teams チャネルの設定を再確認
- SMTP 認証情報を再確認

#### 2. HTML スタイルが適用されない

- インラインスタイルに変更
- CSS プロパティをシンプルに調整

#### 3. 添付ファイルが開けない

- ファイル形式を Teams 対応形式に変更
- ファイルサイズを確認

この設定により、HTML エディタから Teams チャネルに直接議事録を送信できるようになります！
