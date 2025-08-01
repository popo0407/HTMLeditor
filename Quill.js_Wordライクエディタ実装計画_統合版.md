# Quill.js ベース Word ライクエディタ 実装計画（統合版）

## プロジェクト概要

### 目的

Microsoft Word のような直感的な操作感を持つリッチテキストエディタを、Quill.js をベースに実装する。
**特に表機能と HTML 読み出し機能を重視した実装**を行う。

### 基本方針

- **Quill.js**をベースとして、カスタムキーボードショートカットを実装
- **右クリックメニュー**: 見出しレベルと強調スタイルの切り替え
- **表機能**: 完全なテーブル作成・編集機能（高優先度）
- **HTML 読み出し機能**: 既存 HTML からの完全な読み込み機能維持（高優先度）
- シンプルで直感的な UI/UX
- **既存 CSS の活用**: 上書きではなく拡張・統合

## 現在の実装状況

### ✅ 完了済み機能

1. **基本エディタ機能**

   - Quill.js ベースのエディタ実装
   - 基本的なテキスト編集機能
   - 太字（Ctrl+B）、下線（Ctrl+U）の切り替え

2. **右クリックメニュー機能**

   - 見出しレベル切り替え（h1, h2, h3, p）
   - 強調スタイル切り替え（normal, important, action-item）
   - 現在の状態表示とチェックマーク
   - メニュー外クリックでの自動閉じ

3. **表機能（基本）**

   - 表の挿入（Ctrl+T）
   - 行・列の追加・削除
   - 表データの管理

4. **HTML 出力機能**

   - 見出し・強調情報の HTML 反映
   - 自己完結型 HTML ファイル生成
   - クリップボードコピー機能

5. **UI/UX**
   - 画面の 60%サイズ対応
   - Word ライクなスタイリング
   - レスポンシブ対応
   - ダークモード対応

### 🔄 進行中・改善が必要な機能

1. **右クリックメニューの動作**

   - 見出しと強調の切り替えが正常に動作しない問題
   - Quill.js API の正しい使用方法の確認

2. **CSS の統合**
   - 既存 CSS との競合解決
   - 上書きではなく拡張・統合の実現

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

#### F-001-3: 強調機能 ✅

- **右クリックメニュー**: 現在の行の強調スタイルを切り替え
  - 通常 → 重要 → アクションアイテム → 通常
- 強調スタイルの視覚的表示（背景色、ボーダー等）
- 強調スタイルに応じた色分け

#### F-001-4: インライン書式設定 ✅

- **太字**: Ctrl+B
- **下線**: Ctrl+U

### F-002: 表機能（高優先度）

#### F-002-1: 表作成・編集 🔄

- **表挿入**: Ctrl+T またはツールバーボタン ✅
- **行・列の追加・削除**: コンテキストメニューまたはショートカットキー ✅
  - Ctrl+Shift+↑: 上に行追加
  - Ctrl+Shift+↓: 下に行追加
  - Ctrl+Shift+←: 左に列追加
  - Ctrl+Shift+→: 右に列追加
- **セル編集**: 直接編集可能 ✅
- **表書式**: 見出し行、見出し列の設定 ❌

#### F-002-2: 表操作 ❌

- **セル選択**: マウスクリックまたはキーボード操作
  - Tab: 次のセルに移動
  - Shift+Tab: 前のセルに移動
  - 矢印キー: セル間移動
- **セル結合・分割**: コンテキストメニュー
  - 右クリック → セル結合
  - 右クリック → セル分割
- **表の移動**: ドラッグ&ドロップ
- **表の削除**: 削除確認付き

#### F-002-3: 表スタイル ❌

- **強調表示対応**: 表全体に強調スタイル適用
- **見出し行・列の視覚的表示**
- **境界線・背景色の設定**
- **セル幅・高さの調整**
- **表の配置**: 左寄せ、中央、右寄せ

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

#### F-008-2: 表の HTML 出力 ❌

- 表構造の完全な HTML 出力
- セル結合情報の保持
- 表スタイルの CSS 出力

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

