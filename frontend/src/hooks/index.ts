/**
 * カスタムフックのエクスポート
 * 
 * 開発憲章の「関心の分離」に従い、
 * 各責務に特化したカスタムフックを提供
 */

export { useBlockManager } from './useBlockManager';
export { usePreviewManager } from './usePreviewManager';
export { useAddressBookManager } from './useAddressBookManager';

export type { UseBlockManagerReturn } from './useBlockManager';
export type { UsePreviewManagerReturn } from './usePreviewManager';
export type { UseAddressBookManagerReturn } from './useAddressBookManager'; 