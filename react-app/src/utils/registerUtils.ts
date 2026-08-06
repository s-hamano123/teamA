/**
 * 交通費明細をDBへ登録するAPIを呼び出すユーティリティ
 */
import type { Expense } from "./exportUtils";

// 登録APIに送るリクエストの型
type RegisterExpensesRequest = {
  expenses: Expense[];
  startDate: string;
  name: string;
  empId: string;
};

// 登録APIのレスポンスの型
type RegisterExpensesResponse = {
  insertedCount: number;
};

// 明細リストをAPIへPOSTしてDBに登録する
export const registerExpenses = async (
  payload: RegisterExpensesRequest
): Promise<RegisterExpensesResponse> => {
  const response = await fetch("/api/transportation-expenses/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { message?: string; insertedCount?: number }
    | null;

  if (!response.ok) {
    throw new Error(body?.message ?? "DB登録に失敗しました。");
  }

  return {
    insertedCount: body?.insertedCount ?? 0,
  };
};
