import type { Expense } from "./exportUtils";

type FetchExpensesResponse = {
  expenses?: Expense[];
  message?: string;
};

export const fetchExpensesByStartDate = async (
  startDate: string,
  empId: string
): Promise<Expense[]> => {
  // 初期表示で対象月の明細を取得する
  const query = new URLSearchParams({ startDate, empId });
  const response = await fetch(`/api/transportation-expenses?${query.toString()}`);

  const body = (await response.json().catch(() => null)) as FetchExpensesResponse | null;

  if (!response.ok) {
    throw new Error(body?.message ?? "初期データの取得に失敗しました。");
  }

  return Array.isArray(body?.expenses) ? body.expenses : [];
};
