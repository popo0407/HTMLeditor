# Quill.js ベース Word ライクエディタ 実装計画（統合版）

## プロジェクト概要

### 目的

Microsoft Word のような直感的な操作感を持つリッチテキストエディタを、Quill.js をベースに実装する。
**特に表機能と HTML 読み出し機能を重視した実装**を行う。

## 現在の実装状況（2024 年 12 月現在）

### ✅ 完了済み機能

1. **基本エディタ機能**

   - Quill.js ベースのエディタ実装 ✅
   - 基本的なテキスト編集機能 ✅
   - 太字（Ctrl+B）、下線（Ctrl+U）の切り替え ✅

2. **右クリックメニュー機能**

   - 見出しレベル切り替え（h1, h2, h3, p）✅
   - 強調スタイル切り替え（normal, important, action-item）✅
   - 現在の状態表示とチェックマーク ✅
   - メニュー外クリックでの自動閉じ ✅

3. **表機能（強化）**

   - 表の挿入（右クリックメニュー）✅
   - 行・列の追加・削除 ✅
   - セル編集・選択機能 ✅
   - キーボードナビゲーション（矢印キー、Tab）✅
   - 表エディタ UI ✅
   - 表の HTML 出力 ✅
   - 表データの管理 ✅

4. **HTML 出力機能**

   - 見出し・強調情報の HTML 反映 ✅
   - 表の HTML 出力 ✅
   - 自己完結型 HTML ファイル生成 ✅

5. **UI/UX**

   - 画面の 60%サイズ対応 ✅
   - Word ライクなスタイリング ✅
   - レスポンシブ対応 ✅
   - ダークモード対応 ✅

6. **HTML 生成プロンプト**
   - 許可タグの定義　 ✅
   - CSS スタイルの統合 ✅
   - タグの組み合わせ例の提供 ✅

### 🔄 進行中・改善が必要な機能

1. **HTML 読み込み機能**

   - 既存 HTML ファイルの読み込み ❌
   - HTML 解析・変換機能 ❌
   - 表の HTML 変換 ❌

2. **表機能（高度）**

   - セル結合・分割 🔄（基本実装済み、高度な機能は未実装）
   - 表スタイル設定 🔄（基本実装済み、詳細設定は未実装）
   - 表の移動・削除 ✅

3. **編集機能強化**
   - アンドゥ・リドゥ機能 ❌
   - 高度な選択・編集機能 ❌
   - コピー・ペースト機能 ❌

### ❌ 未実装機能

1. **HTML 読み込み機能**

   - 既存 HTML ファイルの読み込み
   - HTML 解析・変換機能
   - 表の HTML 変換

2. **表機能（高度）**

   - セル結合・分割
   - 表スタイル設定
   - 表の移動・削除

3. **編集機能強化**
   - アンドゥ・リドゥ機能
   - 高度な選択・編集機能
   - コピー・ペースト機能

## 特殊機能・仕様の詳細説明

### **1. マルチセクションエディタシステム**

#### **1.1 セクション管理（useEditorSections）**

- **目的**: テキストと表を混在させた複合ドキュメントの管理
- **実装**: `frontend/src/wordEditor/hooks/useEditorSections.ts`
- **機能**:
  - テキストセクションと表セクションの混在管理
  - セクション間の動的挿入・削除
  - セクション固有の状態管理
  - 全テキストコンテンツの統合取得

#### **1.2 セクションタイプ**

```typescript
type EditorSectionType = "text" | "table";

interface EditorSection {
  id: string;
  type: EditorSectionType;
  content: string;
  tableData?: TableData; // 表セクションのみ
}
```

#### **1.3 セクション操作**

- **テキストセクション追加**: `addTextSection(content?: string)`
- **表セクション追加**: `addTableSection(tableData: TableData)`
- **セクション更新**: `updateSectionContent(sectionId, content)`
- **セクション削除**: `removeSection(sectionId)`
- **表挿入**: `insertTableAfterSection(sectionId, tableData)` - 指定セクション後に表と新しいテキストセクションを挿入

### **2. フォーマット管理システム（useEditorFormatting）**

#### **2.1 見出し・強調の状態管理**

