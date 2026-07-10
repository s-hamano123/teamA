import { useEffect, useRef, useState, type KeyboardEvent } from "react";

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
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const monthPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const start = parseYearMonth(startDate);
    setYear(start.year);
    setMonth(start.month);
  }, [startDate]);

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

  const openMonthPicker = () => {
    monthPickerRef.current?.showPicker?.();
    monthPickerRef.current?.focus();
  };

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
