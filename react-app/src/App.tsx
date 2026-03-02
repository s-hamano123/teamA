import { useState } from "react";
import "./App.css";

type Expense = {
  id: number;
  date: string;
  paymentType: "ICチップ" | "切符";
  fromStation: string;
  toStation: string;
  amount: number;
  tripType: "片道" | "往復";
  remark: string;
};

function App() {
const [expenses, setExpenses] = useState<Expense[]>([
  {
    id: 1,
    date: "",
    paymentType: "ICチップ",
    fromStation: "",
    toStation: "",
    amount: 0,
    tripType: "片道",
    remark: "",
  },
]);

const handleAdd = () => {
  setExpenses((prev) => [
    ...prev,
    {
      id: Date.now(),
      date: "",
      paymentType: "ICチップ",
      fromStation: "",
      toStation: "",
      amount: 0,
      tripType: "片道",
      remark: "",
    },
  ]);
};

const handleDelete = (id: number) => {
  setExpenses((prev) => prev.filter((expense) => expense.id !== id));
};

const handleAmountChange = (id: number, value: string) => {
  // カンマを除去して数値化
  const cleanValue = value.replace(/,/g, '');
  if (cleanValue === '' || (!isNaN(Number(cleanValue)) && cleanValue.length <= 9)) {
    const numValue = cleanValue === '' ? 0 : Number(cleanValue);
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id ? { ...expense, amount: numValue } : expense
      )
    );
  }
};

// 区分変更を扱う
const handleTripTypeChange = (id: number, value: Expense['tripType']) => {
  setExpenses((prev) =>
    prev.map((expense) =>
      expense.id === id ? { ...expense, tripType: value } : expense
    )
  );
};

const formatAmount = (amount: number): string => {
  return amount === 0 ? '' : amount.toLocaleString('ja-JP');
};

// 合計を計算（片道はそのまま、往復は2倍）
const getRowTotal = (expense: Expense): number => {
  return expense.tripType === '往復' ? expense.amount * 2 : expense.amount;
};

const handleDateInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
  const input = e.currentTarget as HTMLInputElement;
  input.showPicker?.();
};

  // 全体の合計を算出
  const totalAmount = expenses.reduce((sum, e) => sum + getRowTotal(e), 0);

  return (
    <div>
      <h1>交通費精算</h1>
      <div className="header-container">
        {/* 左側：清算期間 */}
        <div className="form-group">
          <span>清算期間：</span>
          <input type="date" onClick={handleDateInputClick} />
          <span>〜</span>
          <input type="date" onClick={handleDateInputClick} />
        </div>

        {/* 右側：氏名 */}
        <div className="form-group">
          <span>氏名：</span>
          <input type="text" />
        </div>
      </div>

      <div className="total-amount">金額：￥{formatAmount(totalAmount)}</div>
      <div className="table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>日付</th>
              <th>支払先</th>
              <th>乗車駅</th>
              <th>降車駅</th>
              <th>金額</th>
              <th>区分</th>
              <th>合計</th>
              <th>備考</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <tr key={expense.id}>
                <td>
                  <input type="date" onClick={handleDateInputClick} />
                </td>

                <td>
                  <select>
                    <option value="ICチップ">ICチップ</option>
                    <option value="切符">切符</option>
                  </select>
                </td>

                <td>
                  <input type="text" />
                </td>

                <td>
                  <input type="text" />
                </td>

                <td>
                  <input 
                    type="text"
                    value={formatAmount(expense.amount)}
                    onChange={(e) => handleAmountChange(expense.id, e.target.value)}
                  />
                </td>

                <td>
                  <select
                    value={expense.tripType}
                    onChange={(e) => handleTripTypeChange(expense.id, e.target.value as Expense['tripType'])}
                  >
                    <option value="往復">往復</option>
                    <option value="片道">片道</option>
                  </select>
                </td>

                <td>
                  ¥{formatAmount(getRowTotal(expense))}
                </td>

                <td>
                  <input type="text" />
                </td>

                <td>
                  {index === 0 ? (
                    <button className="add-button" onClick={handleAdd}>
                      追加
                    </button>
                  ) : (
                    <button onClick={() => handleDelete(expense.id)}>削除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