- **目的**: Quill.js の DOM 操作と状態管理の分離
- **実装**: `frontend/src/wordEditor/hooks/useEditorFormatting.ts`
- **機能**:
  - 現在の見出しレベル取得: `getCurrentHeading()`
  - 現在の強調スタイル取得: `getCurrentEmphasis()`
  - 見出し適用: `applyHeading(level, savedSelection?)`
  - 強調適用: `applyEmphasis(style, savedSelection?)`
  - 行フォーマットリセット: `resetLineFormatting()`

#### **2.2 フォーマット適用ロジック**

```typescript
// 見出し適用
if (level === "p") {
  quill.formatLine(lineStart, lineLength, "header", false);
} else {
  const headerLevel = parseInt(level.charAt(1));
  quill.formatLine(lineStart, lineLength, "header", headerLevel);
}

// 強調適用
if (style === "normal") {
  quill.formatLine(lineStart, lineLength, "class", false);
  quill.formatText(lineStart, lineLength, "color", false);
  // DOMからもクラス・色を削除
} else {
  quill.formatLine(lineStart, lineLength, "class", style);
  // 色設定
  if (style === "important") {
    quill.formatText(lineStart, lineLength, "color", "#d97706");
  } else if (style === "action-item") {
    quill.formatText(lineStart, lineLength, "color", "#2563eb");
  }
}
```

### **3. 改行時の自動フォーマットリセット**

#### **3.1 新行のフォーマットリセット**

- **目的**: 改行時に見出し・強調を自動的にリセット
- **実装**: `WordLikeEditor.tsx`の`text-change`イベントリスナー
- **処理内容**:

  ```typescript
  // 改行検出
  if (delta.ops.some((op) => op.insert === "\n")) {
    const selection = quill.getSelection();
    if (selection) {
      const [line] = quill.getLine(selection.index);
      const lineStart = line.offset();
      const lineLength = line.length();

      // 新行のフォーマットをリセット
      quill.formatLine(lineStart, lineLength, "header", false);
      quill.formatLine(lineStart, lineLength, "class", false);
      quill.formatText(lineStart, lineLength, "color", false);
      quill.formatText(lineStart, lineLength, "bold", false);
      quill.formatText(lineStart, lineLength, "italic", false);
      quill.formatText(lineStart, lineLength, "underline", false);

      // DOMからもクラス・スタイルを削除
      const lineElement = quill.getLine(lineStart)[0]?.domNode;
      if (lineElement) {
        lineElement.classList.remove("important", "action-item");
        lineElement.style.fontWeight = "";
        // 子要素のスタイルもリセット
        const childElements = lineElement.querySelectorAll("*");
        childElements.forEach((child) => {
          (child as HTMLElement).style.fontWeight = "";
        });
      }

      // 状態管理も更新
      setFormats((prev) => ({
        ...prev,
        heading: "p",
        emphasis: "normal",
      }));
    }
  }
  ```

#### **3.2 カーソル位置の保持**

- **目的**: フォーマットリセット後もカーソル位置を維持
- **実装**: `setTimeout`を使用した非同期処理

```typescript
const savedIndex = selection.index;
setTimeout(() => {
  quill.setSelection(savedIndex, 0);
  quill.focus();
}, 1);
```

### **4. 右クリックメニューシステム**

#### **4.1 メニュー状態管理**

```typescript
interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  savedSelection: any; // Quill.jsの選択状態
}
```

#### **4.2 メニュー操作のキーボード制御**

- **目的**: メニュー表示中のキーボード操作を制御
- **実装**: メニュー表示中は特定のキーを無効化

```typescript
// メニュー表示中のキーボード制御
if (contextMenu.show) {
  e.preventDefault();
  e.stopPropagation();
  return;
}
```

#### **4.3 フォーカス管理**

- **目的**: メニュー操作後のエディタフォーカス復元
- **実装**: メニュー閉じ後に自動的にエディタにフォーカス

### **5. 表エディタシステム（SimpleTableEditor）**

#### **5.1 Word 風の常時編集モード**

- **目的**: セルを常に編集可能な状態に保つ
- **実装**: 各セルに`<input>`要素を常時表示
- **特徴**:
  - 選択状態なし（常に編集可能）
  - ワンクリックでセル編集開始
  - Escape、Enter、F2 キーによる編集制御なし

#### **5.2 高度なキーボードナビゲーション**

