HTML は以下の仕様に従って作成してください：

【HTML 構造要件】

1. 各要素に `data-block-type` と `data-block-id` 属性を必須で追加
2. 見出しは h1, h2, h3 タグを使用
3. 議題・決定事項・アクション項目は特別なスタイルクラスを使用
4. 参加者リストは ul タグで作成
5. テーブルが必要な場合は thead/tbody 構造を使用

【必須の HTML 形式】

- 見出し 1: <h1 data-block-type="heading1" data-block-id="block-[ユニークID]">タイトル</h1>
- 見出し 2: <h2 data-block-type="heading2" data-block-id="block-[ユニークID]">セクション名</h2>
- 見出し 3: <h3 data-block-type="heading3" data-block-id="block-[ユニークID]">項目名</h3>
- 段落: <p data-block-type="paragraph" data-block-id="block-[ユニークID]">内容</p>
- リスト: <ul data-block-type="bulletList" data-block-id="block-[ユニークID]"><li>項目 1</li><li>項目 2</li></ul>
- 水平線: <hr data-block-type="horizontalRule" data-block-id="block-[ユニークID]" />

【特別なスタイルクラス】

- 重要事項: class="important" (黄色の背景、左側に黄色の線)
- アクション項目: class="action-item" (緑色の背景、左側に緑色の線)

````
以下の文字起こし結果を元に、HTMLエディタで編集可能な議事録を作成してください。

【必須要件】
- 全ての要素に data-block-type="[要素タイプ]" data-block-id="block-[タイムスタンプ]-[連番]" を追加
- 決定事項は class="important" を追加
- アクション項目は class="action-item" を追加
- ブロックIDは "block-20250123-001" のような形式

【HTML出力例】
<h1 data-block-type="heading1" data-block-id="block-20250123-001">週次定例会議 議事録</h1>
<h2 data-block-type="heading2" data-block-id="block-20250123-002">会議情報</h2>
<p data-block-type="paragraph" data-block-id="block-20250123-003">日時: 2025年1月23日 10:00-11:00</p>
<p data-block-type="paragraph" data-block-id="block-20250123-004">場所: 会議室A</p>
<ul data-block-type="bulletList" data-block-id="block-20250123-005">
<li>田中 (司会)</li>
<li>佐藤</li>
<li>鈴木</li>
</ul>

<h2 data-block-type="heading2" data-block-id="block-20250123-006">決定事項</h2>
<p data-block-type="paragraph" data-block-id="block-20250123-007" class="important">新機能のリリース日を2月15日に決定</p>

<h2 data-block-type="heading2" data-block-id="block-20250123-008">アクション項目</h2>
<ul data-block-type="bulletList" data-block-id="block-20250123-009" class="action-item">
<li>田中: 設計書作成 (期限: 1/30)</li>
<li>佐藤: テスト環境準備 (期限: 2/1)</li>
</ul>

## 📋 スタイル別使用例

### 1. 重要事項 (class="important")
```html
<p data-block-type="paragraph" data-block-id="block-xxx-001" class="important">
予算承認: 新プロジェクトに500万円の予算を承認
</p>

<h3 data-block-type="heading3" data-block-id="block-xxx-002" class="important">
緊急対応が必要な案件
</h3>
````

### 2. アクション項目 (class="action-item")

```html
<ul
  data-block-type="bulletList"
  data-block-id="block-xxx-003"
  class="action-item"
>
  <li>山田: 顧客への報告書作成 (期限: 1/25)</li>
  <li>田中: システム障害の原因調査 (期限: 1/27)</li>
</ul>

<p
  data-block-type="paragraph"
  data-block-id="block-xxx-004"
  class="action-item"
>
  次回会議の議題準備: 各部署の進捗報告資料を準備する (担当: 各部署長)
</p>
```

### 3. テーブル使用例

```html
<table data-block-type="table" data-block-id="block-xxx-005">
  <thead>
    <tr>
      <th>項目</th>
      <th>担当者</th>
      <th>期限</th>
      <th>状況</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>要件定義</td>
      <td>田中</td>
      <td>1/30</td>
      <td>進行中</td>
    </tr>
    <tr>
      <td>設計</td>
      <td>佐藤</td>
      <td>2/15</td>
      <td>未着手</td>
    </tr>
  </tbody>
</table>
```

## 🔧 ブロック ID 生成ルール

### 推奨フォーマット

```
block-[YYYYMMDD]-[連番3桁]

例:
- block-20250123-001
- block-20250123-002
- block-20250123-003
```

## ✅ 確認チェックリスト

以下の点を確認してください：

**📋 HTML エディタでの読み込み前チェック**

- [ ] 全ての要素に `data-block-type` 属性が含まれている
- [ ] 全ての要素に `data-block-id` 属性が含まれている
- [ ] 重要事項に `class="important"` が追加されている
- [ ] アクション項目に `class="action-item"` が追加されている
- [ ] ブロック ID がユニークである
- [ ] 見出し構造が適切 (h1 > h2 > h3)
- [ ] リストは `<ul><li>` 形式になっている
