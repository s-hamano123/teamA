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
  period: number;
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
      period: 1,
      remark: "",
    },
  ]);

  // ヘッダーの清算期間
  // 初期値：当月1日と最終日
  const getInitialPeriod = (): { start: string; end: string } => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const start = `${yyyy}-${mm}-01`;
    const lastDay = new Date(yyyy, now.getMonth() + 1, 0).getDate();
    const end = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;
    return { start, end };
  };
  const initialPeriod = getInitialPeriod();
  const [startDate, setStartDate] = useState<string>(initialPeriod.start);
  const [endDate, setEndDate] = useState<string>(initialPeriod.end);
  const [name, setName] = useState<string>("");

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value) {
      const d = new Date(value);
      // 月の最終日を取得
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const yyyy = last.getFullYear();
      const mm = String(last.getMonth() + 1).padStart(2, "0");
      const dd = String(last.getDate()).padStart(2, "0");
      setEndDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEndDate("");
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };


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
      period: 1,
      remark: "",
    },
  ]);
};

const handleDelete = (id: number) => {
  setExpenses((prev) => prev.filter((expense) => expense.id !== id));
};

const handleClearAll = () => {
  const shouldClear = window.confirm("全ての入力内容をクリアします。よろしいですか？");
  if (!shouldClear) {
    return;
  }

  setStartDate("");
  setEndDate("");
  setName("");
  setExpenses([
    {
      id: 1,
      date: "",
      paymentType: "ICチップ",
      fromStation: "",
      toStation: "",
      amount: 0,
      tripType: "片道",
      period: 1,
      remark: "",
    },
  ]);
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

// 期間変更を扱う
const handlePeriodChange = (id: number, value: string) => {
  // 3桁までの数値のみ許可
  if (!/^\d{0,3}$/.test(value)) {
    return;
  }

  const num = value === '' ? 0 : Number(value);
  setExpenses((prev) =>
    prev.map((expense) =>
      expense.id === id ? { ...expense, period: num } : expense
    )
  );
};

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('ja-JP');
};

// 金額入力フィールド用（0は空文字）
const formatAmountInput = (amount: number): string => {
  return amount === 0 ? '' : amount.toLocaleString('ja-JP');
};

// 合計を計算（期間も掛け、片道はそのまま、往復は2倍）
const getRowTotal = (expense: Expense): number => {
  const base = expense.amount * expense.period;
  return expense.tripType === '往復' ? base * 2 : base;
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
          <input
            type="date"
            value={startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            onClick={handleDateInputClick}
          />
          <span>〜</span>
          <input
            type="date"
            value={endDate}
            onChange={e => handleEndDateChange(e.target.value)}
            onClick={handleDateInputClick}
          />
        </div>

        {/* 右側：氏名 */}
        <div className="form-group">
          <span>氏名：</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="amount-and-clear-container">
        <div className="total-amount">
          合計金額：{totalAmount !== 0 ? `￥${formatAmount(totalAmount)}` : ""}
        </div>
        <button className="clear-all-button" onClick={handleClearAll}>
          クリア
        </button>
      </div>
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
              <th>日数</th>
              <th>合計</th>
              <th>備考</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <tr key={expense.id}>
                <td>
                  <input
                    type="date"
                    value={expense.date}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((item) =>
                          item.id === expense.id
                            ? { ...item, date: e.target.value }
                            : item
                        )
                      )
                    }
                    onClick={handleDateInputClick}
                  />
                </td>

                <td>
                  <select
                    value={expense.paymentType}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((item) =>
                          item.id === expense.id
                            ? {
                                ...item,
                                paymentType: e.target.value as Expense["paymentType"],
                              }
                            : item
                        )
                      )
                    }
                  >
                    <option value="ICチップ">ICチップ</option>
                    <option value="切符">切符</option>
                  </select>
                </td>

                <td>
                  <input
                    type="text"
                    value={expense.fromStation}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((item) =>
                          item.id === expense.id
                            ? { ...item, fromStation: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="text"
                    value={expense.toStation}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((item) =>
                          item.id === expense.id
                            ? { ...item, toStation: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                </td>

                <td>
                  <input 
                    type="text"
                    value={formatAmountInput(expense.amount)}
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
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={expense.period === 0 ? '' : expense.period}
                    onChange={(e) => handlePeriodChange(expense.id, e.target.value)}
                    style={{ width: '3rem' }}
                  />
                </td>

                <td>
                  {getRowTotal(expense) !== 0
                    ? `￥${formatAmount(getRowTotal(expense))}`
                    : ""}
                </td>

                <td>
                  <input
                    type="text"
                    value={expense.remark}
                    onChange={(e) =>
                      setExpenses((prev) =>
                        prev.map((item) =>
                          item.id === expense.id
                            ? { ...item, remark: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                </td>

                <td>
                  <div className="button-container">
                    {index === 0 ? (
                      <button className="add-button" onClick={handleAdd}>
                        追加
                      </button>
                    ) : (
                      <button onClick={() => handleDelete(expense.id)}>削除</button>
                    )}
                  </div>
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