- **矢印キー移動**:

  - **上下キー**: 上下のセルに移動（従来通り）
  - **左右キー**: セル内の文字移動 + 境界でのセル移動

    ```typescript
    // 左キー: 文頭以外はセル内移動、文頭なら左セルの文末に移動
    if (selectionStart > 0) {
      return; // デフォルト動作（セル内移動）
    } else {
      // 左セルに移動し、カーソルを文末に配置
      setFocusedCell({ row, col: col - 1 });
      setTimeout(() => {
        const prevInput = document.querySelector(
          `[data-row="${row}"][data-col="${col - 1}"] input`
        );
        if (prevInput) {
          const textLength = prevInput.value.length;
          prevInput.setSelectionRange(textLength, textLength);
        }
      }, 0);
    }

    // 右キー: 文末以外はセル内移動、文末なら右セルの文頭に移動
    if (selectionStart < input.value.length) {
      return; // デフォルト動作（セル内移動）
    } else {
      // 右セルに移動し、カーソルを文頭に配置
      setFocusedCell({ row, col: col + 1 });
      setTimeout(() => {
        const nextInput = document.querySelector(
          `[data-row="${row}"][data-col="${col + 1}"] input`
        );
        if (nextInput) {
          nextInput.setSelectionRange(0, 0);
        }
      }, 0);
    }
    ```

- **Tab/Shift+Tab**: 次のセル/前のセルに移動
- **Ctrl+Enter**: 新しい行を追加（現在の行の下に挿入）

#### **5.3 移動方向の追跡**

- **目的**: セル移動後のカーソル位置を正確に制御
- **実装**: `moveDirection`状態で移動方向を記録

```typescript
type MoveDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "tab"
  | "shift-tab"
  | null;
```

#### **5.4 セル識別システム**

- **目的**: DOM 要素の正確な特定
- **実装**: `data-row`、`data-col`属性を使用

```typescript
<td data-row={row} data-col={col}>
  <input ... />
</td>
```

### **6. 状態管理システム**

#### **6.1 フラグベースの状態変異**

- **目的**: 複雑な状態変化をフラグで制御
- **実装**: 各機能で独立した状態フラグを使用

```typescript
// エディタ状態
const [isEditing, setIsEditing] = useState(false);

// メニュー状態
const [contextMenu, setContextMenu] = useState<ContextMenuState>({
  show: false,
  x: 0,
  y: 0,
  savedSelection: null,
});

// 表フォーカス状態
const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({
  row: 0,
  col: 0,
});

// 移動方向状態
const [moveDirection, setMoveDirection] = useState<MoveDirection>(null);
```

#### **6.2 状態の同期**

- **目的**: 複数の状態を同期して一貫性を保つ
- **実装**: `useEffect`と`useCallback`を組み合わせた状態管理

```typescript
// 表データの同期
useEffect(() => {
  setLocalTableData(tableData);
}, [tableData]);

// フォーマット状態の同期
useEffect(() => {
  if (quillRef.current) {
    const quill = quillRef.current.getEditor();
    // フォーマット状態をQuill.jsと同期
  }
}, [editorFormats]);
```

### **7. エラーハンドリングシステム**

#### **7.1 型安全性の確保**

- **目的**: TypeScript によるコンパイル時エラー検出
- **実装**: 厳密な型定義と null チェック

```typescript
// null安全性の確保
const selectionStart = input.selectionStart ?? 0;

// 型ガードの使用
if (quillRef.current) {
  const quill = quillRef.current.getEditor();
  // 安全な操作
}
```

#### **7.2 デバッグ情報の提供**

- **目的**: 開発時の問題特定を容易にする
- **実装**: 詳細なログ出力

```typescript
console.log("applyHeading called with level:", level);
console.log("エディタ状態:", {
  quillExists: !!quill,
  selection: selection,
  contentLength: quill.getContents().length(),
});
```

### **8. パフォーマンス最適化**

#### **8.1 メモ化による再レンダリング抑制**

- **目的**: 不要な再レンダリングを防ぐ
- **実装**: `useCallback`と`useMemo`の活用

```typescript
const handleCellEdit = useCallback(
  (row: number, col: number, value: string) => {
    // メモ化された処理
  },
  [localTableData, onTableChange]
);
```

