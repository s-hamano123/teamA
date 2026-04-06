import type { MouseEvent } from "react";

/**
 * 精算期間と氏名を入力するヘッダー部分のファイル
 */

/**
 * ヘッダーに渡す値とイベント
 */
type SettlementHeaderProps = {
  startDate: string;
  endDate: string;
  name: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onDateInputClick: (e: MouseEvent<HTMLInputElement>) => void;
};

/**
 * 画面上部の入力欄（期間・氏名）を表示
 */
export const SettlementHeader = ({
  startDate,
  endDate,
  name,
  onStartDateChange,
  onEndDateChange,
  onNameChange,
  onDateInputClick,
}: SettlementHeaderProps) => {
  return (
    <div className="header-container">
      {/* 精算対象期間の入力 */}
      <div className="form-group">
        <span>精算期間：</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          onClick={onDateInputClick}
        />
        <span>〜</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          onClick={onDateInputClick}
        />
      </div>

      {/* 申請者氏名の入力 */}
      <div className="form-group">
        <span>氏名：</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
    </div>
  );
};
