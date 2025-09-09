/**
 * 部門管理関連のAPI呼び出しサービス
 */

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface Department {
  id: number;
  bu_name: string;
  ka_name: string;
  job_type?: string;
  email_address?: string;
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

export interface DepartmentMember {
  id: number;
  department_id: number;
  member_name: string;
  created_at: string;
}

export interface JobType {
  id: number;
  name: string;
  created_at: string;
}

export interface DepartmentWithCorrections extends Department {
  corrections: TypoCorrection[];
}

export interface DepartmentWithDetails extends Department {
  corrections: TypoCorrection[];
  members: DepartmentMember[];
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
  email_address?: string;
}

export interface DepartmentUpdate {
  bu_name?: string;
  ka_name?: string;
  job_type?: string;
  email_address?: string;
}

export interface DepartmentCreateWithCopy {
  bu_name: string;
  ka_name: string;
  job_type?: string;
  email_address?: string;
  copy_from_department_id?: number;
}

export interface JobTypeCreate {
  name: string;
}

export interface JobTypeUpdate {
  name: string;
}

export interface DepartmentMemberCreate {
  department_id: number;
  member_name: string;
}

export interface DepartmentMemberUpdate {
  member_name: string;
}

export interface ClipboardData {
  Department: string;
  Issuer: string;
  typoCorrectionList: {
    reading: string;
    display: string;
    description?: string;
  }[];
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
 * 部門の詳細情報（メンバー、誤字修正リスト含む）を取得
 */
export const getDepartmentWithDetails = async (
  departmentId: number
): Promise<DepartmentWithDetails> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/details`);
  if (!response.ok) {
    throw new Error(`部門の取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * クリップボード用の部門情報と誤字修正リスト（発行者付き）を取得
 */
export const getCorrectionsForClipboardWithIssuer = async (
  departmentId: number,
  issuer: string
): Promise<ClipboardData> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/corrections/clipboard/${encodeURIComponent(issuer)}`);
  if (!response.ok) {
    throw new Error(`クリップボードデータの取得に失敗しました: ${response.status}`);
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
 * 部門を更新
 */
export const updateDepartment = async (
  departmentId: number,
  department: DepartmentUpdate
): Promise<Department> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  });
  
  if (!response.ok) {
    throw new Error(`部門の更新に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 部門を削除（関連するデータも削除）
 */
export const deleteDepartment = async (departmentId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`部門の削除に失敗しました: ${response.status}`);
  }
};

// 職種管理API

/**
 * すべての職種を取得
 */
export const getAllJobTypes = async (): Promise<JobType[]> => {
  const response = await fetch(`${API_BASE_URL}/departments/job-types/`);
  if (!response.ok) {
    throw new Error(`職種の取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 新しい職種を作成
 */
export const createJobType = async (jobType: JobTypeCreate): Promise<JobType> => {
  const response = await fetch(`${API_BASE_URL}/departments/job-types/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobType),
  });
  
  if (!response.ok) {
    throw new Error(`職種の作成に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 職種を更新
 */
export const updateJobType = async (
  jobTypeId: number,
  jobType: JobTypeUpdate
): Promise<JobType> => {
  const response = await fetch(`${API_BASE_URL}/departments/job-types/${jobTypeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobType),
  });
  
  if (!response.ok) {
    throw new Error(`職種の更新に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 職種を削除
 */
export const deleteJobType = async (jobTypeId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/departments/job-types/${jobTypeId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`職種の削除に失敗しました: ${response.status}`);
  }
};

// 部門メンバー管理API

/**
 * 部門のメンバーリストを取得
 */
export const getDepartmentMembers = async (departmentId: number): Promise<DepartmentMember[]> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/members`);
  if (!response.ok) {
    throw new Error(`メンバーの取得に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * 部門にメンバーを追加
 */
export const createDepartmentMember = async (
  departmentId: number,
  memberName: string
): Promise<DepartmentMember> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `member_name=${encodeURIComponent(memberName)}`,
  });
  
  if (!response.ok) {
    throw new Error(`メンバーの作成に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * メンバーを更新
 */
export const updateDepartmentMember = async (
  memberId: number,
  member: DepartmentMemberUpdate
): Promise<DepartmentMember> => {
  const response = await fetch(`${API_BASE_URL}/departments/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(member),
  });
  
  if (!response.ok) {
    throw new Error(`メンバーの更新に失敗しました: ${response.status}`);
  }
  return response.json();
};

/**
 * メンバーを削除
 */
export const deleteDepartmentMember = async (memberId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/departments/members/${memberId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`メンバーの削除に失敗しました: ${response.status}`);
  }
};

/**
 * 部門詳細情報と誤字修正リストを取得
 */
export const getDepartmentWithCorrections = async (departmentId: number): Promise<DepartmentWithDetails> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/details`);
  
  if (!response.ok) {
    throw new Error(`部門詳細情報の取得に失敗しました: ${response.status}`);
  }
  return response.json();
};