#### **8.2 非同期処理の最適化**

- **目的**: UI の応答性を保つ
- **実装**: `setTimeout`による非同期処理

```typescript
// カーソル位置設定を非同期で実行
setTimeout(() => {
  nextInput.setSelectionRange(0, 0);
}, 0);
```

## 機能要件（統合版）

### F-001: 基本編集機能

#### F-001-1: テキスト入力・編集 ✅

- 通常のテキスト入力が可能
- カーソル移動、選択、削除が正常に動作
- リアルタイムでの編集内容反映

#### F-001-2: 見出し機能 ✅

- **右クリックメニュー**: 現在の行の見出しレベルを切り替え
  - 段落 → 小見出し → 中見出し → 大見出し → 段落
- 見出しレベルの視覚的表示
- 見出しレベルに応じたフォントサイズ・太さの自動調整
- **改行時の自動リセット**: 新行は常に段落（p）にリセット

#### F-001-3: 強調機能 ✅

- **右クリックメニュー**: 現在の行の強調スタイルを切り替え
  - 通常 → 重要 → アクションアイテム → 通常
- 強調スタイルの視覚的表示（背景色、ボーダー等）
- 強調スタイルに応じた色分け
- **改行時の自動リセット**: 新行は常に通常スタイルにリセット

#### F-001-4: インライン書式設定 ✅

- **太字**: Ctrl+B
- **下線**: Ctrl+U

### F-002: 表機能（高優先度）

#### F-002-1: 表作成・編集 ✅

- **表挿入**: 右クリックメニュー ✅
- **行・列の追加・削除**: コンテキストメニューまたはショートカットキー ✅
  - Ctrl+Shift+↑: 上に行追加
  - Ctrl+Shift+↓: 下に行追加
  - Ctrl+Shift+←: 左に列追加
  - Ctrl+Shift+→: 右に列追加
- **セル編集**: 常時編集可能（Word 風）✅
- **表書式**: 見出し行、見出し列の設定 ✅

#### F-002-2: 表操作 ✅

- **セル選択**: マウスクリックまたはキーボード操作 ✅
  - Tab: 次のセルに移動 ✅
  - Shift+Tab: 前のセルに移動 ✅
  - **矢印キー**: 高度なセル間移動 ✅
    - 上下キー: 上下のセルに移動
    - 左右キー: セル内文字移動 + 境界でのセル移動
    - 左キー: 文頭なら左セルの文末に移動
    - 右キー: 文末なら右セルの文頭に移動
  - **Ctrl+Enter**: 新しい行を追加（現在の行の下に挿入）✅
- **セル結合・分割**: コンテキストメニュー 🔄
  - 右クリック → セル結合 🔄（基本実装済み）
  - 右クリック → セル分割 🔄（基本実装済み）
- **表の移動**: ドラッグ&ドロップ ❌
- **表の削除**: 削除確認付き ✅

#### F-002-3: 表スタイル ✅

- **強調表示対応**: 表全体に強調スタイル適用 ✅
- **見出し行・列の視覚的表示** ✅
- **境界線・背景色の設定** ✅
- **セル幅・高さの調整** 🔄（基本実装済み、詳細設定は未実装）
- **表の配置**: 左寄せ、中央、右寄せ ✅

#### F-002-4: 表データ管理 ✅

- **表データの構造化保存**
- **表の複製・貼り付け**
- **表の検索・置換対応**

### F-003: HTML 読み出し機能（高優先度）

#### F-003-1: HTML 解析・読み込み ❌

- **既存 HTML ファイルの読み込み**: ファイル選択またはドラッグ&ドロップ
- **HTML 解析**: 見出し、段落、表、強調表示の認識
- **Quill.js 形式への変換**: HTML から Quill.js の Delta 形式への変換
- **書式情報の保持**: 見出しレベル、強調スタイル、表構造の維持

#### F-003-2: データ変換 ❌

- **HTML → Delta 変換**: 既存の HTML 構造を Quill.js の Delta 形式に変換
- **Delta → HTML 変換**: 編集内容を HTML 形式で出力
- **書式情報のマッピング**: 見出し、強調、表の書式情報を適切に変換

#### F-003-3: 表の HTML 変換 ❌

