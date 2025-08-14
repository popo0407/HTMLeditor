import React from 'react';

// 表ブロックのプレースホルダー（高度な表機能追加予定）

export interface TableBlockProps {
	rows?: number;
	cols?: number;
}

export const TableBlock: React.FC<TableBlockProps> = ({ rows = 0, cols = 0 }) => {
	return <div style={{display:'none'}} data-rows={rows} data-cols={cols} data-placeholder="table-block" />;
};

export default TableBlock;
