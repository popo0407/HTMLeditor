import React from 'react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-content">
        <h3>サイドバー</h3>
        {/* サイドバーの内容をここに追加 */}
      </div>
    </div>
  );
}; 