- **HTML 表の解析**: `<table>`, `<tr>`, `<td>`, `<th>`要素の認識
- **表構造の保持**: 行数、列数、セル結合情報の維持
- **表スタイルの変換**: CSS スタイルの適切な変換
- **見出し行・列の認識**: `<th>`要素の自動認識

#### F-003-4: エラーハンドリング ❌

- **不正な HTML の処理**: 破損した HTML の安全な処理
- **変換エラーの表示**: ユーザーへの分かりやすいエラー表示
- **部分的な読み込み**: 可能な範囲での読み込み継続

### F-004: 段落書式設定

#### F-004-1: 箇条書きインデント ❌

- 箇条書きのインデント機能

### F-005: 選択・編集機能

#### F-005-1: マウス選択 ✅

- ドラッグによるテキスト選択

#### F-005-2: キーボード選択 ✅

- Shift+矢印キーによる選択範囲拡張
- Ctrl+A による全選択
- Home/End による行頭/行末移動

### F-006: コピー・ペースト機能

#### F-006-1: リッチテキストコピー ❌

- 書式情報を含むコピー

#### F-006-2: ペースト機能 ❌

- プレーンテキストペースト

### F-007: アンドゥ・リドゥ機能

#### F-007-1: ショートカットキー ❌

- **Ctrl+Z**: アンドゥ
- **Ctrl+Y**: リドゥ

### F-008: 保存・出力機能

#### F-008-1: HTML 出力 ✅

- 編集内容を HTML ファイルとして保存
- 見出し、強調表示、表、書式情報の HTML への反映
- 自己完結型 HTML ファイル生成

#### F-008-2: 表の HTML 出力 ✅

- 表構造の完全な HTML 出力 ✅
- セル結合情報の保持 🔄（基本実装済み）
- 表スタイルの CSS 出力 ✅

### F-009: UI/UX 機能

#### F-009-1: ツールバー ❌

- 保存・出力ボタン
- 表挿入ボタン
- HTML 読み込みボタン

## 非機能要件

### NF-001: パフォーマンス

- キーボード操作の応答時間 < 50ms
- 1000 行程度の文書での編集速度維持
- メモリ使用量の最適化
- 表編集時のパフォーマンス維持

### NF-002: ブラウザ対応

- Edge 90+

### NF-003: アクセシビリティ

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 高コントラストモード対応

## 技術仕様（統合版）

### 使用技術

- **React 18**
- **TypeScript 4.9+**
- **Quill.js 1.3.7**
- **react-quill 2.0.0**

### データ構造（統合版）

詳細な型定義は `frontend/src/wordEditor/types/wordEditorTypes.ts` に記載

### キーボードショートカット定義（統合版）

詳細な実装は `frontend/src/wordEditor/hooks/useKeyboardShortcuts.ts` に記載

**重要な修正**: 表作成機能を右クリックメニューに統合。キーボードショートカットの競合を回避し、より直感的な操作を実現。

---

# 実装計画（統合版）

## 開発憲章準拠

- **単一責任の原則**: 各機能が明確な責務を持つ
- **関心の分離**: UI 操作とビジネスロジックの分離
- **設定とロジックの分離**: キーボードショートカット設定の外部化
- **リスクベースアプローチ**: 影響範囲に応じた実装手順の調整
- **既存コードの活用**: 上書きではなく拡張・統合

## 実装段階（統合版）

### 第 1 段階: 既存機能の修正・改善（高優先度）✅

**目標**: 現在の実装の問題を修正し、基本機能を安定化
**期間**: 2 日
**完了予定**: 2024 年 12 月 ✅

#### タスク

1. **右クリックメニューの動作修正** ✅

   - 見出し切り替え機能の修正 ✅
   - 強調切り替え機能の修正 ✅
   - Quill.js API の正しい使用方法の確認 ✅

2. **CSS の統合・改善** ✅

   - 既存 CSS との競合解決 ✅
   - 画面サイズの 60%復活 ✅
   - スタイルの一貫性確保 ✅

3. **基本機能の安定化** ✅

   - エラーハンドリングの強化 ✅
   - パフォーマンスの最適化 ✅
   - テストの追加 ✅

4. **HTML 生成プロンプトの作成** ✅
   - 許可タグの定義（h1, h2, h3, p, div, strong, em, u, table 関連）✅
   - CSS スタイルの統合 ✅
   - タグの組み合わせ例の提供 ✅

