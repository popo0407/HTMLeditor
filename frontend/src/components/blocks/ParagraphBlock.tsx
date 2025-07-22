/**
 * 段落ブロックコンポーネント
 * 
 * 責務:
 * - 段落テキストの表示と編集
 * - 複数行テキストの編集機能
 */

import React, { useState, useRef, useEffect } from 'react';
import { Block } from '../../types';
import { BlockBase } from './BlockBase';

interface ParagraphBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, content: string) => void;
  onDelete: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // 高さを自動調整
      adjustTextareaHeight();
    }
  }, [isEditing]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = () => {
    setIsEditing(false);
    onUpdate(block.id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(block.content);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustTextareaHeight();
  };

  return (
    <BlockBase {...props}>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="block-editable block-paragraph"
          rows={1}
        />
      ) : (
        <p 
          className="block-paragraph"
          onDoubleClick={handleDoubleClick}
        >
          {block.content || 'ここに段落テキストを入力してください'}
        </p>
      )}
    </BlockBase>
  );
};
