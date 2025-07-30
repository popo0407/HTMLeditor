/**
 * プレビュー管理カスタムフック
 * 
 * 責務:
 * - プレビューHTMLの生成と管理
 * - プレビュー状態の管理
 * - プレビュー生成エラーの処理
 * 
 * 開発憲章の「関心の分離」と「単一責任の原則」に従う
 */

import { useState, useEffect, useCallback } from 'react';
import { Block } from '../types';
import { clipboardService } from '../services/clipboardService';

export interface UsePreviewManagerReturn {
  previewHtml: string;
  isGenerating: boolean;
  error: string | null;
  regeneratePreview: () => Promise<void>;
}

/**
 * プレビュー管理のカスタムフック
 * 
 * 開発憲章の「単一責任の原則」に従い、
 * プレビュー生成に特化した責務のみを持つ
 */
export const usePreviewManager = (blocks: Block[]): UsePreviewManagerReturn => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * プレビューHTMLを生成
   */
  const generatePreview = useCallback(async () => {
    if (blocks.length === 0) {
      setPreviewHtml('');
      setError(null);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const html = await clipboardService.blocksToPreviewHtml(blocks);
      setPreviewHtml(html);
    } catch (err) {
      console.error('プレビューHTML生成エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(errorMessage);
      setPreviewHtml('<p>プレビューの生成に失敗しました</p>');
    } finally {
      setIsGenerating(false);
    }
  }, [blocks]);

  /**
   * プレビューを再生成
   */
  const regeneratePreview = useCallback(async () => {
    await generatePreview();
  }, [generatePreview]);

  // ブロックが変更されたらプレビューを自動生成
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return {
    previewHtml,
    isGenerating,
    error,
    regeneratePreview,
  };
}; 