#### 成果物

- 正常に動作する右クリックメニュー ✅
- 統合された CSS ✅
- 安定した基本機能 ✅
- HTML 生成プロンプト ✅

### 第 2 段階: HTML 読み出し機能（高リスク・高優先度）

**目標**: 既存 HTML からの完全な読み込み機能
**期間**: 3 日
**完了予定**: 2024 年 12 月

#### タスク

1. **HTML 解析機能**

   - HTML ファイル読み込み
   - DOM 解析機能
   - 見出し・段落・表の認識

2. **データ変換機能**

   - HTML → Delta 変換
   - Delta → HTML 変換
   - 書式情報のマッピング

3. **表の HTML 変換**

   - HTML 表の解析（`<table>`, `<tr>`, `<td>`, `<th>`）
   - 表構造の保持（行数、列数、セル結合）
   - 表スタイルの変換（CSS）

4. **エラーハンドリング**

   - 不正な HTML の処理
   - 変換エラーの表示
   - 部分的な読み込み

5. **UI 統合**
   - ファイル選択 UI
   - ドラッグ&ドロップ対応
   - 読み込み進捗表示

#### 成果物

- 完全な HTML 読み込み機能
- 表の HTML 変換機能
- エラーハンドリング機能
- UI 統合

### 第 3 段階: 表機能強化（高リスク・高優先度）

**目標**: 完全な表の作成・編集機能
**期間**: 4 日
**完了予定**: 2024 年 12 月

#### タスク

1. **表操作機能**

   - セル選択・移動（Tab, Shift+Tab, 矢印キー）
   - セル結合・分割（コンテキストメニュー）
   - 表の移動・削除

2. **表スタイル機能**

   - 見出し行・列の設定
   - 強調表示対応
   - 境界線・背景色設定
   - セル幅・高さ調整

3. **表データ管理**
   - 表データの構造化保存
   - 表の複製・貼り付け
   - 表の検索・置換対応

#### 成果物

- 完全な表作成・編集機能
- 表操作機能（キーボード対応）
- 表スタイル機能
- 表データ管理機能

### 第 4 段階: 編集機能強化（中リスク）

**目標**: 選択・編集機能とアンドゥ・リドゥ機能
**期間**: 2 日
**完了予定**: 2024 年 12 月

#### タスク

1. **アンドゥ・リドゥ機能**

   - 編集履歴の管理
   - Ctrl+Z, Ctrl+Y 対応
   - 履歴サイズの最適化

2. **コピー・ペースト機能**
   - リッチテキストコピー
   - プレーンテキストペースト

#### 成果物

- アンドゥ・リドゥ機能
- コピー・ペースト機能

### 第 5 段階: UI/UX 改善（低リスク）

**目標**: Word ライクなユーザー体験の実現
**期間**: 1 日
**完了予定**: 2024 年 12 月

#### タスク

1. **ツールバー実装**

   - 保存・出力ボタン
   - 表挿入ボタン
   - HTML 読み込みボタン

2. **視覚的改善**

   - Word ライクなスタイリング
   - カーソル表示の改善
   - 選択範囲の視覚化

3. **アクセシビリティ対応**
   - キーボードナビゲーション
   - スクリーンリーダー対応

#### 成果物

- Word ライクな UI
- ツールバー機能
- アクセシビリティ対応

## 技術実装詳細（統合版）

### ファイル構造（統合版）

```
frontend/src/wordEditor/
├── components/
│   ├── WordLikeEditor.tsx      # メインエディタコンポーネント ✅
│   ├── EditorToolbar.tsx       # ツールバーコンポーネント ❌
│   ├── TableEditor.tsx         # 表編集コンポーネント ❌
│   ├── SimpleTableEditor.tsx   # 簡易表編集コンポーネント ✅
│   ├── ContextMenu.tsx         # 右クリックメニューコンポーネント ✅
│   ├── HtmlImporter.tsx        # HTML読み込みコンポーネント ❌
│   └── HtmlExporter.tsx        # HTML出力コンポーネント ✅
├── hooks/
│   ├── useWordEditor.ts        # エディタ状態管理フック ✅
│   ├── useKeyboardShortcuts.ts # キーボードショートカットフック ✅
│   ├── useEditorSections.ts    # エディタセクション管理フック ✅
│   ├── useEditorFormatting.ts  # エディタフォーマット管理フック ✅
│   └── useTableEditor.ts       # 表編集フック ❌
├── services/
│   ├── htmlExportService.ts    # HTML出力サービス ✅
│   ├── htmlImportService.ts    # HTML読み込みサービス ❌
│   └── tableService.ts         # 表操作サービス ❌
├── types/
│   └── wordEditorTypes.ts      # TypeScript型定義 ✅
└── styles/
    └── wordEditor.css          # エディタ専用スタイル ✅
```

