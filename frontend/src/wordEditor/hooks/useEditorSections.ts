import { useState, useCallback } from 'react';
import { EditorSection, EditorSectionType, TableData } from '../types/wordEditorTypes';

export interface UseEditorSectionsProps {
  initialContent?: string;
}

export interface UseEditorSectionsReturn {
  sections: EditorSection[];
  currentSectionId: string;
  addTextSection: (content?: string) => string;
  addTableSection: (tableData: TableData) => string;
  updateSectionContent: (sectionId: string, content: string) => void;
  updateSectionTableData: (sectionId: string, tableData: TableData) => void;
  removeSection: (sectionId: string) => void;
  setCurrentSection: (sectionId: string) => void;
  insertTableAfterSection: (sectionId: string, tableData: TableData) => void;
  getAllTextContent: () => string;
}

export const useEditorSections = ({ initialContent = '' }: UseEditorSectionsProps): UseEditorSectionsReturn => {
  const [sections, setSections] = useState<EditorSection[]>([
    { id: '1', type: 'text', content: initialContent }
  ]);
  const [currentSectionId, setCurrentSectionId] = useState('1');

  // テキストセクションを追加
  const addTextSection = useCallback((content: string = '') => {
    const newSectionId = Date.now().toString();
    const newSection: EditorSection = {
      id: newSectionId,
      type: 'text',
      content
    };
    
    setSections(prev => [...prev, newSection]);
    setCurrentSectionId(newSectionId);
    return newSectionId;
  }, []);

  // 表セクションを追加
  const addTableSection = useCallback((tableData: TableData) => {
    const newSectionId = Date.now().toString();
    const newSection: EditorSection = {
      id: newSectionId,
      type: 'table',
      content: '',
      tableData
    };
    
    setSections(prev => [...prev, newSection]);
    setCurrentSectionId(newSectionId);
    return newSectionId;
  }, []);

  // セクションのコンテンツを更新
  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, content }
          : section
      )
    );
  }, []);

  // セクションの表データを更新
  const updateSectionTableData = useCallback((sectionId: string, tableData: TableData) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, tableData }
          : section
      )
    );
  }, []);

  // セクションを削除
  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    
    // 削除されたセクションが現在のセクションだった場合、次のセクションに移動
    if (currentSectionId === sectionId) {
      setSections(prev => {
        const remainingSections = prev.filter(section => section.id !== sectionId);
        if (remainingSections.length > 0) {
          setCurrentSectionId(remainingSections[0].id);
        }
        return remainingSections;
      });
    }
  }, [currentSectionId]);

  // 現在のセクションを設定
  const setCurrentSection = useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId);
  }, []);

  // 指定されたセクションの後に表を挿入
  const insertTableAfterSection = useCallback((sectionId: string, tableData: TableData) => {
    const newSectionId = Date.now().toString();
    const newTableSection: EditorSection = {
      id: newSectionId,
      type: 'table',
      content: '',
      tableData
    };

    const newTextSectionId = (Date.now() + 1).toString();
    const newTextSection: EditorSection = {
      id: newTextSectionId,
      type: 'text',
      content: ''
    };

    setSections(prev => {
      const newSections = [...prev];
      const currentIndex = newSections.findIndex(s => s.id === sectionId);
      if (currentIndex !== -1) {
        // 現在のセクションの後に表を挿入
        newSections.splice(currentIndex + 1, 0, newTableSection);
        // 表の後に新しいテキストセクションを追加
        newSections.splice(currentIndex + 2, 0, newTextSection);
      }
      return newSections;
    });

    setCurrentSectionId(newSectionId);
  }, []);

  // 全テキストコンテンツを取得
  const getAllTextContent = useCallback(() => {
    return sections
      .filter(section => section.type === 'text')
      .map(section => section.content)
      .join('\n');
  }, [sections]);

  return {
    sections,
    currentSectionId,
    addTextSection,
    addTableSection,
    updateSectionContent,
    updateSectionTableData,
    removeSection,
    setCurrentSection,
    insertTableAfterSection,
    getAllTextContent
  };
}; 