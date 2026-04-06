/**
 * 合計金額の表示と操作ボタンをまとめたファイルです。
 */

/**
 * 合計表示とボタン操作に必要な値です。
 */
type AmountSummaryProps = {
  totalAmount: number;
  formatAmount: (amount: number) => string;
  onClearAll: () => void;
  onExport: () => void;
};

/**
 * 合計金額と「クリア」「精算書出力」ボタンを表示します。
 */
export const AmountSummary = ({
  totalAmount,
  formatAmount,
  onClearAll,
  onExport,
}: AmountSummaryProps) => {
  return (
    <div className="amount-and-clear-container">
      {/* 入力済み明細の総合計 */}
      <div className="total-amount">
        合計金額：{totalAmount !== 0 ? `￥${formatAmount(totalAmount)}` : ""}
      </div>

      {/* 一括クリアとExcel出力の操作 */}
      <div className="button-group">
        <button className="clear-all-button" onClick={onClearAll}>
          クリア
        </button>
        <button className="export-button" onClick={onExport}>
          精算書出力
        </button>
      </div>
    </div>
  );
};
