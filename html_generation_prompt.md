# HTML 生成プロンプト

## 概要

このプロンプトは、指定されたタグと CSS スタイルに基づいて HTML コンテンツを生成するためのものです。

## 許可される HTML タグ

以下のタグのみを使用してください：

### 見出し

- `<h1>` - メインタイトル
- `<h2>` - セクションタイトル
- `<h3>` - サブセクションタイトル

### 段落・テキスト

- `<p>` - 段落
- `<div>` - ブロック要素（CSS クラス用）
- `<strong>`, `<b>` - 太字
- `<em>`, `<i>` - 斜体
- `<u>` - 下線

### テーブル

- `<table>` - テーブル
- `<thead>` - テーブルヘッダー
- `<tbody>` - テーブルボディ
- `<tr>` - テーブル行
- `<th>` - テーブルヘッダーセル
- `<td>` - テーブルデータセル

## CSS スタイル

以下の CSS スタイルを適用してください：

```css
body {
  font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-top: 30px;
}

h3 {
  color: #34495e;
  margin-top: 25px;
}

.action-item {
  background-color: #d4edda;
  border-left: 4px solid #28a745;
  padding: 15px;
  margin: 15px 0;
}

.important {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px;
  margin: 15px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

@media (max-width: 768px) {
  body {
    padding: 10px;
  }
  table {
    font-size: 14px;
  }
}
```

## 生成ルール

1. **セキュリティ**: 許可されていないタグは使用しないでください
2. **構造**: 適切な HTML 構造を維持してください
3. **スタイリング**: 上記の CSS クラスを適切に使用してください
4. **レスポンシブ**: モバイル対応を考慮してください
5. **アクセシビリティ**: セマンティックな HTML を使用してください

## 使用例

### アクションアイテム

```html
<div class="action-item">
  <strong>アクション:</strong> このタスクを完了してください
</div>
```

### 重要な情報

```html
<div class="important">
  <strong>重要:</strong> この情報は必ず確認してください
</div>
```

### テーブル

```html
<table>
  <thead>
    <tr>
      <th>項目</th>
      <th>説明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>データ1</td>
      <td>説明1</td>
    </tr>
  </tbody>
</table>
```

## タグの組み合わせ例

### 見出しと段落の組み合わせ

```html
<h2>セクションタイトル</h2>
<p>
  ここに段落の内容を記述します。<strong>重要な部分</strong>は太字で強調できます。
</p>
```

### div と CSS クラスの組み合わせ

```html
<div class="action-item">
  <h3>アクション項目</h3>
  <p>このタスクを完了してください。</p>
</div>

<div class="important">
  <h3>重要な注意事項</h3>
  <p>この情報は必ず確認してください。</p>
</div>
```

### 見出し階層の例

```html
<h1>メインタイトル</h1>
<p>メインタイトルの説明文</p>

<h2>セクション1</h2>
<p>セクション1の内容</p>

<h3>サブセクション1.1</h3>
<p>サブセクションの詳細</p>

<h2>セクション2</h2>
<p>セクション2の内容</p>
```

## 注意事項

- スクリプトタグや iframe は使用しないでください
- 外部リンクは適切に処理してください
- 日本語フォントを優先してください
- 適切な見出し階層を維持してください
- `<div>`は主に CSS クラス（`.action-item`、`.important`）のコンテナとして使用してください
- `<p>`は段落の内容を囲むために使用してください
