/**
 * 社員プロフィール（社員ID・氏名）をAPIから取得するユーティリティ
 */

// APIレスポンスの型（オプショナルはエラー時に message のみ返る場合を想定）
type EmployeeProfileResponse = {
  empId?: string;
  name?: string;
  message?: string;
};

// 画面で使う社員プロフィールの型
export type EmployeeProfile = {
  empId: string;
  name: string;
};

// 指定した社員IDに対応するプロフィールをAPIから取得する
export const fetchEmployeeProfile = async (
  empId: string
): Promise<EmployeeProfile> => {
  const query = new URLSearchParams({ empId });
  const response = await fetch(`/api/employee-profile?${query.toString()}`);

  const body = (await response.json().catch(() => null)) as
    | EmployeeProfileResponse
    | null;

  if (!response.ok) {
    throw new Error(body?.message ?? "社員情報の取得に失敗しました。");
  }

  return {
    empId: body?.empId ?? empId,
    name: body?.name ?? "",
  };
};
