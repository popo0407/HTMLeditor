import React, { useRef, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { tinymceConfig, apiKey } from "../config/tinymce-config";
import { FileOperations } from "./FileOperations";
import { TableOperations } from "./TableOperations";
import "../styles/TinyMCEEditor.css";

interface TinyMCEEditorProps {
  value?: string; // initialContentからvalueに変更
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  height?: number;
  className?: string;
  showFileOperations?: boolean;
  showTableOperations?: boolean;
}

export const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value = "", // initialContentからvalueに変更
  onContentChange,
  onSave,
  height = 500,
  className = "",
  showFileOperations = true,
  showTableOperations = true,
}) => {
  const editorRef = useRef<any>(null);
  const [currentContent, setCurrentContent] = useState(value);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // valueプロパティの変更を監視してcurrentContentと同期
  useEffect(() => {
    if (value !== currentContent) {
      setCurrentContent(value);
    }
  }, [value, currentContent]);

  const handleEditorChange = (content: string) => {
    setCurrentContent(content);
    onContentChange?.(content);
  };

  const handleSave = () => {
    const content = editorRef.current?.getContent();
    onSave?.(content);
  };

  const handleInit = (evt: any, editor: any) => {
    console.log('TinyMCE initialized:', editor);
    editorRef.current = editor;
    setEditorInstance(editor);
  };

  const handleContentLoad = (content: string) => {
    if (editorRef.current) {
      editorRef.current.setContent(content);
      setCurrentContent(content);
    }
  };

  // カスタム設定を適用
  const customConfig = {
    ...tinymceConfig,
    height,
  };

  return (
    <div className={`tinymce-editor-container ${className}`}>
      {/* メインエディタ */}
      <div className="editor-main">
        <Editor
          apiKey={apiKey}
          onInit={handleInit}
          value={currentContent} // initialValueからvalueに変更し、stateを直接渡す
          init={customConfig}
          onEditorChange={handleEditorChange}
        />
        {onSave && (
          <div className="editor-actions">
            <button 
              onClick={handleSave}
              className="save-button"
            >
              保存
            </button>
          </div>
        )}
      </div>

      {/* ファイル操作パネル */}
      {showFileOperations && (
        <div className="operations-panel file-panel">
          <FileOperations
            onContentLoad={handleContentLoad}
            onExport={onSave || (() => {})}
            currentContent={currentContent}
          />
        </div>
      )}

      {/* 表操作パネル */}
      {showTableOperations && editorInstance && (
        <div className="operations-panel table-panel">
          <TableOperations editor={editorInstance} />
        </div>
      )}
    </div>
  );
}; 