type EmployeeProfileResponse = {
  empId?: string;
  name?: string;
  message?: string;
};

export type EmployeeProfile = {
  empId: string;
  name: string;
};

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
