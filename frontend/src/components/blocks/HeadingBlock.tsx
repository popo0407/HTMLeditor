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
import { BlockType, BlockStyle } from '../../types';

export const HeadingBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate, isSelected } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (isEditing && inputRef.current && isInitialFocusRef.current) {
      inputRef.current.focus();
      // カーソルをテキスト末端に移動
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
      isInitialFocusRef.current = false;
    }
  }, [isEditing]);

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
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
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
    // Ctrl+Space: ブロックタイプ切り替え
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // 現在のブロックタイプを取得して次のタイプに切り替え
      const blockTypeOrder: BlockType[] = ['heading1', 'heading2', 'heading3', 'paragraph'];
      const currentIndex = blockTypeOrder.indexOf(block.type);
      const nextIndex = (currentIndex + 1) % blockTypeOrder.length;
      const nextType = blockTypeOrder[nextIndex];
      // ブロックタイプ変更のコールバックを呼ぶ（コンテンツは保持）
      if (props.onTypeChange) {
        props.onTypeChange(block.id, nextType);
      }
    }
    // Shift+Space: 強調切り替え
    if (e.shiftKey && e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // 現在の強調状態を取得して次の状態に切り替え
      const blockStyleOrder: BlockStyle[] = ['normal', 'important', 'action-item'];
      const currentStyle = block.style || 'normal';
      const currentIndex = blockStyleOrder.indexOf(currentStyle);
      const nextIndex = (currentIndex + 1) % blockStyleOrder.length;
      const nextStyle = blockStyleOrder[nextIndex];
      // 強調変更のコールバックを呼ぶ
      if (props.onStyleChange) {
        props.onStyleChange(block.id, nextStyle);
      }
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
      onClick: handleClick,
      style: { cursor: 'text' }
    };

    switch (block.type) {
      case 'heading1':
        return <h1 {...commonProps}>{block.content}</h1>;
      case 'heading2':
        return <h2 {...commonProps}>{block.content}</h2>;
      case 'heading3':
        return <h3 {...commonProps}>{block.content}</h3>;
      default:
        return <h1 {...commonProps}>{block.content}</h1>;
    }
  };

  return (
    <BlockBase {...props}>
      {getHeadingElement()}
    </BlockBase>
  );
};
