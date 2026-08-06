import { useRef, useState, type KeyboardEvent } from "react";

/**
 * 精算期間と氏名を入力するヘッダー部分のファイル
 */

/**
 * ヘッダーに渡す値とイベント
 */
type SettlementHeaderProps = {
  startDate: string;
  name: string;
  onStartDateChange: (value: string) => void;
};

// 年と月が有効な値かどうかを検証する
const isValidYearMonth = (year: string, month: string): boolean => {
  if (!/^\d{4}$/.test(year)) {
    return false;
  }

  if (!/^\d{1,2}$/.test(month)) {
    return false;
  }

  const mm = Number(month);
  return mm >= 1 && mm <= 12;
};

// YYYY-MM-DD 形式の文字列から年と月を抽出する
const parseYearMonth = (dateText: string): { year: string; month: string } => ({
  year: dateText.slice(0, 4),
  month: dateText.slice(5, 7),
});

/**
 * 画面上部の入力欄（期間・氏名）を表示
 */
export const SettlementHeader = ({
  startDate,
  name,
  onStartDateChange,
}: SettlementHeaderProps) => {
  const [year, setYear] = useState(parseYearMonth(startDate).year);
  const [month, setMonth] = useState(parseYearMonth(startDate).month);
  const [syncedDate, setSyncedDate] = useState(startDate);
  const monthPickerRef = useRef<HTMLInputElement>(null);

  // startDate が外部から変わったとき、入力欄をレンダリング中に同期する
  if (startDate !== syncedDate) {
    const parsed = parseYearMonth(startDate);
    setSyncedDate(startDate);
    setYear(parsed.year);
    setMonth(parsed.month);
  }

  // 年・月の入力をバリデーションし、正常なら親コンポーネントへ通知する
  const commitPeriod = () => {
    if (!isValidYearMonth(year, month)) {
      const start = parseYearMonth(startDate);
      setYear(start.year);
      setMonth(start.month);
      return;
    }

    const mm = String(Number(month)).padStart(2, "0");
    onStartDateChange(`${year}-${mm}-01`);
  };

  // Enter キーで確定、Alt+↓ または F4 でカレンダーを開く
  const handlePeriodKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitPeriod();
      return;
    }

    // 手入力と両立するため、明示操作(Alt+↓ / F4)でのみカレンダーを開く
    if ((e.altKey && e.key === "ArrowDown") || e.key === "F4") {
      e.preventDefault();
      openMonthPicker();
    }
  };

  // 非表示の month ピッカーを開いてフォーカスを移す
  const openMonthPicker = () => {
    monthPickerRef.current?.showPicker?.();
    monthPickerRef.current?.focus();
  };

  // カレンダーから月を選択したときに年・月テキスト入力と startDate を同期する
  const handleMonthPickerChange = (value: string) => {
    if (!/^\d{4}-\d{2}$/.test(value)) {
      return;
    }

    const [nextYear, nextMonth] = value.split("-");
    setYear(nextYear);
    setMonth(nextMonth);

    onStartDateChange(`${nextYear}-${nextMonth}-01`);
  };

  const pickerValue =
    isValidYearMonth(year, month) ? `${year}-${String(Number(month)).padStart(2, "0")}` : "";

  return (
    <div className="header-container">
      {/* 精算対象期間の入力 */}
      <div className="form-group">
        <input
          ref={monthPickerRef}
          type="month"
          value={pickerValue}
          onChange={(e) => handleMonthPickerChange(e.target.value)}
          aria-label="精算期間月選択"
          tabIndex={-1}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        />
        <span>精算期間：</span>
        <input
          type="text"
          className="period-input year-input"
          inputMode="numeric"
          maxLength={4}
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onClick={openMonthPicker}
          onBlur={commitPeriod}
          onKeyDown={handlePeriodKeyDown}
        />
        <span>年</span>
        <input
          type="text"
          className="period-input month-input"
          inputMode="numeric"
          maxLength={2}
          value={month}
          onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
          onClick={openMonthPicker}
          onBlur={commitPeriod}
          onKeyDown={handlePeriodKeyDown}
        />
        <span>月</span>
      </div>

      {/* 申請者氏名 */}
      <div className="form-group">
        <span>氏名：</span>
        <span>{name}</span>
      </div>
    </div>
  );
};
