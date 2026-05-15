import type { MouseEvent } from "react";
import type { Expense } from "../utils/exportUtils";

/**
 * 明細テーブルの1行を表示するファイルです。
 */

type EditableExpenseField = Exclude<keyof Expense, "id">;

/**
 * 1行分の表示と編集に使う値です。
 */
type ExpenseRowProps = {
  expense: Expense;
  isFirstRow: boolean;
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
 * 明細の1行を表示します。
 */
export const ExpenseRow = ({
  expense,
  isFirstRow,
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
}: ExpenseRowProps) => {
  return (
    <tr>
      {/* 利用日 */}
      <td>
        <input
          type="date"
          value={expense.date}
          onChange={(e) => onExpenseFieldChange(expense.id, "date", e.target.value)}
          onClick={onDateInputClick}
        />
      </td>

      {/* 支払種別（IC/切符） */}
      <td>
        <select
          value={expense.paymentType}
          onChange={(e) =>
            onExpenseFieldChange(
              expense.id,
              "paymentType",
              e.target.value as Expense["paymentType"]
            )
          }
        >
          <option value="ICチップ">ICチップ</option>
          <option value="切符">切符</option>
        </select>
      </td>

      {/* 利用区間（乗車駅〜降車駅） */}
      <td>
        <div className="route-field">
          <input
            type="text"
            value={expense.fromStation}
            onChange={(e) => onExpenseFieldChange(expense.id, "fromStation", e.target.value)}
          />
          <span className="route-separator">～</span>
          <input
            type="text"
            value={expense.toStation}
            onChange={(e) => onExpenseFieldChange(expense.id, "toStation", e.target.value)}
          />
        </div>
      </td>

      {/* 単価 */}
      <td>
        <input
          type="text"
          value={formatAmountInput(expense.amount)}
          onChange={(e) => onAmountChange(expense.id, e.target.value)}
        />
      </td>

      {/* 片道/往復 */}
      <td>
        <select
          value={expense.tripType}
          onChange={(e) => onTripTypeChange(expense.id, e.target.value as Expense["tripType"])}
        >
          <option value="往復">往復</option>
          <option value="片道">片道</option>
        </select>
      </td>

      {/* 日数 */}
      <td>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          value={expense.period === 0 ? "" : expense.period}
          onChange={(e) => onPeriodChange(expense.id, e.target.value)}
          style={{ width: "3rem" }}
        />
      </td>

      {/* 行ごとの計算結果 */}
      <td>
        {getRowTotal(expense) !== 0 ? `￥${formatAmount(getRowTotal(expense))}` : ""}
      </td>

      {/* 備考 */}
      <td>
        <input
          type="text"
          value={expense.remark}
          onChange={(e) => onExpenseFieldChange(expense.id, "remark", e.target.value)}
        />
      </td>

      {/* 先頭行は追加、それ以外は削除 */}
      <td>
        <div className="button-container">
          {isFirstRow ? (
            <button className="add-button" onClick={onAdd}>
              追加
            </button>
          ) : (
            <button onClick={() => onDelete(expense.id)}>削除</button>
          )}
        </div>
      </td>
    </tr>
  );
};
