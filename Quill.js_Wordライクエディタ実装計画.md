# Quill.js ベース Word ライクエディタ 実装計画

## プロジェクト概要

### 目的

Microsoft Word のような直感的な操作感を持つリッチテキストエディタを、Quill.js をベースに実装する。

### 基本方針

- **Quill.js**をベースとして、カスタムキーボードショートカットを実装
- **Ctrl+Space**: 見出しレベル切り替え
- **Shift+Space**: 強調スタイル切り替え
- **表機能**: テーブル作成・編集機能
- **HTML 読み出し機能**: 既存 HTML からの読み込み機能維持
- シンプルで直感的な UI/UX

## 機能要件

### F-001: 基本編集機能

#### F-001-1: テキスト入力・編集

- 通常のテキスト入力が可能
- カーソル移動、選択、削除が正常に動作
- リアルタイムでの編集内容反映

#### F-001-2: 見出し機能

- **Ctrl+Space**: 現在の行の見出しレベルを切り替え
  - 段落 → 小見出し → 中見出し → 大見出し → 段落
- 見出しレベルの視覚的表示
- 見出しレベルに応じたフォントサイズ・太さの自動調整

#### F-001-3: 強調機能

- **Shift+Space**: 現在の行の強調スタイルを切り替え
  - 通常 → 重要 → アクションアイテム → 通常
- 強調スタイルの視覚的表示（背景色、ボーダー等）
- 強調スタイルに応じた色分け

#### F-001-4: インライン書式設定

- **太字**: Ctrl+B
- **下線**: Ctrl+U

### F-002: 表機能

#### F-002-1: 表作成・編集

- **表挿入**: ツールバーボタンまたはショートカットキー
- **行・列の追加・削除**: コンテキストメニューまたはショートカットキー
- **セル編集**: 直接編集可能
- **表書式**: 見出し行、見出し列の設定

#### F-002-2: 表操作

- **セル選択**: マウスクリックまたはキーボード操作
- **セル結合・分割**: コンテキストメニュー
- **表の移動**: ドラッグ&ドロップ
- **表の削除**: 削除確認付き

#### F-002-3: 表スタイル

- **強調表示対応**: 表全体に強調スタイル適用
- **見出し行・列の視覚的表示**
- **境界線・背景色の設定**

### F-003: HTML 読み出し機能

#### F-003-1: HTML 解析・読み込み

- **既存 HTML ファイルの読み込み**: ファイル選択またはドラッグ&ドロップ
- **HTML 解析**: 見出し、段落、表、強調表示の認識
- **Quill.js 形式への変換**: HTML から Quill.js の Delta 形式への変換
- **書式情報の保持**: 見出しレベル、強調スタイル、表構造の維持

#### F-003-2: データ変換

- **HTML → Delta 変換**: 既存の HTML 構造を Quill.js の Delta 形式に変換
- **Delta → HTML 変換**: 編集内容を HTML 形式で出力
- **書式情報のマッピング**: 見出し、強調、表の書式情報を適切に変換

### F-004: 段落書式設定

#### F-004-1: 箇条書きインデント

- 箇条書きのインデント機能

### F-005: 選択・編集機能

#### F-005-1: マウス選択

- ドラッグによるテキスト選択

#### F-005-2: キーボード選択

- Shift+矢印キーによる選択範囲拡張
- Ctrl+A による全選択
- Home/End による行頭/行末移動

### F-006: コピー・ペースト機能

#### F-006-1: リッチテキストコピー

- 書式情報を含むコピー

#### F-006-2: ペースト機能

- プレーンテキストペースト

### F-007: アンドゥ・リドゥ機能

#### F-007-1: ショートカットキー

- **Ctrl+Z**: アンドゥ
- **Ctrl+Y**: リドゥ

### F-008: 保存・出力機能

#### F-008-1: HTML 出力

- 編集内容を HTML ファイルとして保存
- 見出し、強調表示、表、書式情報の HTML への反映
- 自己完結型 HTML ファイル生成

### F-009: UI/UX 機能

#### F-009-1: ツールバー

- 保存・出力ボタン
- 表挿入ボタン
- HTML 読み込みボタン

## 非機能要件

### NF-001: パフォーマンス

- キーボード操作の応答時間 < 50ms
- 1000 行程度の文書での編集速度維持
- メモリ使用量の最適化

### NF-002: ブラウザ対応

- Edge 90+

### NF-003: アクセシビリティ

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 高コントラストモード対応

## 技術仕様

### 使用技術

- **React 18**
- **TypeScript 4.9+**
- **Quill.js 1.3.7**
- **react-quill 2.0.0**

### データ構造

```typescript
interface EditorContent {
  html: string;
  text: string;
  formats: {
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
    };
  };
}

interface TableData {
  rows: string[][];
  hasHeaderRow: boolean;
  hasHeaderColumn: boolean;
}
```

