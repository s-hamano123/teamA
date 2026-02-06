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

  return (
    <div>
      <h1>交通費精算システム</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 左側：清算期間 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>清算期間</span>
          <input type="date" />
          <span>〜</span>
          <input type="date" />
        </div>

        {/* 右側：氏名 */}
        <label style={{ display: "flex", flexDirection: "column" }}>
          氏名
          <input type="text" />
        </label>
      </div>

      <div>合計：¥1,200</div>
      <table border={1} style={{ borderCollapse: "collapse", width: "100%" }}>
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
                <input type="date" />
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
                  type="number"
                />
              </td>

              <td>
                <select>
                  <option value="往復">往復</option>
                  <option value="片道">片道</option>
                </select>
              </td>

              <td>
                ¥1,200
              </td>

              <td>
                <input type="text" />
              </td>

              <td>
                {index !== 0 && (
                  <button onClick={() => handleDelete(expense.id)}>
                    削除
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAdd}>追加</button>
    </div>
  )
}

export default App
