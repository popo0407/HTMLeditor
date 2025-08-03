import { useCallback } from 'react';
import { HeadingLevel, EmphasisStyle, Quill } from '../types/wordEditorTypes';

export interface UseEditorFormattingProps {
  quillRef: React.RefObject<any>;
}

export interface UseEditorFormattingReturn {
  getCurrentHeading: () => HeadingLevel;
  getCurrentEmphasis: () => EmphasisStyle;
  applyHeading: (level: HeadingLevel, savedSelection?: any) => void;
  applyEmphasis: (style: EmphasisStyle, savedSelection?: any) => void;
  resetLineFormatting: () => void;
}

export const useEditorFormatting = ({ quillRef }: UseEditorFormattingProps): UseEditorFormattingReturn => {
  
  // 現在の見出しレベルを取得
  const getCurrentHeading = useCallback((): HeadingLevel => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (selection) {
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const format = quill.getFormat(lineStart, 1);
          const headerLevel = format.header;
          if (headerLevel) {
            return `h${headerLevel}` as HeadingLevel;
          }
        }
      }
    }
    return 'p';
  }, [quillRef]);

  // 現在の強調スタイルを取得
  const getCurrentEmphasis = useCallback((): EmphasisStyle => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (selection) {
        const [line] = quill.getLine(selection.index);
        if (line) {
          const lineStart = line.offset();
          const format = quill.getFormat(lineStart, 1);
          return (format.class as EmphasisStyle) || 'normal';
        }
      }
    }
    return 'normal';
  }, [quillRef]);

  // 見出しを適用
  const applyHeading = useCallback((level: HeadingLevel, savedSelection?: any) => {
    console.log('applyHeading called with level:', level);
    if (!quillRef.current) {
      console.log('quillRef.current is null');
      return;
    }
    
    const quill = quillRef.current.getEditor();
    let selection = savedSelection || quill.getSelection();
    
    if (!selection) {
      console.log('No selection found');
      return;
    }

    const [line] = quill.getLine(selection.index);
    if (!line) {
      console.log('No line found');
      return;
    }

    const lineStart = line.offset();
    const lineLength = line.length();

    console.log('Applying heading:', {
      level,
      lineStart,
      lineLength,
      selection
    });

    // 行全体を選択
    quill.setSelection(lineStart, lineLength);

    // 見出しレベルを設定
    if (level === 'p') {
      quill.formatLine(lineStart, lineLength, 'header', false);
    } else {
      const headerLevel = parseInt(level.charAt(1));
      quill.formatLine(lineStart, lineLength, 'header', headerLevel);
    }

    // エディタにフォーカスを戻す
    quill.focus();
    
    // カーソルを該当行の文末に移動して全選択を解除
    const lineEnd = lineStart + lineLength;
    quill.setSelection(lineEnd, 0);
    
    console.log('Heading applied successfully');
  }, [quillRef]);

  // 強調スタイルを適用
  const applyEmphasis = useCallback((style: EmphasisStyle, savedSelection?: any) => {
    console.log('applyEmphasis called with style:', style);
    if (!quillRef.current) {
      console.log('quillRef.current is null');
      return;
    }
    
    const quill = quillRef.current.getEditor();
    let selection = savedSelection || quill.getSelection();
    
    if (!selection) {
      console.log('No selection found');
      return;
    }

    const [line] = quill.getLine(selection.index);
    if (!line) {
      console.log('No line found');
      return;
    }

    const lineStart = line.offset();
    const lineLength = line.length();

    console.log('Applying emphasis:', {
      style,
      lineStart,
      lineLength,
      selection
    });

    // 行全体を選択
    quill.setSelection(lineStart, lineLength);

    // 強調スタイルを設定
    if (style === 'normal') {
      quill.formatLine(lineStart, lineLength, 'class', false);
      quill.formatText(lineStart, lineLength, 'color', false);
      // クラス・色もDOMから消す
      const lineElement = quill.getLine(lineStart)[0]?.domNode;
      if (lineElement) {
        lineElement.classList.remove('important', 'action-item');
        lineElement.style.color = '';
      }
    } else {
      quill.formatLine(lineStart, lineLength, 'class', style);
      if (style === 'important') {
        quill.formatText(lineStart, lineLength, 'color', '#d97706');
      } else if (style === 'action-item') {
        quill.formatText(lineStart, lineLength, 'color', '#2563eb');
      }
    }

    // エディタにフォーカスを戻す
    quill.focus();
    
    // カーソルを該当行の文末に移動して全選択を解除
    const lineEnd = lineStart + lineLength;
    quill.setSelection(lineEnd, 0);
    
    console.log('Emphasis applied successfully');
  }, [quillRef]);

  // 行のフォーマットをリセット
  const resetLineFormatting = useCallback(() => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    
    if (!selection) return;

    const [line] = quill.getLine(selection.index);
    if (!line) return;

    const lineStart = line.offset();
    const lineLength = line.length();
    
    // 見出しと強調の両方を強制的にリセット
    quill.formatLine(lineStart, lineLength, 'header', false);
    quill.formatLine(lineStart, lineLength, 'class', false);
    quill.formatText(lineStart, lineLength, 'color', false);
    
    // CSSクラスを強制的に削除
    const lineElement = quill.getLine(lineStart)[0]?.domNode;
    if (lineElement) {
      lineElement.classList.remove('important', 'action-item');
      lineElement.style.color = '';
    }
  }, [quillRef]);

  return {
    getCurrentHeading,
    getCurrentEmphasis,
    applyHeading,
    applyEmphasis,
    resetLineFormatting
  };
}; 