### キーボードショートカット定義

```typescript
interface KeyboardShortcuts {
  "ctrl+space": "heading-toggle";
  "shift+space": "emphasis-toggle";
  "ctrl+b": "bold";
  "ctrl+u": "underline";
  "ctrl+z": "undo";
  "ctrl+y": "redo";
  "ctrl+t": "table-insert";
}
```

---

# 実装計画

## 開発憲章準拠

- **単一責任の原則**: 各機能が明確な責務を持つ
- **関心の分離**: UI 操作とビジネスロジックの分離
- **設定とロジックの分離**: キーボードショートカット設定の外部化
- **リスクベースアプローチ**: 影響範囲に応じた実装手順の調整

## 実装段階

### 第 1 段階: 基盤構築（高リスク）

**目標**: Quill.js の基本セットアップとカスタムキーボードショートカット実装
**期間**: 3 日
**完了予定**: 2024 年 12 月

#### タスク

1. **新しいディレクトリ構造作成**

   ```
   frontend/src/
   ├── wordEditor/
   │   ├── components/
   │   │   ├── WordLikeEditor.tsx
   │   │   ├── EditorToolbar.tsx
   │   │   ├── TableEditor.tsx
   │   │   └── HtmlImporter.tsx
   │   ├── hooks/
   │   │   ├── useWordEditor.ts
   │   │   ├── useKeyboardShortcuts.ts
   │   │   └── useTableEditor.ts
   │   ├── services/
   │   │   ├── wordEditorService.ts
   │   │   ├── htmlExportService.ts
   │   │   ├── htmlImportService.ts
   │   │   └── tableService.ts
   │   ├── types/
   │   │   └── wordEditorTypes.ts
   │   └── styles/
   │       └── wordEditor.css
   ```

2. **Quill.js セットアップ**

   - `react-quill`のインストール
   - 基本的なエディタコンポーネント実装
   - TypeScript 型定義の作成

3. **カスタムキーボードショートカット実装**
   - Ctrl+Space（見出し切り替え）
   - Shift+Space（強調切り替え）
   - Ctrl+B（太字）
   - Ctrl+U（下線）

#### 成果物

- 基本的な Quill.js エディタ
- カスタムキーボードショートカット機能
- TypeScript 型定義

### 第 2 段階: 見出し・強調機能（中リスク）

**目標**: 見出しレベルと強調スタイルの切り替え機能
**期間**: 2 日
**完了予定**: 2024 年 12 月

#### タスク

1. **見出し機能実装**

   - 見出しレベルの切り替えロジック
   - 視覚的フィードバック
   - フォントサイズ・太さの自動調整

2. **強調機能実装**

   - 強調スタイルの切り替えロジック
   - 背景色・ボーダーの視覚的表示
   - 色分けシステム

3. **HTML 出力対応**
   - 見出し・強調情報の HTML 反映
   - 自己完結型 HTML ファイル生成

#### 成果物

- 見出しレベル切り替え機能
- 強調スタイル切り替え機能
- HTML 出力機能

### 第 3 段階: 表機能実装（中リスク）

**目標**: 表の作成・編集機能
**期間**: 3 日
**完了予定**: 2024 年 12 月

#### タスク

1. **表作成機能**

   - 表挿入機能（Ctrl+T）
   - 行・列の追加・削除
   - セル編集機能

2. **表操作機能**

   - セル選択・移動
   - セル結合・分割
   - 表の移動・削除

3. **表スタイル機能**
   - 見出し行・列の設定
   - 強調表示対応
   - 境界線・背景色設定

#### 成果物

- 表作成・編集機能
- 表操作機能
- 表スタイル機能

### 第 4 段階: HTML 読み出し機能（中リスク）

**目標**: 既存 HTML からの読み込み機能
**期間**: 2 日
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

3. **UI 統合**
   - ファイル選択 UI
   - ドラッグ&ドロップ対応
   - 読み込み進捗表示

#### 成果物

- HTML 読み込み機能
- データ変換機能
- UI 統合

### 第 5 段階: 編集機能強化（中リスク）

**目標**: 選択・編集機能とアンドゥ・リドゥ機能
**期間**: 2 日
**完了予定**: 2024 年 12 月

#### タスク

1. **選択・編集機能**

   - マウス選択機能
   - キーボード選択機能
   - テキスト操作の最適化

2. **アンドゥ・リドゥ機能**

   - 編集履歴の管理
   - Ctrl+Z, Ctrl+Y 対応
   - 履歴サイズの最適化

3. **コピー・ペースト機能**
   - リッチテキストコピー
   - プレーンテキストペースト

#### 成果物

- 高度な選択・編集機能
- アンドゥ・リドゥ機能
- コピー・ペースト機能

### 第 6 段階: UI/UX 改善（低リスク）

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

