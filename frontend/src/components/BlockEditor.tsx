import React from 'react';

// ブロックエディタの将来実装用スタブ
// TinyMCE との統合前のプレースホルダー

export interface BlockEditorProps {
	disabled?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ disabled }) => {
	return <div style={{display:'none'}} data-disabled={disabled} data-placeholder="block-editor" />;
};

export default BlockEditor;