```typescript
interface EditorContent {
  content: string;
  formats: EditorFormats;
  tableData?: TableData;
}

interface EditorFormats {
  heading: "h1" | "h2" | "h3" | "p";
  emphasis: "normal" | "important" | "action-item";
  inline: {
    bold: boolean;
    underline: boolean;
  };
  paragraph: {
    indent: number;
  };
  table: {
    rows: number;
    cols: number;
    hasHeaderRow: boolean;
    hasHeaderCol: boolean;
    cellMerges: CellMerge[];
    styles: TableStyles;
  };
}

interface TableData {
  rows: string[][];
  headers: string[];
  styles: TableStyles;
}

interface CellMerge {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

interface TableStyles {
  borderColor: string;
  backgroundColor: string;
  headerBackgroundColor: string;
  alignment: "left" | "center" | "right";
  cellPadding: number;
}

interface HtmlImportResult {
  success: boolean;
  content?: EditorContent;
  errors?: string[];
  warnings?: string[];
}
```

### キーボードショートカット定義（統合版）

```typescript
interface KeyboardShortcuts {
  "ctrl+b": "bold";
  "ctrl+u": "underline";
  "ctrl+z": "undo";
  "ctrl+y": "redo";
  "ctrl+t": "table-insert";
  "ctrl+shift+up": "table-add-row-above";
  "ctrl+shift+down": "table-add-row-below";
  "ctrl+shift+left": "table-add-column-left";
  "ctrl+shift+right": "table-add-column-right";
  tab: "table-next-cell";
  "shift+tab": "table-previous-cell";
}
```

---

# 実装計画（統合版）

## 開発憲章準拠

- **単一責任の原則**: 各機能が明確な責務を持つ
- **関心の分離**: UI 操作とビジネスロジックの分離
- **設定とロジックの分離**: キーボードショートカット設定の外部化
- **リスクベースアプローチ**: 影響範囲に応じた実装手順の調整
- **既存コードの活用**: 上書きではなく拡張・統合

## 実装段階（統合版）

### 第 1 段階: 既存機能の修正・改善（高優先度）

**目標**: 現在の実装の問題を修正し、基本機能を安定化
**期間**: 2 日
**完了予定**: 2024 年 12 月

#### タスク

1. **右クリックメニューの動作修正**

   - 見出し切り替え機能の修正
   - 強調切り替え機能の修正
   - Quill.js API の正しい使用方法の確認

2. **CSS の統合・改善**

   - 既存 CSS との競合解決
   - 画面サイズの 60%復活
   - スタイルの一貫性確保

3. **基本機能の安定化**
   - エラーハンドリングの強化
   - パフォーマンスの最適化
   - テストの追加

#### 成果物

- 正常に動作する右クリックメニュー
- 統合された CSS
- 安定した基本機能

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
│   ├── TableEditor.tsx         # 表編集コンポーネント 🔄
│   ├── HtmlImporter.tsx        # HTML読み込みコンポーネント ❌
│   └── HtmlExporter.tsx        # HTML出力コンポーネント ✅
├── hooks/
│   ├── useWordEditor.ts        # エディタ状態管理フック ✅
│   ├── useKeyboardShortcuts.ts # キーボードショートカットフック ✅
│   └── useTableEditor.ts       # 表編集フック 🔄
├── services/
│   ├── htmlExportService.ts    # HTML出力サービス ✅
│   ├── htmlImportService.ts    # HTML読み込みサービス ❌
│   └── tableService.ts         # 表操作サービス 🔄
├── types/
│   └── wordEditorTypes.ts      # TypeScript型定義 ✅
└── styles/
    └── wordEditor.css          # エディタ専用スタイル ✅
```

### 主要コンポーネント設計（統合版）

#### WordLikeEditor.tsx ✅

```typescript
interface WordLikeEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  onTableInsert?: () => void;
  onHtmlImport?: (html: string) => void;
}

interface WordLikeEditorState {
  content: string;
  formats: EditorFormats;
  isEditing: boolean;
  tableData?: TableData;
  importResult?: HtmlImportResult;
}
```

#### TableEditor.tsx 🔄

```typescript
interface TableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
  onCellMerge: (merge: CellMerge) => void;
  onCellSplit: (row: number, col: number) => void;
}

interface TableEditorState {
  selectedCell: { row: number; col: number };
  isEditing: boolean;
  isSelecting: boolean;
  selectionStart?: { row: number; col: number };
}
```

#### HtmlImporter.tsx ❌

```typescript
interface HtmlImporterProps {
  onImport: (content: string) => void;
  onImportError: (error: string) => void;
}

