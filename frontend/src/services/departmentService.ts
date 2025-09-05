/**
 * 部門管理関連のAPI呼び出しサービス
 */

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface Department {
  id: number;
  bu_name: string;
  ka_name: string;
  job_type?: string;
  created_at: string;
}

export interface TypoCorrection {
  id: number;
  department_id: number;
  correct_reading: string;
  correct_display: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentWithCorrections extends Department {
  corrections: TypoCorrection[];
}

export interface TypoCorrectionCreate {
  correct_reading: string;
  correct_display: string;
  description?: string;
  department_id: number;
}

export interface TypoCorrectionUpdate {
  correct_reading: string;
  correct_display: string;
  description?: string;
}

export interface DepartmentCreate {
  bu_name: string;
  ka_name: string;
  job_type?: string;
}

export interface DepartmentCreateWithCopy {
  bu_name: string;
  ka_name: string;
  job_type?: string;
  copy_from_department_id?: number;
}

export interface TypoCorrectionList {
  department_info: Department;
  corrections: {
    reading: string;
    display: string;
    description?: string;
  }[];
}

/**
 * すべての部門を取得
 */
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await fetch(`${API_BASE_URL}/departments/`);
  if (!response.ok) {
    throw new Error(`部門の取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 部門と関連する誤字修正リストを取得
 */
export const getDepartmentWithCorrections = async (
  departmentId: number
): Promise<DepartmentWithCorrections> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`);
  if (!response.ok) {
    throw new Error(`部門の取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * クリップボード用の誤字修正リストを取得
 */
export const getCorrectionsForClipboard = async (
  departmentId: number
): Promise<TypoCorrectionList> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/corrections/clipboard`);
  if (!response.ok) {
    throw new Error(`誤字修正リストの取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 誤字修正を追加
 */
export const addCorrection = async (
  departmentId: number,
  correction: Omit<TypoCorrectionCreate, 'department_id'>
): Promise<TypoCorrection> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/corrections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...correction,
      department_id: departmentId,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`誤字修正の追加に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 誤字修正を更新
 */
export const updateCorrection = async (
  correctionId: number,
  correction: TypoCorrectionUpdate
): Promise<TypoCorrection> => {
  const response = await fetch(`${API_BASE_URL}/departments/corrections/${correctionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(correction),
  });
  
  if (!response.ok) {
    throw new Error(`誤字修正の更新に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 誤字修正を削除
 */
export const deleteCorrection = async (correctionId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/departments/corrections/${correctionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`誤字修正の削除に失敗しました: ${response.status}`);
  }
};

/**
 * 新しい部門を作成
 */
export const createDepartment = async (department: DepartmentCreate): Promise<Department> => {
  const response = await fetch(`${API_BASE_URL}/departments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  });
  
  if (!response.ok) {
    throw new Error(`部門の作成に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 新しい部門を作成（誤字修正リストのコピー付き）
 */
export const createDepartmentWithCopy = async (department: DepartmentCreateWithCopy): Promise<Department> => {
  const response = await fetch(`${API_BASE_URL}/departments/with-copy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  });
  
  if (!response.ok) {
    throw new Error(`部門の作成に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 部門を削除（関連する誤字修正リストも削除）
 */
export const deleteDepartment = async (departmentId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`部門の削除に失敗しました: ${response.status}`);
  }
};
