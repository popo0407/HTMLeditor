# キーボードショートカット修正: 表作成機能の右クリックメニュー統合

## 問題の概要

`Ctrl+T` を押すと新しいブラウザタブが開いてしまう問題が発生していました。これは、ブラウザのデフォルト動作（新規タブ作成）が、エディタのカスタムキーボードショートカット（表挿入）よりも優先されてしまうためでした。

## 解決方法

### 修正内容

1. **Ctrl+T キーボードショートカットの削除**

   - `useKeyboardShortcuts.ts` から `Ctrl+T` のハンドラーを削除
   - ブラウザのデフォルト動作との競合を完全に回避

2. **右クリックメニューへの表作成機能統合**

   - 右クリックメニューに「表」セクションを追加
   - 「表を作成」オプションを実装
   - キーボードナビゲーション対応（Tab キーでセクション切替）

3. **より直感的な操作の実現**
   - 右クリック → 表 → 表を作成 の流れで表を挿入
   - メニュー操作: ↑↓ (選択), Tab (セクション切替), Enter (決定), Esc (キャンセル)

### 修正されたファイル

- `frontend/src/wordEditor/hooks/useKeyboardShortcuts.ts`
- `frontend/src/wordEditor/components/WordLikeEditor.tsx`

## テスト方法

### 1. ブラウザでのテスト

1. 開発サーバーを起動:

   ```bash
   cd frontend
   npm start
   ```

2. ブラウザで `http://localhost:3000` にアクセス

3. エディタ内で右クリック

4. 「表」セクションの「表を作成」をクリック

5. **期待される動作**:
   - 表エディタが表示される
   - 新しいタブが開かない
   - コンソールにログが表示される

### 2. キーボードナビゲーションテスト

1. エディタ内で右クリック
2. Tab キーで「表」セクションに移動
3. 矢印キーで「表を作成」を選択
4. Enter キーで表を作成

## 技術的詳細

### 修正前の問題

```typescript
// 問題のある実装
'ctrl+t': (quill: any) => {
  if (onTableInsert) {
    onTableInsert();
  }
}
```

### 修正後の実装

```typescript
// 右クリックメニューでの表作成
const tableItems = [{ key: "create" as const, label: "表を作成" }];

// メニュー項目の統合
const allMenuItems = [
  ...headingItems.map((item) => ({ ...item, section: "heading" as const })),
  ...emphasisItems.map((item) => ({ ...item, section: "emphasis" as const })),
  ...tableItems.map((item) => ({ ...item, section: "table" as const })),
];
```

## 他のキーボードショートカット

この修正により、以下のキーボードショートカットが正常に動作します：

- `Ctrl+B`: 太字切り替え
- `Ctrl+U`: 下線切り替え
- `Ctrl+Shift+↑`: 表に行を上に追加
- `Ctrl+Shift+↓`: 表に行を下に追加
- `Ctrl+Shift+←`: 表に列を左に追加
- `Ctrl+Shift+→`: 表に列を右に追加

## 右クリックメニューの操作

- **見出し**: 見出し 1, 見出し 2, 見出し 3, 通常テキスト
- **強調**: 通常, 重要, アクション項目
- **表**: 表を作成

## 注意事項

- `Ctrl+T` は削除され、ブラウザのデフォルト動作（新規タブ作成）が復活
- 表作成は右クリックメニューからのみ可能
- キーボードナビゲーションで表作成も可能（Tab → 表 → Enter）
- より直感的で競合のない操作を実現
