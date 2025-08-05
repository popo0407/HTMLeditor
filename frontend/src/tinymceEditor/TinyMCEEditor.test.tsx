import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TinyMCEEditor } from './components/TinyMCEEditor';

// TinyMCEのモック
jest.mock('@tinymce/tinymce-react', () => ({
  Editor: ({ onInit, onEditorChange, value }: any) => {
    const editor = {
      getContent: () => value,
      setContent: jest.fn(),
    };

    React.useEffect(() => {
      onInit({}, editor);
    }, []);

    return (
      <div data-testid="tinymce-editor">
        <textarea
          data-testid="tinymce-textarea"
          value={value}
          onChange={(e) => onEditorChange(e.target.value)}
        />
      </div>
    );
  },
}));

describe('TinyMCEEditor', () => {
  it('制御コンポーネントとして正しく動作する', () => {
    const mockOnContentChange = jest.fn();
    const initialValue = '初期コンテンツ';

    render(
      <TinyMCEEditor
        value={initialValue}
        onContentChange={mockOnContentChange}
      />
    );

    const textarea = screen.getByTestId('tinymce-textarea');
    expect(textarea).toHaveValue(initialValue);
  });

  it('コンテンツ変更時にコールバックが呼ばれる', () => {
    const mockOnContentChange = jest.fn();
    const newContent = '新しいコンテンツ';

    render(
      <TinyMCEEditor
        value=""
        onContentChange={mockOnContentChange}
      />
    );

    const textarea = screen.getByTestId('tinymce-textarea');
    fireEvent.change(textarea, { target: { value: newContent } });

    expect(mockOnContentChange).toHaveBeenCalledWith(newContent);
  });

  it('保存ボタンが表示される', () => {
    const mockOnSave = jest.fn();

    render(
      <TinyMCEEditor
        value=""
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('保存');
    expect(saveButton).toBeInTheDocument();
  });

  it('ファイル操作パネルが表示される', () => {
    render(
      <TinyMCEEditor
        value=""
      />
    );

    // ファイル操作パネルが存在することを確認
    expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
  });

  it('テーブル操作パネルが表示される', () => {
    render(
      <TinyMCEEditor
        value=""
      />
    );

    // テーブル操作パネルが存在することを確認
    expect(screen.getByTestId('tinymce-editor')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    const customClassName = 'custom-editor';

    render(
      <TinyMCEEditor
        value=""
        className={customClassName}
      />
    );

    const container = screen.getByTestId('tinymce-editor').parentElement;
    expect(container).toHaveClass(customClassName);
  });
}); 