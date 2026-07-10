import "../styles/dialog.css";

/**
 * ダイアログに渡す値
 */
type DialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  type: "confirm" | "alert" | "info";
  onConfirm: () => void;
  onCancel?: () => void;
};

/**
 * 画面に確認/警告ダイアログを表示する共通コンポーネント
 */
export const Dialog = ({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
}: DialogProps) => {
  if (!isOpen) return null;

  // OKボタン押下時の処理を呼び出す
  const handleConfirm = () => {
    onConfirm();
  };

  // キャンセル押下時にキャンセル処理があれば実行する
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-header-content">
            <h3>{title}</h3>
          </div>
        </div>
        <div className="dialog-body">
          <div className="dialog-body-content">
            {type === "alert" ? (
              // 警告アイコン（三角形）
              <svg className="dialog-icon error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
              </svg>
            ) : type === "confirm" ? (
              // 確認アイコン（チェックマーク）
              <svg className="dialog-icon confirm-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12l2 2 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // 情報アイコン（ℹ）
              <svg className="dialog-icon info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v0.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 13v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            <p>{message}</p>
          </div>
        </div>
        <div className={`dialog-footer ${type === "confirm" ? "dialog-footer-confirm" : ""}`}>
          {type === "confirm" ? (
            <>
              <button className="dialog-button cancel-button" onClick={handleCancel}>
                キャンセル
              </button>
              <button className="dialog-button confirm-button" onClick={handleConfirm}>
                OK
              </button>
            </>
          ) : (
            <button className="dialog-button confirm-button" onClick={handleConfirm}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
