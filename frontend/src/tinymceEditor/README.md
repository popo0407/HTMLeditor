# TinyMCEEditor コンポーネント

## 概要

TinyMCEEditorは、React + TypeScriptで実装されたTinyMCEエディタのラッパーコンポーネントです。
制御コンポーネントとして正しく実装されており、日本語入力時のカーソル移動と文字重複の問題を解決しています。

## 使用方法

### 基本的な使用方法

```tsx
import React, { useState } from 'react';
import { TinyMCEEditor } from './tinymceEditor';

const MyComponent = () => {
  const [content, setContent] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <TinyMCEEditor
      value={content}
      onContentChange={handleContentChange}
      height={400}
    />
  );
};
```

### 制御コンポーネントとしての正しい実装

```tsx
import React, { useState } from 'react';
import { TinyMCEEditor } from './tinymceEditor';

const ControlledEditor = () => {
  const [editorContent, setEditorContent] = useState('');

  const handleContentChange = (content: string) => {
    setEditorContent(content);
  };

  const handleSave = (content: string) => {
    console.log('保存されたコンテンツ:', content);
    // 保存処理をここに実装
  };

  return (
    <div>
      <h2>エディタ</h2>
      <TinyMCEEditor
        value={editorContent}
        onContentChange={handleContentChange}
        onSave={handleSave}
        height={500}
        showFileOperations={true}
        showTableOperations={true}
      />
    </div>
  );
};
```

## プロパティ

| プロパティ | 型 | デフォルト値 | 説明 |
|-----------|----|-------------|------|
| `value` | `string` | `''` | エディタの内容（制御コンポーネント用） |
| `onContentChange` | `(content: string) => void` | `undefined` | コンテンツ変更時のコールバック |
| `onSave` | `(content: string) => void` | `undefined` | 保存ボタンクリック時のコールバック |
| `height` | `number` | `500` | エディタの高さ（ピクセル） |
| `className` | `string` | `''` | 追加のCSSクラス名 |
| `showFileOperations` | `boolean` | `true` | ファイル操作パネルの表示/非表示 |
| `showTableOperations` | `boolean` | `true` | テーブル操作パネルの表示/非表示 |

## 重要な注意事項

### 制御コンポーネントとしての実装

このコンポーネントは制御コンポーネントとして実装されています。以下の点に注意してください：

1. **`value`プロパティを使用**: `initialValue`ではなく`value`プロパティを使用してください
2. **状態管理**: 親コンポーネントで状態を管理し、`onContentChange`で更新してください
3. **日本語入力対応**: 制御コンポーネントとして実装されているため、日本語入力時のカーソル移動と文字重複の問題が解決されています

### 非推奨の使用方法

```tsx
// ❌ 非推奨: initialValueを使用
<TinyMCEEditor
  initialValue="初期コンテンツ"  // この方法は使用しないでください
  onContentChange={handleChange}
/>

// ✅ 推奨: valueを使用
<TinyMCEEditor
  value={content}
  onContentChange={handleChange}
/>
```

## トラブルシューティング

### 日本語入力の問題

もし日本語入力時に問題が発生する場合は、以下を確認してください：

1. `value`プロパティを使用しているか
2. 親コンポーネントで状態を正しく管理しているか
3. `onContentChange`で状態を更新しているか

### パフォーマンスの最適化

大量のコンテンツを扱う場合は、以下の最適化を検討してください：

1. `React.memo`を使用してコンポーネントをメモ化
2. `useCallback`を使用してコールバック関数をメモ化
3. 必要に応じて仮想化を実装

## 更新履歴

- **v1.1.0**: 制御コンポーネントとして正しく実装、日本語入力問題を修正
- **v1.0.0**: 初回リリース 