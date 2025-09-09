import React, { useRef, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { tinymceConfig } from "../config/tinymce-config";
import "../styles/TinyMCEEditor.css";

interface TinyMCEEditorProps {
  value?: string; // initialContentからvalueに変更
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  height?: number;
  className?: string;
}

export const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value = "", // initialContentからvalueに変更
  onContentChange,
  onSave,
  height = 500,
  className = "",
}) => {
  const editorRef = useRef<any>(null);
  const [currentContent, setCurrentContent] = useState(value);

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

  const handleInit = (evt: any, editor: any) => {
    editorRef.current = editor;
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
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          onInit={handleInit}
          value={currentContent} // initialValueからvalueに変更し、stateを直接渡す
          init={customConfig}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}; 