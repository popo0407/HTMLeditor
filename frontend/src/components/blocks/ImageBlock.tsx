/**
 * 画像ブロックコンポーネント
 * 
 * 責務:
 * - 画像の表示
 * - クリップボード画像貼り付け機能
 * - 画像のドラッグ&ドロップ
 */

import React, { useState, useRef } from 'react';
import { CommonBlockProps } from '../../types';
import { BlockBase } from './BlockBase';

export const ImageBlock: React.FC<CommonBlockProps> = (props) => {
  const { block, onUpdate } = props;
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像ファイルをData URLに変換
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 画像ソースを更新
  const updateImageSrc = (src: string, alt?: string) => {
    // blockのsrcプロパティを更新
    const updatedBlock = {
      ...block,
      src: src,
      content: alt || block.content || 'Image'
    };
    onUpdate(block.id, JSON.stringify(updatedBlock));
  };

  // クリップボードから画像を貼り付け
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'clipboard-image.png', { type });
            const dataURL = await fileToDataURL(file);
            updateImageSrc(dataURL, 'クリップボードからの画像');
            return;
          }
        }
      }
      alert('クリップボードに画像が見つかりませんでした');
    } catch (error) {
      console.error('クリップボード読み取りエラー:', error);
      alert('クリップボードから画像を読み取れませんでした');
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const dataURL = await fileToDataURL(imageFile);
      updateImageSrc(dataURL, imageFile.name);
    } else {
      alert('画像ファイルをドロップしてください');
    }
  };

  // ファイル選択処理
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const dataURL = await fileToDataURL(file);
      updateImageSrc(dataURL, file.name);
    }
  };

  return (
    <BlockBase {...props}>
      <div className="block-image">
        {block.src ? (
          <div className="image-container">
            <img 
              src={block.src} 
              alt={block.content || 'Image'} 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
            />
            <div className="image-controls">
              <button 
                className="btn btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 ファイル選択
              </button>
              <button 
                className="btn btn-sm"
                onClick={handlePasteFromClipboard}
              >
                📋 クリップボードから貼り付け
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => updateImageSrc('', '')}
              >
                🗑 画像削除
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`image-placeholder ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="placeholder-content">
              <p>📷 画像ブロック</p>
              <p>画像をドラッグ&ドロップするか、下のボタンから選択してください</p>
              <div className="image-upload-controls">
                <button 
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 ファイルを選択
                </button>
                <button 
                  className="btn"
                  onClick={handlePasteFromClipboard}
                >
                  📋 クリップボードから貼り付け
                </button>
              </div>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>
    </BlockBase>
  );
};
