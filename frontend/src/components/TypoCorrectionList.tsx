/**
 * 誤字修正リスト表示・編集コンポーネント
 */

import React, { useState } from 'react';
import { TypoCorrection, addCorrection, updateCorrection, deleteCorrection } from '../services/departmentService';

interface TypoCorrectionListProps {
  departmentId: number;
  departmentName: string;
  corrections: TypoCorrection[];
  onCorrectionsUpdate: () => void;
}

interface EditingCorrection {
  id?: number;
  correct_reading: string;
  correct_display: string;
}

export const TypoCorrectionList: React.FC<TypoCorrectionListProps> = ({
  departmentId,
  departmentName,
  corrections,
  onCorrectionsUpdate
}) => {
  const [editingCorrection, setEditingCorrection] = useState<EditingCorrection | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEdit = (correction: TypoCorrection) => {
    setEditingCorrection({
      id: correction.id,
      correct_reading: correction.correct_reading,
      correct_display: correction.correct_display
    });
  };

  const handleStartAdd = () => {
    setEditingCorrection({
      correct_reading: '',
      correct_display: ''
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!editingCorrection) return;

    setIsLoading(true);
    try {
      if (isAdding) {
        // 新規追加
        await addCorrection(departmentId, {
          correct_reading: editingCorrection.correct_reading,
          correct_display: editingCorrection.correct_display
        });
      } else if (editingCorrection.id) {
        // 更新
        await updateCorrection(editingCorrection.id, {
          correct_reading: editingCorrection.correct_reading,
          correct_display: editingCorrection.correct_display
        });
      }
      
      setEditingCorrection(null);
      setIsAdding(false);
      onCorrectionsUpdate();
    } catch (error) {
      alert(`操作に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingCorrection(null);
    setIsAdding(false);
  };

  const handleDelete = async (correctionId: number) => {
    if (!window.confirm('この誤字修正を削除しますか？')) return;

    setIsLoading(true);
    try {
      await deleteCorrection(correctionId);
      onCorrectionsUpdate();
    } catch (error) {
      alert(`削除に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="typo-correction-list">
      <h4>{departmentName} の誤字修正リスト</h4>
      
      <div className="correction-actions">
        <button 
          onClick={handleStartAdd}
          disabled={isAdding || editingCorrection !== null}
          className="add-button"
        >
          新しい修正を追加
        </button>
      </div>

      <div className="corrections-table">
        <table>
          <thead>
            <tr>
              <th>正しい読み方</th>
              <th>正しい表示</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {corrections.map((correction) => (
              <tr key={correction.id}>
                {editingCorrection?.id === correction.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editingCorrection.correct_reading}
                        onChange={(e) => setEditingCorrection({
                          ...editingCorrection,
                          correct_reading: e.target.value
                        })}
                        disabled={isLoading}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editingCorrection.correct_display}
                        onChange={(e) => setEditingCorrection({
                          ...editingCorrection,
                          correct_display: e.target.value
                        })}
                        disabled={isLoading}
                      />
                    </td>
                    <td>
                      <button onClick={handleSave} disabled={isLoading}>
                        保存
                      </button>
                      <button onClick={handleCancel} disabled={isLoading}>
                        キャンセル
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{correction.correct_reading}</td>
                    <td>{correction.correct_display}</td>
                    <td>
                      <button 
                        onClick={() => handleStartEdit(correction)}
                        disabled={editingCorrection !== null || isLoading}
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(correction.id)}
                        disabled={editingCorrection !== null || isLoading}
                        className="delete-button"
                      >
                        削除
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {isAdding && editingCorrection && (
              <tr>
                <td>
                  <input
                    type="text"
                    value={editingCorrection.correct_reading}
                    onChange={(e) => setEditingCorrection({
                      ...editingCorrection,
                      correct_reading: e.target.value
                    })}
                    placeholder="読み方を入力"
                    disabled={isLoading}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={editingCorrection.correct_display}
                    onChange={(e) => setEditingCorrection({
                      ...editingCorrection,
                      correct_display: e.target.value
                    })}
                    placeholder="表示を入力"
                    disabled={isLoading}
                  />
                </td>
                <td>
                  <button onClick={handleSave} disabled={isLoading}>
                    追加
                  </button>
                  <button onClick={handleCancel} disabled={isLoading}>
                    キャンセル
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
