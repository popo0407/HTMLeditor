/**
 * 部門管理ページ
 * 部門・課・誤字修正リストの追加・削除・編集を行う
 * Excelライクな編集機能付き
 */

import React, { useState, useEffect } from 'react';
import { 
  Department, 
  DepartmentWithCorrections, 
  DepartmentUpdate,
  TypoCorrection,
  JobType,
  DepartmentMember,
  getAllDepartments, 
  getDepartmentWithCorrections,
  addCorrection,
  updateCorrection,
  deleteCorrection,
  createDepartmentWithCopy,
  deleteDepartment,
  updateDepartment,
  getAllJobTypes,
  createJobType,
  updateJobType,
  deleteJobType,
  getDepartmentWithDetails,
  createDepartmentMember,
  updateDepartmentMember,
  deleteDepartmentMember
} from '../services/departmentService';

interface DepartmentManagementProps {
  onBack: () => void;
}

interface NewDepartment {
  bu_name: string;
  ka_name: string;
  job_type?: string;
  email_address?: string;
  copyFromId?: number;
}

// 編集可能な修正項目の型
interface EditableCorrection {
  id?: number; // 新規の場合はundefined
  correct_reading: string;
  correct_display: string;
  description: string;
  isDeleted: boolean; // 削除マーク
  isNew: boolean; // 新規追加フラグ
  isModified: boolean; // 変更フラグ
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onBack }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithCorrections | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 職種一覧
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  
  // タブナビゲーション（corrections-section用）
  const [correctionsTab, setCorrectionsTab] = useState<'corrections' | 'department-edit' | 'members' | 'job-types'>('corrections');
  
  // メンバー管理の状態
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<{ name: string }>({ name: '' });
  const [editingMember, setEditingMember] = useState<DepartmentMember | null>(null);
  
  // 階層選択の状態
  const [selectedBu, setSelectedBu] = useState<string>('');
  const [availableBus, setAvailableBus] = useState<string[]>([]);
  const [availableKas, setAvailableKas] = useState<Department[]>([]);
  
  // 部門追加の状態
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState<NewDepartment>({ 
    bu_name: '', 
    ka_name: '',
    job_type: undefined,
    email_address: undefined,
    copyFromId: undefined
  });
  
  // 部門編集の状態
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Excelライクな編集用の状態
  const [editableCorrections, setEditableCorrections] = useState<EditableCorrection[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalCorrections, setOriginalCorrections] = useState<TypoCorrection[]>([]);

  // 職種管理の状態
  const [newJobType, setNewJobType] = useState<{ name: string }>({ name: '' });
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [isJobTypeManagementMode, setIsJobTypeManagementMode] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadJobTypes();
    // 最初から空の誤字修正リストを表示
    initializeEditableCorrections([]);
  }, []);

  // 部門選択時に編集可能な修正リストを初期化
  useEffect(() => {
    if (selectedDepartment) {
      initializeEditableCorrections(selectedDepartment.corrections);
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts);
      
      // 部の一覧を抽出（重複除去）
      const busSet = new Set(depts.map(dept => dept.bu_name));
      setAvailableBus(Array.from(busSet));
    } catch (error) {
      console.error('部門の取得に失敗しました:', error);
      alert('部門の取得に失敗しました。');
    }
  };

  const loadJobTypes = async () => {
    try {
      const types = await getAllJobTypes();
      setJobTypes(types);
    } catch (error) {
      console.error('職種の取得に失敗しました:', error);
    }
  };

  const handleDepartmentSelect = async (departmentId: number) => {
    // 未保存の変更がある場合は確認
    if (hasUnsavedChanges) {
      const shouldContinue = window.confirm('未保存の変更があります。破棄して続行しますか？');
      if (!shouldContinue) return;
    }

    try {
      const department = await getDepartmentWithCorrections(departmentId);
      setSelectedDepartment(department);
      
      // メンバーデータも読み込み
      await loadDepartmentMembers(departmentId);
      
      // 確認のため、明示的にリロード処理を含める（再度getDepartmentWithCorrectionsを呼ぶ必要はないが、パターン維持）
      // await handleDepartmentSelect(selectedDepartment.id); の代わりに直接departmentを使用
    } catch (error) {
      console.error('部門の詳細取得に失敗しました:', error);
      alert('部門の詳細取得に失敗しました。');
    }
  };

  // 部を選択した時の処理
  const handleBuSelect = (buName: string) => {
    setSelectedBu(buName);
    // 選択された部の課一覧を抽出
    const kasInBu = departments.filter(dept => dept.bu_name === buName);
    setAvailableKas(kasInBu);
    // 部を選択した時点では部門選択をクリア
    setSelectedDepartment(null);
    setEditableCorrections([]);
    setHasUnsavedChanges(false);
  };

  // 部選択に戻る処理
  const handleBackToBuSelection = () => {
    setSelectedBu('');
    setAvailableKas([]);
    setSelectedDepartment(null);
    setEditableCorrections([]);
    setHasUnsavedChanges(false);
  };

  // 編集可能な修正リストを初期化
  const initializeEditableCorrections = (corrections: TypoCorrection[]) => {
    const editable: EditableCorrection[] = corrections.map(correction => ({
      id: correction.id,
      correct_reading: correction.correct_reading,
      correct_display: correction.correct_display,
      description: correction.description || '',
      isDeleted: false,
      isNew: false,
      isModified: false
    }));
    
    // 常に最後に空の行を追加
    editable.push({
      correct_reading: '',
      correct_display: '',
      description: '',
      isDeleted: false,
      isNew: true,
      isModified: false
    });

    setEditableCorrections(editable);
    setOriginalCorrections([...corrections]);
    setHasUnsavedChanges(false);
  };

  // セルの値を更新
  const updateCellValue = (index: number, field: 'correct_reading' | 'correct_display' | 'description', value: string) => {
    const newCorrections = [...editableCorrections];
    const correction = newCorrections[index];
    
    correction[field] = value;
    
    // 既存の項目の場合は変更フラグを立てる
    if (correction.id && !correction.isNew) {
      const original = originalCorrections.find(o => o.id === correction.id);
      if (original) {
        correction.isModified = (
          correction.correct_reading !== original.correct_reading ||
          correction.correct_display !== original.correct_display ||
          correction.description !== (original.description || '')
        );
      }
    }
    
    // 最後の行（空の行）に入力された場合、新しい空の行を追加
    if (index === editableCorrections.length - 1 && (correction.correct_reading || correction.correct_display || correction.description)) {
      newCorrections.push({
        correct_reading: '',
        correct_display: '',
        description: '',
        isDeleted: false,
        isNew: true,
        isModified: false
      });
    }
    
    setEditableCorrections(newCorrections);
    checkForUnsavedChanges(newCorrections);
  };

  // 行を削除マークする
  const markForDeletion = (index: number) => {
    const newCorrections = [...editableCorrections];
    const correction = newCorrections[index];
    
    if (correction.isNew) {
      // 新規行の場合は配列から削除
      newCorrections.splice(index, 1);
    } else {
      // 既存行の場合は削除フラグを立てる
      correction.isDeleted = !correction.isDeleted;
    }
    
    setEditableCorrections(newCorrections);
    checkForUnsavedChanges(newCorrections);
  };

  // 未保存の変更があるかチェック
  const checkForUnsavedChanges = (corrections: EditableCorrection[]) => {
    const hasChanges = corrections.some(correction => 
      correction.isModified || 
      correction.isDeleted || 
      (correction.isNew && (correction.correct_reading.trim() || correction.correct_display.trim() || correction.description.trim()))
    );
    setHasUnsavedChanges(hasChanges);
  };

  // バリデーション: 片方だけ入力されている行があるかチェック
  const validateCorrections = (corrections: EditableCorrection[]): string[] => {
    const errors: string[] = [];
    
    corrections.forEach((correction, index) => {
      if (correction.isDeleted) return; // 削除対象はスキップ
      
      const hasReading = correction.correct_reading.trim();
      const hasDisplay = correction.correct_display.trim();
      
      if ((hasReading && !hasDisplay) || (!hasReading && hasDisplay)) {
        errors.push(`${index + 1}行目: 読み方と表示の両方を入力してください`);
      }
    });
    
    return errors;
  };

  // 保存処理
  const handleSaveChanges = async () => {
    if (!selectedDepartment) return;

    // バリデーション
    const errors = validateCorrections(editableCorrections);
    if (errors.length > 0) {
      alert('以下のエラーを修正してください:\n' + errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      // 削除処理
      for (const correction of editableCorrections) {
        if (correction.isDeleted && correction.id) {
          await deleteCorrection(correction.id);
        }
      }

      // 更新処理
      for (const correction of editableCorrections) {
        if (correction.isModified && correction.id && !correction.isDeleted) {
          await updateCorrection(correction.id, {
            correct_reading: correction.correct_reading,
            correct_display: correction.correct_display,
            description: correction.description
          });
        }
      }

      // 新規追加処理
      for (const correction of editableCorrections) {
        if (correction.isNew && !correction.isDeleted && 
            correction.correct_reading.trim() && correction.correct_display.trim()) {
          await addCorrection(selectedDepartment.id, {
            correct_reading: correction.correct_reading,
            correct_display: correction.correct_display,
            description: correction.description
          });
        }
      }

      // データを再読み込み
      const updatedDepartment = await getDepartmentWithCorrections(selectedDepartment.id);
      setSelectedDepartment(updatedDepartment);
      alert('変更を保存しました。');
    } catch (error) {
      alert(`保存に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.bu_name.trim() || !newDepartment.ka_name.trim()) {
      alert('部名と課名を入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      // APIリクエスト用にフィールド名を変換
      const requestData = {
        bu_name: newDepartment.bu_name,
        ka_name: newDepartment.ka_name,
        job_type: newDepartment.job_type,
        email_address: newDepartment.email_address,
        copy_from_department_id: newDepartment.copyFromId
      };
      await createDepartmentWithCopy(requestData);
      setNewDepartment({ 
        bu_name: '', 
        ka_name: '',
        job_type: undefined,
        email_address: undefined,
        copyFromId: undefined
      });
      setShowAddDepartment(false);
      await loadDepartments();
      alert('部門を追加しました。');
    } catch (error) {
      console.error('部門の追加に失敗しました:', error);
      alert('部門の追加に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: number, departmentName: string) => {
    const corrections = selectedDepartment?.id === departmentId ? 
      selectedDepartment.corrections.length : 0;
    
    const message = corrections > 0 ?
      `部門「${departmentName}」を削除しますか？\n\n関連する誤字修正リスト（${corrections}件）も一緒に削除されます。\n\nこの操作は取り消せません。` :
      `部門「${departmentName}」を削除しますか？\n\nこの操作は取り消せません。`;
    
    if (!window.confirm(message)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteDepartment(departmentId);
      
      // 削除した部門が選択されていた場合は選択解除
      if (selectedDepartment?.id === departmentId) {
        setSelectedDepartment(null);
        setEditableCorrections([]);
        setHasUnsavedChanges(false);
      }
      
      await loadDepartments();
      alert('部門を削除しました。');
    } catch (error) {
      console.error('部門の削除に失敗しました:', error);
      alert('部門の削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 部門編集のハンドラー
  const handleSaveDepartmentEdit = async () => {
    if (!editingDepartment) return;

    try {
      setIsLoading(true);
      
      const updateData: DepartmentUpdate = {
        bu_name: editingDepartment.bu_name,
        ka_name: editingDepartment.ka_name,
        job_type: editingDepartment.job_type || undefined,
        email_address: editingDepartment.email_address || undefined
      };

      const updatedDepartment = await updateDepartment(editingDepartment.id, updateData);
      
      // 部門一覧を更新
      setDepartments(departments.map(dept => 
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ));
      
      // 選択された部門が編集されたものの場合、更新
      if (selectedDepartment && selectedDepartment.id === updatedDepartment.id) {
        setSelectedDepartment({
          ...selectedDepartment,
          ...updatedDepartment
        });
      }
      
      setEditingDepartment(null);
      await loadDepartments(); // 部門リストを再読み込み
      alert('部門を更新しました。');
    } catch (error) {
      console.error('部門の更新に失敗しました:', error);
      alert('部門の更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDepartmentEdit = () => {
    setEditingDepartment(null);
  };

  // メンバー管理ハンドラー
  const loadDepartmentMembers = async (departmentId: number) => {
    try {
      const departmentWithDetails = await getDepartmentWithDetails(departmentId);
      setDepartmentMembers(departmentWithDetails.members || []);
    } catch (error) {
      console.error('メンバーの読み込みに失敗しました:', error);
      setDepartmentMembers([]);
    }
  };

  const handleAddMember = async () => {
    if (!selectedDepartment || !newMember.name.trim()) return;

    try {
      setIsLoading(true);
      
      await createDepartmentMember(selectedDepartment.id, newMember.name);
      await loadDepartmentMembers(selectedDepartment.id);
      setNewMember({ name: '' });
      setShowAddMember(false);
    } catch (error) {
      console.error('メンバーの追加に失敗しました:', error);
      alert('メンバーの追加に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      setIsLoading(true);
      await updateDepartmentMember(editingMember.id, {
        member_name: editingMember.member_name
      });
      
      if (selectedDepartment) {
        await loadDepartmentMembers(selectedDepartment.id);
      }
      setEditingMember(null);
      alert('メンバーを更新しました。');
    } catch (error) {
      console.error('メンバーの更新に失敗しました:', error);
      alert('メンバーの更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!window.confirm(`メンバー「${memberName}」を削除しますか？`)) return;

    try {
      setIsLoading(true);
      await deleteDepartmentMember(memberId);
      
      if (selectedDepartment) {
        await loadDepartmentMembers(selectedDepartment.id);
      }
      // メンバー削除成功時のアラートを削除
    } catch (error) {
      console.error('メンバーの削除に失敗しました:', error);
      alert('メンバーの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 職種管理のハンドラー関数
  const handleAddJobType = async () => {
    if (!newJobType.name.trim()) {
      alert('職種名を入力してください。');
      return;
    }

    try {
      setIsLoading(true);
      await createJobType({ name: newJobType.name.trim() });
      await loadJobTypes();
      setNewJobType({ name: '' });
      // 職種追加成功時のアラートを削除
    } catch (error) {
      console.error('職種の追加に失敗しました:', error);
      alert('職種の追加に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJobType = async () => {
    if (!editingJobType) return;

    try {
      setIsLoading(true);
      await updateJobType(editingJobType.id, {
        name: editingJobType.name
      });
      await loadJobTypes();
      setEditingJobType(null);
      alert('職種を更新しました。');
    } catch (error) {
      console.error('職種の更新に失敗しました:', error);
      alert('職種の更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJobType = async (jobTypeId: number, jobTypeName: string) => {
    if (!window.confirm(`職種「${jobTypeName}」を削除しますか？\n※この職種を使用している部門がある場合は削除できません。`)) return;

    try {
      setIsLoading(true);
      await deleteJobType(jobTypeId);
      await loadJobTypes();
      // 職種削除成功時のアラートを削除
    } catch (error) {
      console.error('職種の削除に失敗しました:', error);
      alert('職種の削除に失敗しました。この職種を使用している部門がある可能性があります。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="department-management">
      <div className="management-header">
        <h2>管理画面</h2>
        <div className="header-buttons">
          <button 
            onClick={() => {
              setIsJobTypeManagementMode(true);
              setCorrectionsTab('job-types');
            }}
            className={`header-nav-button ${isJobTypeManagementMode ? 'active' : ''}`}
          >
            職種管理
          </button>
          <button onClick={onBack} className="back-button">
            ← 戻る
          </button>
        </div>
      </div>

      <div className="management-content">
        {isJobTypeManagementMode ? (
          // 職種管理モード：職種管理の内容のみを表示
          <div className="job-types-content">
            <div className="job-types-header">
              <h4>職種管理</h4>
              <p>システム全体で使用する職種を管理できます。</p>
              <button 
                onClick={() => setIsJobTypeManagementMode(false)}
                className="back-to-department-button"
              >
                ← 部門管理に戻る
              </button>
            </div>

            {/* 職種追加フォーム */}
            <div className="add-job-type-form">
              <h5>新しい職種を追加</h5>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="職種名"
                  value={newJobType.name}
                  onChange={(e) => setNewJobType({ name: e.target.value })}
                  disabled={isLoading}
                />
                <button
                  onClick={handleAddJobType}
                  disabled={isLoading || !newJobType.name.trim()}
                  className="add-button"
                >
                  追加
                </button>
              </div>
            </div>

            {/* 職種一覧 */}
            <div className="job-types-list">
              <h5>職種一覧 ({jobTypes.length}件)</h5>
              {jobTypes.length === 0 ? (
                <p className="no-data">職種が登録されていません。</p>
              ) : (
                <table className="job-types-table">
                  <thead>
                    <tr>
                      <th>職種名</th>
                      <th>作成日</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobTypes.map((jobType) => (
                      <tr key={jobType.id}>
                        <td>
                          {editingJobType?.id === jobType.id ? (
                            <input
                              type="text"
                              value={editingJobType.name}
                              onChange={(e) => setEditingJobType({
                                ...editingJobType,
                                name: e.target.value
                              })}
                              disabled={isLoading}
                            />
                          ) : (
                            jobType.name
                          )}
                        </td>
                        <td>
                          {new Date(jobType.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td>
                          {editingJobType?.id === jobType.id ? (
                            <div className="job-type-actions">
                              <button 
                                onClick={handleEditJobType} 
                                disabled={isLoading}
                                className="save-button"
                              >
                                保存
                              </button>
                              <button 
                                onClick={() => setEditingJobType(null)} 
                                disabled={isLoading}
                                className="cancel-button"
                              >
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            <div className="job-type-actions">
                              <button 
                                onClick={() => setEditingJobType({ ...jobType })} 
                                disabled={isLoading}
                                className="edit-button"
                              >
                                編集
                              </button>
                              <button 
                                onClick={() => handleDeleteJobType(jobType.id, jobType.name)} 
                                disabled={isLoading}
                                className="delete-button"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          // 通常の部門管理モード
          <>
        {/* 左側: 部門一覧 */}
        <div className="departments-section">
          <div className="section-header">
            <h3>部門一覧</h3>
            <button 
              onClick={() => setShowAddDepartment(true)}
              className="add-button"
              disabled={showAddDepartment}
            >
              + 部門追加
            </button>
          </div>

          {showAddDepartment && (
            <div className="add-department-form">
              <h4>新しい部門を追加</h4>
              <div className="form-column">
                <input
                  type="text"
                  placeholder="部名"
                  value={newDepartment.bu_name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, bu_name: e.target.value })}
                  disabled={isLoading}
                />
                <input
                  type="text"
                  placeholder="課名"
                  value={newDepartment.ka_name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, ka_name: e.target.value })}
                  disabled={isLoading}
                />
                <select
                  value={newDepartment.job_type || ''}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : e.target.value;
                    setNewDepartment(prev => ({ ...prev, job_type: newValue }));
                  }}
                  disabled={isLoading}
                >
                  <option value="">職種を選択（任意）</option>
                  {jobTypes.map((jobType) => (
                    <option key={jobType.id} value={jobType.name}>
                      {jobType.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  placeholder="メールアドレス（任意）"
                  value={newDepartment.email_address || ''}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : e.target.value;
                    setNewDepartment(prev => ({ ...prev, email_address: newValue }));
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="form-row">
                <label>誤字修正リストのコピー元（任意）：</label>
                <select
                  value={newDepartment.copyFromId || ''}
                  onChange={(e) => setNewDepartment({ 
                    ...newDepartment, 
                    copyFromId: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  disabled={isLoading}
                >
                  <option value="">なし（新規作成）</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.bu_name} {dept.ka_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleAddDepartment} disabled={isLoading}>
                  追加
                </button>
                <button onClick={() => {
                  setShowAddDepartment(false);
                  setNewDepartment({ 
                    bu_name: '', 
                    ka_name: '',
                    job_type: undefined,
                    email_address: undefined,
                    copyFromId: undefined
                  });
                }} disabled={isLoading}>
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 部門編集フォームを削除 */}

          <div className="departments-list">
            {/* 階層選択UI */}
            {departments.length === 0 ? (
              <p>部門を読み込み中...</p>
            ) : (
              <>
                {!selectedBu ? (
                  // 部の選択
                  <div className="bu-selection">
                    <p>部を選択：</p>
                    <div className="department-buttons">
                      {availableBus.map((buName) => (
                        <button
                          key={buName}
                          onClick={() => handleBuSelect(buName)}
                          className="department-button"
                        >
                          {buName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // 課の選択
                  <div className="ka-selection">
                    <div className="breadcrumb">
                      <button onClick={handleBackToBuSelection} className="breadcrumb-button">
                        部門選択に戻る
                      </button>
                      <span> / 課を選択：</span>
                    </div>
                    
                    <div className="department-buttons">
                      {availableKas.map((dept) => (
                        <div
                          key={dept.id}
                          className={`department-item-container ${selectedDepartment?.id === dept.id ? 'selected' : ''}`}
                        >
                          <button
                            onClick={() => handleDepartmentSelect(dept.id)}
                            className={`department-button ${selectedDepartment?.id === dept.id ? 'selected' : ''}`}
                          >
                            {dept.ka_name}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>

        {/* 右側: 誤字修正・部門編集 */}
        {selectedDepartment ? (
          <div className="corrections-section">
            <div className="section-header">
              <h3>
                {selectedDepartment.bu_name} {selectedDepartment.ka_name}
              </h3>
              
              {/* corrections-section用のタブナビゲーション */}
              <div className="corrections-tab-navigation">
                <button 
                  className={`tab-button ${correctionsTab === 'corrections' ? 'active' : ''}`}
                  onClick={() => setCorrectionsTab('corrections')}
                >
                  誤字修正リスト
                </button>
                <button 
                  className={`tab-button ${correctionsTab === 'department-edit' ? 'active' : ''}`}
                  onClick={() => setCorrectionsTab('department-edit')}
                >
                  部門情報編集
                </button>
                <button 
                  className={`tab-button ${correctionsTab === 'members' ? 'active' : ''}`}
                  onClick={() => setCorrectionsTab('members')}
                >
                  メンバー管理
                </button>
              </div>
            </div>

            {correctionsTab === 'corrections' ? (
              <div className="corrections-content">
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges || isLoading || !selectedDepartment}
                  className={`save-button ${hasUnsavedChanges ? 'has-changes' : ''}`}
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>

                <div className="corrections-table">
                  <table>
                    <thead>
                      <tr>
                        <th>正しい読み方</th>
                        <th>正しい表示</th>
                        <th>説明</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableCorrections.map((correction, index) => {
                        const isLastRow = index === editableCorrections.length - 1;
                        const hasReadingOnly = correction.correct_reading.trim() && !correction.correct_display.trim();
                        const hasDisplayOnly = !correction.correct_reading.trim() && correction.correct_display.trim();
                        const hasValidationError = hasReadingOnly || hasDisplayOnly;
                        
                        return (
                          <tr 
                            key={correction.id || `new-${index}`} 
                            className={correction.isDeleted ? 'deleted-row' : ''}
                          >
                            <td>
                              <input
                                type="text"
                                value={correction.correct_reading}
                                onChange={(e) => updateCellValue(index, 'correct_reading', e.target.value)}
                                disabled={isLoading || correction.isDeleted}
                                className={hasValidationError ? 'validation-error' : ''}
                                placeholder={isLastRow ? '読み方を入力' : ''}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={correction.correct_display}
                                onChange={(e) => updateCellValue(index, 'correct_display', e.target.value)}
                                disabled={isLoading || correction.isDeleted}
                                className={hasValidationError ? 'validation-error' : ''}
                                placeholder={isLastRow ? '表示を入力' : ''}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={correction.description}
                                onChange={(e) => updateCellValue(index, 'description', e.target.value)}
                                disabled={isLoading || correction.isDeleted}
                                placeholder={isLastRow ? '説明を入力（任意）' : ''}
                              />
                            </td>
                            <td>
                              {!isLastRow && (
                                <button 
                                  onClick={() => markForDeletion(index)}
                                  disabled={isLoading}
                                  className={correction.isDeleted ? 'restore-button' : 'delete-button'}
                                >
                                  {correction.isDeleted ? '復元' : '削除'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {hasUnsavedChanges && (
                  <div className="unsaved-changes-warning">
                    ⚠ 未保存の変更があります
                  </div>
                )}
              </div>
            ) : correctionsTab === 'department-edit' ? (
              <div className="department-edit-content">
                <div className="department-edit-form">
                  <h4>部門情報編集</h4>
                  <div className="form-fields">
                    <div className="form-field">
                      <label>部名:</label>
                      <input
                        type="text"
                        placeholder="部名"
                        value={editingDepartment?.bu_name || selectedDepartment.bu_name}
                        onChange={(e) => setEditingDepartment({ 
                          ...selectedDepartment, 
                          ...editingDepartment, 
                          bu_name: e.target.value 
                        })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-field">
                      <label>課名:</label>
                      <input
                        type="text"
                        placeholder="課名"
                        value={editingDepartment?.ka_name || selectedDepartment.ka_name}
                        onChange={(e) => setEditingDepartment({ 
                          ...selectedDepartment, 
                          ...editingDepartment, 
                          ka_name: e.target.value 
                        })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-field">
                      <label>職種:</label>
                      <select
                        value={editingDepartment?.job_type || selectedDepartment.job_type || ''}
                        onChange={(e) => {
                          const newValue = e.target.value === '' ? undefined : e.target.value;
                          setEditingDepartment({ 
                            ...selectedDepartment, 
                            ...editingDepartment, 
                            job_type: newValue 
                          });
                        }}
                        disabled={isLoading}
                      >
                        <option value="">職種を選択（任意）</option>
                        {jobTypes.map((jobType) => (
                          <option key={jobType.id} value={jobType.name}>
                            {jobType.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>メールアドレス:</label>
                      <input
                        type="email"
                        placeholder="メールアドレス（任意）"
                        value={editingDepartment?.email_address || selectedDepartment.email_address || ''}
                        onChange={(e) => {
                          const newValue = e.target.value === '' ? undefined : e.target.value;
                          setEditingDepartment({ 
                            ...selectedDepartment, 
                            ...editingDepartment, 
                            email_address: newValue 
                          });
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      onClick={handleSaveDepartmentEdit} 
                      disabled={isLoading || !editingDepartment}
                      className="save-button"
                    >
                      {isLoading ? '保存中...' : '保存'}
                    </button>
                    <button 
                      onClick={handleCancelDepartmentEdit} 
                      disabled={isLoading}
                      className="cancel-button"
                    >
                      元に戻す
                    </button>
                    <button 
                      onClick={() => handleDeleteDepartment(selectedDepartment.id, `${selectedDepartment.bu_name} ${selectedDepartment.ka_name}`)}
                      disabled={isLoading}
                      className="delete-button"
                    >
                      部門を削除
                    </button>
                  </div>
                </div>
              </div>
            ) : correctionsTab === 'members' ? (
              <div className="members-content">
                <div className="members-header">
                  <h4>メンバー管理</h4>
                  <button 
                    onClick={() => setShowAddMember(true)}
                    disabled={isLoading || showAddMember}
                    className="add-button"
                  >
                    + メンバー追加
                  </button>
                </div>

                {showAddMember && (
                  <div className="add-member-form">
                    <h5>新しいメンバーを追加</h5>
                    <div className="form-fields">
                      <div className="form-field">
                        <label>名前:</label>
                        <input
                          type="text"
                          placeholder="メンバー名"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        onClick={handleAddMember} 
                        disabled={isLoading || !newMember.name.trim()}
                        className="save-button"
                      >
                        {isLoading ? '追加中...' : '追加'}
                      </button>
                      <button 
                        onClick={() => {
                          setShowAddMember(false);
                          setNewMember({ name: '' });
                        }}
                        disabled={isLoading}
                        className="cancel-button"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                <div className="members-list">
                  {departmentMembers.length === 0 ? (
                    <p>メンバーが登録されていません。</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>名前</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentMembers.map((member) => (
                          <tr key={member.id}>
                            <td>
                              {editingMember?.id === member.id ? (
                                <input
                                  type="text"
                                  value={editingMember.member_name}
                                  onChange={(e) => setEditingMember({ ...editingMember, member_name: e.target.value })}
                                  disabled={isLoading}
                                />
                              ) : (
                                member.member_name
                              )}
                            </td>
                            <td>
                              {editingMember?.id === member.id ? (
                                <div className="member-actions">
                                  <button 
                                    onClick={handleEditMember} 
                                    disabled={isLoading}
                                    className="save-button"
                                  >
                                    保存
                                  </button>
                                  <button 
                                    onClick={() => setEditingMember(null)} 
                                    disabled={isLoading}
                                    className="cancel-button"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              ) : (
                                <div className="member-actions">
                                  <button 
                                    onClick={() => setEditingMember({ ...member })} 
                                    disabled={isLoading}
                                    className="edit-button"
                                  >
                                    編集
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMember(member.id, member.member_name)} 
                                    disabled={isLoading}
                                    className="delete-button"
                                  >
                                    削除
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="no-department-selected">
            <p>部門を選択してください</p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