## 技術実装詳細

### ファイル構造

```
frontend/src/wordEditor/
├── components/
│   ├── WordLikeEditor.tsx      # メインエディタコンポーネント
│   ├── EditorToolbar.tsx       # ツールバーコンポーネント
│   ├── TableEditor.tsx         # 表編集コンポーネント
│   └── HtmlImporter.tsx        # HTML読み込みコンポーネント
├── hooks/
│   ├── useWordEditor.ts        # エディタ状態管理フック
│   ├── useKeyboardShortcuts.ts # キーボードショートカットフック
│   └── useTableEditor.ts       # 表編集フック
├── services/
│   ├── wordEditorService.ts    # エディタビジネスロジック
│   ├── htmlExportService.ts    # HTML出力サービス
│   ├── htmlImportService.ts    # HTML読み込みサービス
│   └── tableService.ts         # 表操作サービス
├── types/
│   └── wordEditorTypes.ts      # TypeScript型定義
└── styles/
    └── wordEditor.css          # エディタ専用スタイル
```

### 主要コンポーネント設計

#### WordLikeEditor.tsx

```typescript
interface WordLikeEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
}

interface WordLikeEditorState {
  content: string;
  formats: EditorFormats;
  isEditing: boolean;
  tableData?: TableData;
}
```

#### TableEditor.tsx

```typescript
interface TableEditorProps {
  tableData: TableData;
  onTableChange: (tableData: TableData) => void;
  onTableDelete: () => void;
}

interface TableEditorState {
  selectedCell: { row: number; col: number };
  isEditing: boolean;
}
```

#### HtmlImporter.tsx

```typescript
interface HtmlImporterProps {
  onImport: (content: string) => void;
}

interface HtmlImporterState {
  isImporting: boolean;
  progress: number;
}
```

### キーボードショートカット実装

```typescript
const keyboardHandlers = {
  "ctrl+space": (quill: Quill) => {
    // 見出し切り替えロジック
  },
  "shift+space": (quill: Quill) => {
    // 強調切り替えロジック
  },
  "ctrl+b": (quill: Quill) => {
    // 太字切り替え
  },
  "ctrl+u": (quill: Quill) => {
    // 下線切り替え
  },
  "ctrl+t": (quill: Quill) => {
    // 表挿入
  },
};
```

### HTML 読み込み・出力サービス

```typescript
class HtmlImportService {
  parseHtml(html: string): EditorContent {
    // HTML解析ロジック
  }

  convertToDelta(content: EditorContent): Delta {
    // HTML → Delta変換ロジック
  }
}

class HtmlExportService {
  exportToHtml(content: EditorContent): string {
    // Delta → HTML変換ロジック
  }
}
```

### 表操作サービス

```typescript
class TableService {
  insertTable(rows: number, cols: number): TableData {
    // 表作成ロジック
  }

  addRow(tableData: TableData): TableData {
    // 行追加ロジック
  }

  addColumn(tableData: TableData): TableData {
    // 列追加ロジック
  }

  deleteRow(tableData: TableData, rowIndex: number): TableData {
    // 行削除ロジック
  }

  deleteColumn(tableData: TableData, colIndex: number): TableData {
    // 列削除ロジック
  }
}
```

## 成功指標

### 定量的指標

- キーボード操作の応答時間 < 50ms
- 文書サイズ 1000 行での編集速度維持
- メモリ使用量 < 40MB
- HTML 読み込み時間 < 2 秒（1000 行程度）

### 定性的指標

- Word ライクな直感的な操作感
- スムーズな見出し・強調切り替え
- 直感的な表操作
- 既存 HTML との互換性

## 完了条件

1. Ctrl+Space で見出しレベルが正常に切り替わる
2. Shift+Space で強調スタイルが正常に切り替わる
3. 表の作成・編集が正常に動作する
4. HTML 読み込み・出力が正常に動作する
5. リッチテキスト編集が正常に動作する
6. 選択・編集機能が正常に動作する
7. HTML 出力が正常に動作する
8. アンドゥ・リドゥ機能が正常に動作する
9. Word ライクな UI/UX が実現される
10. 全てのテストが通過する
11. パフォーマンス要件を満たす

## 既存ファイルの扱い

- **既存のブロックエディタファイル**: 削除せずに保持
- **新しい Word ライクエディタ**: `frontend/src/wordEditor/`ディレクトリに作成
- **段階的移行**: 新機能は全て新しいファイルに実装
- **互換性維持**: 既存機能への影響を最小限に抑制

## リスク管理

### 高リスク項目

- Quill.js とカスタム機能の統合
- HTML 解析・変換の複雑性
- 表機能の実装

### 対策

- 段階的実装による影響範囲限定
- 十分なテスト実施
- 既存コードとの分離

この計画で進めてよろしいでしょうか？
