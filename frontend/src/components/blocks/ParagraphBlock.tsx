/**
 * 段落ブロックコンポーネント
 * 
 * 責務:
 * - 段落テキストの表示と編集
 * - 複数行テキストの編集機能
 */

import React, { useState, useRef, useEffect } from 'react';
import { CommonBlockProps } from '../../types';
import { BlockBase } from './BlockBase';

export const ParagraphBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate, isSelected } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const isInitialFocusRef = useRef<boolean>(false);

  // フォーカス状態が変更されたら編集モードに入る（ちらつき防止）
  useEffect(() => {
    const now = Date.now();
    if (isSelected && !isEditing && (now - lastFocusTimeRef.current) > 50) {
      lastFocusTimeRef.current = now;
      setIsEditing(true);
      isInitialFocusRef.current = true;
    } else if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current && isInitialFocusRef.current) {
      textareaRef.current.focus();
      // カーソルをテキスト末端に移動
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
      // 高さを自動調整
      adjustTextareaHeight();
      isInitialFocusRef.current = false;
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
    // 上下キーでブロック間移動（カーソル位置に関係なく）
    if (e.key === 'ArrowUp' && props.onMoveUp) {
      e.preventDefault();
      props.onMoveUp(block.id);
    }
    if (e.key === 'ArrowDown' && props.onMoveDown) {
      e.preventDefault();
      props.onMoveDown(block.id);
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
          onClick={handleClick}
          style={{ cursor: 'text' }}
        >
          {block.content || 'ここに段落テキストを入力してください'}
        </p>
      )}
    </BlockBase>
  );
};
