import React, { useRef, useEffect, useState } from 'react';
import { ContextMenuProps, HeadingLevel, EmphasisStyle } from '../types/wordEditorTypes';
import './ContextMenu.css';

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onHeadingChange,
  onEmphasisChange,
  onTableCreate,
  currentHeading,
  currentEmphasis,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState<'heading' | 'emphasis' | 'table'>('heading');

  // メニュー項目の定義
  const headingItems = [
    { key: 'h1' as const, label: '見出し1' },
    { key: 'h2' as const, label: '見出し2' },
    { key: 'h3' as const, label: '見出し3' },
    { key: 'p' as const, label: '通常テキスト' }
  ];

  const emphasisItems = [
    { key: 'normal' as const, label: '通常' },
    { key: 'important' as const, label: '重要' },
    { key: 'action-item' as const, label: 'アクション項目' }
  ];

  const tableItems = [
    { key: 'create' as const, label: '表を作成' }
  ];

  // 全メニュー項目を統合
  const allMenuItems = [
    ...headingItems.map(item => ({ ...item, section: 'heading' as const })),
    ...emphasisItems.map(item => ({ ...item, section: 'emphasis' as const })),
    ...tableItems.map(item => ({ ...item, section: 'table' as const }))
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // メニューが表示されている間は、すべてのキーボードイベントをエディタに送らない
      event.preventDefault();
      event.stopPropagation();

      switch (event.key) {
        case 'ArrowUp':
          const currentItemIndexUp = selectedSection === 'heading'
            ? selectedIndex
            : selectedSection === 'emphasis'
            ? headingItems.length + selectedIndex
            : headingItems.length + emphasisItems.length + selectedIndex;
          const prevItemIndex = currentItemIndexUp > 0 ? currentItemIndexUp - 1 : allMenuItems.length - 1;
          const prevItem = allMenuItems[prevItemIndex];
          setSelectedSection(prevItem.section);
          setSelectedIndex(prevItem.section === 'heading'
            ? headingItems.findIndex(item => item.key === prevItem.key)
            : prevItem.section === 'emphasis'
            ? emphasisItems.findIndex(item => item.key === prevItem.key)
            : tableItems.findIndex(item => item.key === prevItem.key)
          );
          break;
        case 'ArrowDown':
          const currentItemIndexDown = selectedSection === 'heading'
            ? selectedIndex
            : selectedSection === 'emphasis'
            ? headingItems.length + selectedIndex
            : headingItems.length + emphasisItems.length + selectedIndex;
          const nextItemIndex = currentItemIndexDown < allMenuItems.length - 1 ? currentItemIndexDown + 1 : 0;
          const nextItem = allMenuItems[nextItemIndex];
          setSelectedSection(nextItem.section);
          setSelectedIndex(nextItem.section === 'heading'
            ? headingItems.findIndex(item => item.key === nextItem.key)
            : nextItem.section === 'emphasis'
            ? emphasisItems.findIndex(item => item.key === nextItem.key)
            : tableItems.findIndex(item => item.key === nextItem.key)
          );
          break;
        case 'Tab':
          if (selectedSection === 'heading') {
            setSelectedSection('emphasis');
            setSelectedIndex(0);
          } else if (selectedSection === 'emphasis') {
            setSelectedSection('table');
            setSelectedIndex(0);
          } else {
            setSelectedSection('heading');
            setSelectedIndex(0);
          }
          break;
        case 'Enter':
          if (selectedSection === 'heading') {
            onHeadingChange(headingItems[selectedIndex].key);
          } else if (selectedSection === 'emphasis') {
            onEmphasisChange(emphasisItems[selectedIndex].key);
          } else if (selectedSection === 'table') {
            onTableCreate();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onHeadingChange, onEmphasisChange, onTableCreate, selectedIndex, selectedSection]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: '200px',
      }}
    >
      <div className="menu-section">
        <div className="menu-title">見出し</div>
        {headingItems.map((item, index) => (
          <div
            key={item.key}
            className={`menu-item ${selectedSection === 'heading' && selectedIndex === index ? 'keyboard-selected' : ''}`}
            onClick={() => onHeadingChange(item.key)}
          >
            <span className={currentHeading === item.key ? 'selected' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="menu-section">
        <div className="menu-title">強調</div>
        {emphasisItems.map((item, index) => (
          <div
            key={item.key}
            className={`menu-item ${selectedSection === 'emphasis' && selectedIndex === index ? 'keyboard-selected' : ''}`}
            onClick={() => onEmphasisChange(item.key)}
          >
            <span className={currentEmphasis === item.key ? 'selected' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="menu-section">
        <div className="menu-title">表</div>
        {tableItems.map((item, index) => (
          <div
            key={item.key}
            className={`menu-item ${selectedSection === 'table' && selectedIndex === index ? 'keyboard-selected' : ''}`}
            onClick={() => onTableCreate()}
          >
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 