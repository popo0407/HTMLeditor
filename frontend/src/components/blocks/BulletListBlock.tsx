/**
 * 箇条書きブロックコンポーネント
 * 
 * 責務:
 * - 箇条書きリストの表示と編集
 * - 項目の追加・削除機能
 */

import React, { useState, useRef, useEffect } from 'react';
import { CommonBlockProps } from '../../types';
import { BlockBase } from './BlockBase';

export const BulletListBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // カーソルをテキスト末端に移動
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
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

  const handleClick = () => {
    // シングルクリックで編集モードに入り、カーソルをテキスト末端に移動
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

  // 箇条書きの表示用に改行で分割してリスト化
  const renderBulletList = () => {
    const items = (block.content || '新しいリスト項目').split('\n').filter(item => item.trim());
    
    return (
      <ul 
        className="block-bullet-list" 
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
        style={{ cursor: 'text' }}
      >
        {items.map((item, index) => (
          <li key={index}>{item.replace(/^[•\-*]\s*/, '')}</li>
        ))}
      </ul>
    );
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
          className="block-editable block-bullet-list"
          placeholder="項目を改行で区切って入力"
          rows={1}
        />
      ) : (
        renderBulletList()
      )}
    </BlockBase>
  );
};
