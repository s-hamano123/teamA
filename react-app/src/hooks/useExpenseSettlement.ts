import { useState, type MouseEvent } from "react";
import { exportToExcel, type Expense } from "../utils/exportUtils";

/**
 * このファイルは、交通費精算画面で使う状態と処理をまとめたものです。
 * 画面側（コンポーネント）は、ここで定義した値と関数を受け取って表示します。
 */

type EditableExpenseField = Exclude<keyof Expense, "id">;

type DialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: "confirm" | "alert" | "info";
  onConfirm: () => void;
};

/**
 * 画面に渡す値と関数の型定義です。
 */
export type UseExpenseSettlementReturn = {
  expenses: Expense[];
  dialog: DialogState;
  startDate: string;
  endDate: string;
  name: string;
  totalAmount: number;
  formatAmount: (amount: number) => string;
  formatAmountInput: (amount: number) => string;
  getRowTotal: (expense: Expense) => number;
  setName: (value: string) => void;
  closeDialog: () => void;
  handleStartDateChange: (value: string) => void;
  handleEndDateChange: (value: string) => void;
  handleDateInputClick: (e: MouseEvent<HTMLInputElement>) => void;
  handleAdd: () => void;
  handleDelete: (id: number) => void;
  handleAmountChange: (id: number, value: string) => void;
  handleTripTypeChange: (id: number, value: Expense["tripType"]) => void;
  handlePeriodChange: (id: number, value: string) => void;
  handleExpenseFieldChange: <K extends EditableExpenseField>(
    id: number,
    field: K,
    value: Expense[K]
  ) => void;
  handleClearAll: () => void;
  handleExportConfirm: () => void;
};

// 明細を1行追加するときの初期値
const createEmptyExpense = (id: number): Expense => ({
  id,
  date: "",
  paymentType: "ICチップ",
  fromStation: "",
  toStation: "",
  amount: 0,
  tripType: "片道",
  period: 1,
  remark: "",
});

// 初期表示の精算期間（当月1日〜月末）の作成
const getInitialPeriod = (): { start: string; end: string } => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${yyyy}-${mm}-01`;
  const lastDay = new Date(yyyy, now.getMonth() + 1, 0).getDate();
  const end = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
};

// 開始日と同じ月の月末日を返す
const getMonthEndDateFromStart = (value: string): string => {
  if (!value) {
    return "";
  }

  const d = new Date(value);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const yyyy = last.getFullYear();
  const mm = String(last.getMonth() + 1).padStart(2, "0");
  const dd = String(last.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 1行分の合計を計算（往復は2倍）
const getRowTotal = (expense: Expense): number => {
  const base = expense.amount * expense.period;
  return expense.tripType === "往復" ? base * 2 : base;
};

// 表示用に3桁区切りへ変換
const formatAmount = (amount: number): string => amount.toLocaleString("ja-JP");

// 入力欄では 0 を空文字として扱う
const formatAmountInput = (amount: number): string =>
  amount === 0 ? "" : amount.toLocaleString("ja-JP");

/**
 * 交通費精算画面用のカスタムフック。
 * 主に次の3つを担当します。
 * 1. 入力値の保持（明細、期間、氏名）
 * 2. 入力値の更新（追加・削除・各項目変更）
 * 3. 補助処理（合計計算、クリア確認、Excel出力確認）
 */
export const useExpenseSettlement = (): UseExpenseSettlementReturn => {
  // 明細テーブルの行データ
  const [expenses, setExpenses] = useState<Expense[]>([createEmptyExpense(1)]);

  // 確認ダイアログ/警告ダイアログの状態
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  const initialPeriod = getInitialPeriod();
  // 画面上部の入力値（精算期間・氏名）
  const [startDate, setStartDate] = useState<string>(initialPeriod.start);
  const [endDate, setEndDate] = useState<string>(initialPeriod.end);
  const [name, setName] = useState<string>("");

  // 開始日が変わったら、終了日は同月末に自動更新する
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setEndDate(getMonthEndDateFromStart(value));
  };

  // 終了日を手動で変更する
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  // 明細を1行追加する
  const handleAdd = () => {
    setExpenses((prev) => [...prev, createEmptyExpense(Date.now())]);
  };

  // 指定した明細行を削除する
  const handleDelete = (id: number) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  // 指定した行の指定項目を更新する共通処理
  const handleExpenseFieldChange = <K extends EditableExpenseField>(
    id: number,
    field: K,
    value: Expense[K]
  ) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  // ダイアログを閉じる
  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // 全入力のクリア確認を表示し、OKなら初期状態に戻す
  const handleClearAll = () => {
    setDialog({
      isOpen: true,
      title: "確認",
      message: "全ての入力内容をクリアします。よろしいですか？",
      type: "confirm",
      onConfirm: () => {
        const period = getInitialPeriod();
        setStartDate(period.start);
        setEndDate(getMonthEndDateFromStart(period.start));
        setName("");
        setExpenses([createEmptyExpense(1)]);
        closeDialog();
      },
    });
  };

  const handleExportConfirm = () => {
    // ファイル出力前に氏名の入力をチェックする
    if (!name.trim()) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "氏名を入力してください。",
        type: "alert",
        onConfirm: closeDialog,
      });
      return;
    }

    setDialog({
      isOpen: true,
      title: "確認",
      message: "精算書を出力します。よろしいですか？",
      type: "confirm",
      onConfirm: async () => {
        await exportToExcel(expenses, startDate, endDate, name);
        // 出力成功のダイアログを表示
        setDialog({
          isOpen: true,
          title: "完了",
          message: "精算書を出力しました。",
          type: "info",
          onConfirm: closeDialog,
        });
      },
    });
  };

  const handleAmountChange = (id: number, value: string) => {
    // カンマを除去して数値へ変換する
    const cleanValue = value.replace(/,/g, "");
    if (
      cleanValue === "" ||
      (!Number.isNaN(Number(cleanValue)) && cleanValue.length <= 9)
    ) {
      const numValue = cleanValue === "" ? 0 : Number(cleanValue);
      handleExpenseFieldChange(id, "amount", numValue);
    }
  };

  // 区分（片道/往復）を更新する
  const handleTripTypeChange = (id: number, value: Expense["tripType"]) => {
    handleExpenseFieldChange(id, "tripType", value);
  };

  const handlePeriodChange = (id: number, value: string) => {
    // 日数は0〜999の範囲で入力できるように制限する
    if (!/^\d{0,3}$/.test(value)) {
      return;
    }

    const num = value === "" ? 0 : Number(value);
    handleExpenseFieldChange(id, "period", num);
  };

  const handleDateInputClick = (e: MouseEvent<HTMLInputElement>) => {
    // 対応ブラウザなら日付ピッカーを開く
    const input = e.currentTarget as HTMLInputElement;
    input.showPicker?.();
  };

  // 一覧下部に表示する合計金額
  const totalAmount = expenses.reduce((sum, expense) => sum + getRowTotal(expense), 0);

  return {
    expenses,
    dialog,
    startDate,
    endDate,
    name,
    totalAmount,
    formatAmount,
    formatAmountInput,
    getRowTotal,
    setName,
    closeDialog,
    handleStartDateChange,
    handleEndDateChange,
    handleDateInputClick,
    handleAdd,
    handleDelete,
    handleAmountChange,
    handleTripTypeChange,
    handlePeriodChange,
    handleExpenseFieldChange,
    handleClearAll,
    handleExportConfirm,
  };
};
