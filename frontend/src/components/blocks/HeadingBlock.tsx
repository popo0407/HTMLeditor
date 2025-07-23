/**
 * 見出しブロックコンポーネント
 * 
 * 責務:
 * - H1, H2, H3の見出し表示と編集
 * - インライン編集機能の提供
 */

import React, { useState, useRef, useEffect } from 'react';
import { CommonBlockProps } from '../../types';
import { BlockBase } from './BlockBase';

export const HeadingBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = () => {
    setIsEditing(false);
    onUpdate(block.id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setContent(block.content);
      setIsEditing(false);
    }
  };

  const getHeadingElement = () => {
    const className = `block-${block.type}`;
    
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className={`block-editable ${className}`}
        />
      );
    }

    const commonProps = {
      className,
      onDoubleClick: handleDoubleClick,
    };

    switch (block.type) {
      case 'heading1':
        return <h1 {...commonProps}>{block.content || '見出し1'}</h1>;
      case 'heading2':
        return <h2 {...commonProps}>{block.content || '見出し2'}</h2>;
      case 'heading3':
        return <h3 {...commonProps}>{block.content || '見出し3'}</h3>;
      default:
        return <h1 {...commonProps}>{block.content || '見出し'}</h1>;
    }
  };

  return (
    <BlockBase {...props}>
      {getHeadingElement()}
    </BlockBase>
  );
};
