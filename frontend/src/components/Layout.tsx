/**
 * アプリケーションのメインレイアウト
 * 
 * 責務:
 * - 画面全体の構造を定義
 * - ヘッダー、サイドバー、メインエリアの配置
 * 
 * 要件 F-007-1: 左側にサイドバーを配置
 * 要件 F-007-2: メインエリアは「編集」と「プレビュー」のタブ切り替え式
 */

import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, header }) => {
  return (
    <div className="layout">
      {header && (
        <header className="layout-header">
          {header}
        </header>
      )}
      
      <div className="layout-body">
        <aside className="layout-sidebar">
          {sidebar}
        </aside>
        
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
};
