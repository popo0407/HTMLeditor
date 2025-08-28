import React, { useRef, useState } from 'react';
import { HtmlImportService } from '../services/htmlImportService';
import { HtmlExportService } from '../services/htmlExportService';

interface FileOperationsProps {
  onContentLoad: (content: string) => void;
  onExport: (content: string) => void;
  currentContent: string;
}

export const FileOperations: React.FC<FileOperationsProps> = ({
  onContentLoad,
  onExport,
  currentContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await HtmlImportService.loadWithErrorHandling(file);
      
      if (result.success && result.content) {
        onContentLoad(result.content);
      } else {
        setError(result.error || 'ファイルの読み込みに失敗しました');
      }
    } catch (err) {
      setError('ファイルの読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async (format: 'html' | 'text') => {
    try {
      await HtmlExportService.exportWithOptions(currentContent, {
        format,
        filename: `document.${format === 'html' ? 'html' : 'txt'}`,
        title: 'エクスポートされたドキュメント',
      });
    } catch (err) {
      setError('エクスポート中にエラーが発生しました');
    }
  };

  const handleCopyToClipboard = async (format: 'html' | 'text') => {
    try {
      await HtmlExportService.copyToClipboard(currentContent, format);
      // 成功メッセージを表示（実際の実装ではトースト通知など）
      console.log(`${format === 'html' ? 'HTML' : 'テキスト'}をクリップボードにコピーしました`);
    } catch (err) {
      setError('クリップボードへのコピーに失敗しました');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setIsLoading(true);
      setError(null);

      try {
        const result = await HtmlImportService.loadWithErrorHandling(file);
        
        if (result.success && result.content) {
          onContentLoad(result.content);
        } else {
          setError(result.error || 'ファイルの読み込みに失敗しました');
        }
      } catch (err) {
        setError('ファイルの読み込み中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="file-operations">
      <div className="file-operations-section">
        <h3>ファイル操作</h3>
        
        {/* ファイル読み込み */}
        <div className="file-import">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="file-button"
          >
            {isLoading ? '読み込み中...' : 'HTMLファイルを読み込み'}
          </button>
        </div>

        {/* ドラッグ&ドロップエリア */}
        <div
          className="drag-drop-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>または、HTMLファイルをここにドラッグ&ドロップ</p>
        </div>

        {/* エクスポート */}
        <div className="file-export">
          <h4>エクスポート</h4>
          <div className="export-buttons">
            <button
              onClick={() => handleExport('html')}
              className="export-button html"
            >
              HTMLとしてダウンロード
            </button>
            <button
              onClick={() => handleExport('text')}
              className="export-button text"
            >
              テキストとしてダウンロード
            </button>
          </div>
        </div>

        {/* クリップボード */}
        <div className="clipboard-operations">
          <h4>クリップボード</h4>
          <div className="clipboard-buttons">
            <button
              onClick={() => handleCopyToClipboard('html')}
              className="clipboard-button html"
            >
              HTMLをコピー
            </button>
            <button
              onClick={() => handleCopyToClipboard('text')}
              className="clipboard-button text"
            >
              テキストをコピー
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>閉じる</button>
          </div>
        )}
      </div>
    </div>
  );
}; 