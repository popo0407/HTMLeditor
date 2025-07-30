/**
 * プレビュー管理カスタムフック
 * 
 * 責務:
 * - プレビューモードの状態管理
 * - プレビューHTMLの生成
 * - プレビュー表示の制御
 * 
 * 開発憲章の「関心の分離」に従い、プレビュー機能の状態をコンポーネントから分離
 */

import { useState, useCallback } from 'react';
import { Block } from '../types';
import { HtmlGenerator } from '../utils/htmlGenerator';

export interface UsePreviewManagerReturn {
  isPreviewMode: boolean;
  previewHtml: string;
  togglePreviewMode: () => void;
  generatePreview: (blocks: Block[]) => Promise<string>;
  setPreviewMode: (mode: boolean) => void;
}

export const usePreviewManager = (): UsePreviewManagerReturn => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  /**
   * プレビューモードの切り替え
   */
  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  /**
   * プレビューモードの設定
   */
  const setPreviewMode = useCallback((mode: boolean) => {
    setIsPreviewMode(mode);
  }, []);

  /**
   * プレビューHTMLの生成
   */
  const generatePreview = useCallback(async (blocks: Block[]): Promise<string> => {
    try {
      const html = HtmlGenerator.generatePreviewHtml(blocks);
      setPreviewHtml(html);
      return html;
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      const fallbackHtml = '<div>プレビューの生成に失敗しました</div>';
      setPreviewHtml(fallbackHtml);
      return fallbackHtml;
    }
  }, []);

  return {
    isPreviewMode,
    previewHtml,
    togglePreviewMode,
    generatePreview,
    setPreviewMode
  };
}; 