interface HtmlImporterState {
  isImporting: boolean;
  progress: number;
  importResult?: HtmlImportResult;
}
```

### キーボードショートカット実装（統合版）

```typescript
const keyboardHandlers = {
  "ctrl+b": (quill: Quill) => {
    // 太字切り替え ✅
  },
  "ctrl+u": (quill: Quill) => {
    // 下線切り替え ✅
  },
  "ctrl+t": (quill: Quill) => {
    // 表挿入 ✅
  },
  "ctrl+shift+up": (quill: Quill) => {
    // 表の上に行追加 ✅
  },
  "ctrl+shift+down": (quill: Quill) => {
    // 表の下に行追加 ✅
  },
  "ctrl+shift+left": (quill: Quill) => {
    // 表の左に列追加 ✅
  },
  "ctrl+shift+right": (quill: Quill) => {
    // 表の右に列追加 ✅
  },
  tab: (quill: Quill) => {
    // 表の次のセルに移動 ❌
  },
  "shift+tab": (quill: Quill) => {
    // 表の前のセルに移動 ❌
  },
};
```

### HTML 読み込み・出力サービス（統合版）

```typescript
class HtmlImportService {
  parseHtml(html: string): HtmlImportResult {
    // HTML解析ロジック ❌
  }

  convertToDelta(content: EditorContent): Delta {
    // HTML → Delta変換ロジック ❌
  }

  parseTable(tableElement: HTMLTableElement): TableData {
    // 表の解析ロジック ❌
  }
}

class HtmlExportService {
  exportToHtml(content: EditorContent): string {
    // Delta → HTML変換ロジック ✅
  }

  exportTable(tableData: TableData): string {
    // 表のHTML出力ロジック ❌
  }
}
```

### 表操作サービス（統合版）

```typescript
class TableService {
  insertTable(rows: number, cols: number): TableData {
    // 表作成ロジック ✅
  }

  addRow(tableData: TableData, position: "above" | "below"): TableData {
    // 行追加ロジック ✅
  }

  addColumn(tableData: TableData, position: "left" | "right"): TableData {
    // 列追加ロジック ✅
  }

  deleteRow(tableData: TableData, rowIndex: number): TableData {
    // 行削除ロジック ❌
  }

  deleteColumn(tableData: TableData, colIndex: number): TableData {
    // 列削除ロジック ❌
  }

  mergeCells(
    tableData: TableData,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): TableData {
    // セル結合ロジック ❌
  }

  splitCell(tableData: TableData, row: number, col: number): TableData {
    // セル分割ロジック ❌
  }

  setTableStyle(tableData: TableData, style: Partial<TableStyles>): TableData {
    // 表スタイル設定ロジック ❌
  }
}
```

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
3. 🔄 **表の作成・編集が完全に動作する**
   - ✅ 表の挿入（Ctrl+T）
   - ✅ 行・列の追加・削除
   - ❌ セル結合・分割
   - ❌ 表スタイル設定
4. ❌ **HTML 読み込み・出力が完全に動作する**
   - ❌ 既存 HTML の完全な読み込み
   - ❌ 表の HTML 変換
   - ❌ エラーハンドリング
5. ✅ リッチテキスト編集が正常に動作する
6. ✅ 選択・編集機能が正常に動作する
7. ✅ HTML 出力が正常に動作する
8. ❌ アンドゥ・リドゥ機能が正常に動作する
9. 🔄 Word ライクな UI/UX が実現される
10. ❌ 全てのテストが通過する
11. 🔄 パフォーマンス要件を満たす

## 既存ファイルの扱い

- **既存のブロックエディタファイル**: 削除せずに保持
- **新しい Word ライクエディタ**: `frontend/src/wordEditor/`ディレクトリに作成
- **段階的移行**: 新機能は全て新しいファイルに実装
- **互換性維持**: 既存機能への影響を最小限に抑制
- **CSS 統合**: 既存 CSS を活用し、上書きではなく拡張

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

## 現在の問題と対策

### 1. 右クリックメニューの動作問題

**問題**: 見出しと強調の切り替えが正常に動作しない
**原因**: Quill.js API の使用方法が不適切
**対策**:

- `formatLine`メソッドの正しい使用方法の確認
- フォーマット状態の適切な更新
- イベントハンドラーの依存関係の修正

### 2. CSS の上書き問題

**問題**: 既存の 60%サイズが小さくなってしまった
**原因**: 新しい CSS が既存 CSS を上書き
**対策**:

- 既存 CSS の活用と拡張
- 上書きではなく追加・統合
- 段階的な CSS 統合とテスト

### 3. 機能の段階的実装

**方針**:

- 基本機能の安定化を優先
- 高リスク機能の段階的実装
- 既存コードとの互換性維持

この統合版の計画で進めてよろしいでしょうか？
