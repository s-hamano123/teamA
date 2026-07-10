/**
 * 合計金額の表示と操作ボタンをまとめたファイル
 */

/**
 * 合計表示とボタン操作に必要な値
 */
type AmountSummaryProps = {
  totalAmount: number;
  isReferenceMode: boolean;
  formatAmount: (amount: number) => string;
  onClearAll: () => void;
  onRegister: () => void;
  onExport: () => void;
};

/**
 * 合計金額と「クリア」「精算書出力」ボタンを表示
 */
export const AmountSummary = ({
  totalAmount,
  isReferenceMode,
  formatAmount,
  onClearAll,
  onRegister,
  onExport,
}: AmountSummaryProps) => {
  return (
    <div className="amount-and-clear-container">
      {/* 入力済み明細の総合計 */}
      <div className="total-amount">
        合計金額：{totalAmount !== 0 ? `￥${formatAmount(totalAmount)}` : ""}
      </div>

      {/* 一括クリアとExcel出力の操作 */}
      {!isReferenceMode && (
        <div className="button-group">
          <button className="clear-all-button" onClick={onClearAll}>
            クリア
          </button>
          <button className="register-button" onClick={onRegister}>
            登録
          </button>
          <button className="export-button" onClick={onExport}>
            精算書出力
          </button>
        </div>
      )}
    </div>
  );
};
