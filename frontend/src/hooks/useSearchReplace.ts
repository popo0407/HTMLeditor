/**
 * 検索・置換管理フック
 * 
 * 責務:
 * - 全ブロック内での検索・置換
 * - 検索結果のハイライト
 * - 置換履歴の管理
 * 
 * 開発憲章の「単一責任の原則」に従い、検索・置換のみを担当
 */

import { useState, useCallback, useRef } from 'react';
import { Block } from '../types';

export interface SearchResult {
  blockId: string;
  blockIndex: number;
  matchIndex: number;
  matchText: string;
  beforeText: string;
  afterText: string;
}

export interface ReplaceResult {
  blockId: string;
  blockIndex: number;
  originalText: string;
  replacedText: string;
  matchCount: number;
}

export interface UseSearchReplaceReturn {
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearchActive: boolean;
  searchText: string;
  replaceText: string;
  searchInBlocks: (blocks: Block[], searchText: string, caseSensitive?: boolean) => SearchResult[];
  replaceInBlocks: (blocks: Block[], searchText: string, replaceText: string, caseSensitive?: boolean) => ReplaceResult[];
  setSearchText: (text: string) => void;
  setReplaceText: (text: string) => void;
  setCurrentSearchIndex: (index: number) => void;
  clearSearch: () => void;
  nextMatch: () => void;
  previousMatch: () => void;
}

export const useSearchReplace = (): UseSearchReplaceReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');

  /**
   * ブロック内で検索を実行
   */
  const searchInBlocks = useCallback((
    blocks: Block[], 
    searchText: string, 
    caseSensitive: boolean = false
  ): SearchResult[] => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setIsSearchActive(false);
      return [];
    }

    const results: SearchResult[] = [];
    const searchRegex = new RegExp(
      searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
      caseSensitive ? 'g' : 'gi'
    );

    blocks.forEach((block, blockIndex) => {
      const content = block.content;
      let match;
      
      while ((match = searchRegex.exec(content)) !== null) {
        results.push({
          blockId: block.id,
          blockIndex,
          matchIndex: match.index,
          matchText: match[0],
          beforeText: content.substring(Math.max(0, match.index - 20), match.index),
          afterText: content.substring(match.index + match[0].length, match.index + match[0].length + 20),
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    setIsSearchActive(results.length > 0);
    
    return results;
  }, []);

  /**
   * ブロック内で置換を実行
   */
  const replaceInBlocks = useCallback((
    blocks: Block[], 
    searchText: string, 
    replaceText: string, 
    caseSensitive: boolean = false
  ): ReplaceResult[] => {
    if (!searchText.trim()) {
      return [];
    }

    const results: ReplaceResult[] = [];
    const searchRegex = new RegExp(
      searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
      caseSensitive ? 'g' : 'gi'
    );

    blocks.forEach((block, blockIndex) => {
      const originalContent = block.content;
      const replacedContent = originalContent.replace(searchRegex, replaceText);
      
      if (originalContent !== replacedContent) {
        const matchCount = (originalContent.match(searchRegex) || []).length;
        
        results.push({
          blockId: block.id,
          blockIndex,
          originalText: originalContent,
          replacedText: replacedContent,
          matchCount,
        });
      }
    });

    return results;
  }, []);

  /**
   * 次のマッチに移動
   */
  const nextMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchIndex(prev => 
      prev < searchResults.length - 1 ? prev + 1 : 0
    );
  }, [searchResults.length]);

  /**
   * 前のマッチに移動
   */
  const previousMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    
    setCurrentSearchIndex(prev => 
      prev > 0 ? prev - 1 : searchResults.length - 1
    );
  }, [searchResults.length]);

  /**
   * 検索をクリア
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setIsSearchActive(false);
    setSearchText('');
    setReplaceText('');
  }, []);

  return {
    searchResults,
    currentSearchIndex,
    isSearchActive,
    searchText,
    replaceText,
    searchInBlocks,
    replaceInBlocks,
    setSearchText,
    setReplaceText,
    setCurrentSearchIndex,
    clearSearch,
    nextMatch,
    previousMatch,
  };
}; 