### 主要コンポーネント設計（統合版）

#### WordLikeEditor.tsx ✅

詳細な実装は `frontend/src/wordEditor/components/WordLikeEditor.tsx` に記載

#### SimpleTableEditor.tsx ✅

詳細な実装は `frontend/src/wordEditor/components/SimpleTableEditor.tsx` に記載

#### ContextMenu.tsx ✅

詳細な実装は `frontend/src/wordEditor/components/ContextMenu.tsx` に記載

#### TableEditor.tsx ❌

未実装 - 今後の実装予定

#### HtmlImporter.tsx ❌

未実装 - 今後の実装予定

### キーボードショートカット実装（統合版）

詳細な実装は `frontend/src/wordEditor/hooks/useKeyboardShortcuts.ts` に記載

### HTML 読み込み・出力サービス（統合版）

#### HtmlExportService ✅

詳細な実装は `frontend/src/wordEditor/services/htmlExportService.ts` に記載

#### HtmlImportService ❌

未実装 - 今後の実装予定

### 表操作サービス（統合版）

未実装 - 今後の実装予定

## 成功指標（統合版）

### 定量的指標

- キーボード操作の応答時間 < 50ms
- 文書サイズ 1000 行での編集速度維持
- メモリ使用量 < 40MB
- HTML 読み込み時間 < 2 秒（1000 行程度）
- 表編集時の応答時間 < 100ms

### 定性的指標

- Word ライクな直感的な操作感
- スムーズな見出し・強調切り替え
- 直感的な表操作
- 既存 HTML との完全な互換性
- 表の完全な機能（作成・編集・スタイル）

## 完了条件（統合版）

1. ✅ 右クリックメニューで見出しレベルが正常に切り替わる
2. ✅ 右クリックメニューで強調スタイルが正常に切り替わる
3. ✅ **表の作成・編集が完全に動作する**
   - ✅ 表の挿入（右クリックメニュー）
   - ✅ 行・列の追加・削除
   - ✅ セル結合・分割（基本実装済み）
   - ✅ 表スタイル設定（基本実装済み）
   - ✅ Word 風の常時編集モード
   - ✅ 高度なキーボードナビゲーション
4. 🔄 **HTML 読み込み・出力が完全に動作する**
   - ❌ 既存 HTML の完全な読み込み
   - ✅ 表の HTML 変換
   - ❌ エラーハンドリング
5. ✅ リッチテキスト編集が正常に動作する
6. ✅ 選択・編集機能が正常に動作する
7. ✅ HTML 出力が正常に動作する
8. ❌ アンドゥ・リドゥ機能が正常に動作する
9. ✅ Word ライクな UI/UX が実現される
10. ❌ 全てのテストが通過する
11. 🔄 パフォーマンス要件を満たす

## 既存ファイルの扱い

- **既存のブロックエディタファイル**: 削除
- **新しい Word ライクエディタ**: `frontend/src/wordEditor/`ディレクトリに作成
- **段階的移行**: 新機能は全て新しいファイルに実装
- **互換性維持**: 既存機能への影響を最小限に抑制
- **CSS 統合**: 既存 CSS を活用

## リスク管理（統合版）

### 高リスク項目

- Quill.js とカスタム機能の統合
- HTML 解析・変換の複雑性
- **表機能の実装（特にセル結合・分割）**
- **表の HTML 変換の複雑性**
- **既存 CSS との競合**

### 対策

- 段階的実装による影響範囲限定
- 十分なテスト実施
- 既存コードとの分離
- **表機能の段階的実装（基本機能 → 高度な機能）**
- **HTML 変換のエラーハンドリング強化**
- **CSS の段階的統合とテスト**
