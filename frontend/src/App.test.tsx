/**
 * フェーズ2機能テスト用ファイル
 * 
 * 実装された機能の動作確認を行います
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// 基本的なレンダリングテスト
test('アプリケーションが正常にレンダリングされる', () => {
  render(<App />);
  
  // ヘッダーの確認
  expect(screen.getByText('HTML Editor')).toBeInTheDocument();
  
  // サイドバーの確認
  expect(screen.getByText('コンテンツ')).toBeInTheDocument();
  expect(screen.getByText('ブロックを追加')).toBeInTheDocument();
  expect(screen.getByText('メール送信')).toBeInTheDocument();
  
  // エディタエリアの確認
  expect(screen.getByText('コンテンツを作成しましょう')).toBeInTheDocument();
});

// ブロック追加ボタンのテスト
test('ブロック追加ボタンが表示される', () => {
  render(<App />);
  
  // サイドバーの各ブロック追加ボタンを確認
  expect(screen.getByText('➕ 大見出し')).toBeInTheDocument();
  expect(screen.getByText('➕ 中見出し')).toBeInTheDocument();
  expect(screen.getByText('➕ 小見出し')).toBeInTheDocument();
  expect(screen.getByText('➕ 段落')).toBeInTheDocument();
  expect(screen.getByText('➕ 箇条書き')).toBeInTheDocument();
  expect(screen.getByText('➕ 画像')).toBeInTheDocument();
  expect(screen.getByText('➕ テーブル')).toBeInTheDocument();
  expect(screen.getByText('➕ 水平線')).toBeInTheDocument();
});

// 削除: export default App は不要
