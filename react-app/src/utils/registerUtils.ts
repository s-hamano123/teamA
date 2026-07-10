import type { Expense } from "./exportUtils";

type RegisterExpensesRequest = {
  expenses: Expense[];
  startDate: string;
  endDate: string;
  name: string;
  empId: string;
  totalAmount: number;
};

type RegisterExpensesResponse = {
  insertedCount: number;
};

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
