import type { MouseEvent } from "react";
import type { Expense } from "../utils/exportUtils";
import { ExpenseRow } from "./ExpenseRow";

/**
 * 交通費明細テーブル全体を表示するファイルです。
 */

type EditableExpenseField = Exclude<keyof Expense, "id">;

/**
 * テーブル本体に渡す値とイベントです。
 */
type ExpenseTableProps = {
  expenses: Expense[];
  formatAmount: (amount: number) => string;
  formatAmountInput: (amount: number) => string;
  getRowTotal: (expense: Expense) => number;
  onDateInputClick: (e: MouseEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onAmountChange: (id: number, value: string) => void;
  onTripTypeChange: (id: number, value: Expense["tripType"]) => void;
  onPeriodChange: (id: number, value: string) => void;
  onExpenseFieldChange: <K extends EditableExpenseField>(
    id: number,
    field: K,
    value: Expense[K]
  ) => void;
};

/**
 * 明細の一覧テーブルを表示します。
 */
export const ExpenseTable = ({
  expenses,
  formatAmount,
  formatAmountInput,
  getRowTotal,
  onDateInputClick,
  onAdd,
  onDelete,
  onAmountChange,
  onTripTypeChange,
  onPeriodChange,
  onExpenseFieldChange,
}: ExpenseTableProps) => {
  return (
    <div className="table-wrapper">
      <table className="expense-table">
        {/* 明細の項目ヘッダー */}
        <thead>
          <tr>
            <th>日付</th>
            <th>支払先</th>
            <th>乗車駅</th>
            <th>降車駅</th>
            <th>金額</th>
            <th>区分</th>
            <th>日数</th>
            <th>合計</th>
            <th>備考</th>
            <th></th>
          </tr>
        </thead>

        {/* 明細行の表示・編集 */}
        <tbody>
          {expenses.map((expense, index) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              isFirstRow={index === 0}
              formatAmount={formatAmount}
              formatAmountInput={formatAmountInput}
              getRowTotal={getRowTotal}
              onDateInputClick={onDateInputClick}
              onAdd={onAdd}
              onDelete={onDelete}
              onAmountChange={onAmountChange}
              onTripTypeChange={onTripTypeChange}
              onPeriodChange={onPeriodChange}
              onExpenseFieldChange={onExpenseFieldChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
