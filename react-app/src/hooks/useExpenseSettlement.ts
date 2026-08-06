import { useEffect, useRef, useState, type MouseEvent } from "react";
import { exportToExcel, type Expense } from "../utils/exportUtils";
import { registerExpenses } from "../utils/registerUtils";
import { fetchExpensesByStartDate } from "../utils/fetchExpensesUtils";
import { fetchEmployeeProfile } from "../utils/fetchEmployeeUtils";

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
  invalidExpenseIds: number[];
  dialog: DialogState;
  isReferenceMode: boolean;
  startDate: string;
  name: string;
  totalAmount: number;
  formatAmount: (amount: number) => string;
  formatAmountInput: (amount: number) => string;
  getRowTotal: (expense: Expense) => number;
  closeDialog: () => void;
  handleStartDateChange: (value: string) => void;
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
  handleRegisterConfirm: () => void;
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
const getInitialPeriod = (): { start: string } => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${yyyy}-${mm}-01`;
  return { start };
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

// 1件でも入力済みの行があるかどうかを確認する
const hasInputInAnyRow = (expenses: Expense[]): boolean =>
  expenses.some(
    (expense) =>
      expense.date.trim() !== "" ||
      expense.fromStation.trim() !== "" ||
      expense.toStation.trim() !== "" ||
      expense.amount > 0 ||
      expense.remark.trim() !== ""
  );

// 登録に必要な項目（乗車駅・降車駅・金額）が未入力かどうかを確認する
const isMissingRequiredFields = (expense: Expense): boolean => {
  const hasFromStation = expense.fromStation.trim() !== "";
  const hasToStation = expense.toStation.trim() !== "";
  const hasAmount = expense.amount > 0;

  return !hasFromStation || !hasToStation || !hasAmount;
};

// 2つの明細リストが同一内容かどうかを比較する（不要な再レンダリングを防ぐ）
const areExpensesEqual = (left: Expense[], right: Expense[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((row, index) => {
    const next = right[index];
    return (
      row.id === next.id &&
      row.date === next.date &&
      row.paymentType === next.paymentType &&
      row.fromStation === next.fromStation &&
      row.toStation === next.toStation &&
      row.amount === next.amount &&
      row.tripType === next.tripType &&
      row.period === next.period &&
      row.remark === next.remark
    );
  });
};

// 指定した月が先月より前の場合は参照モード（編集不可）とする
const isReferenceModeMonth = (dateText: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return true;
  }

  const targetYm = Number(dateText.slice(0, 7).replace("-", ""));
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousYm = Number(
    `${previousMonth.getFullYear()}${String(previousMonth.getMonth() + 1).padStart(2, "0")}`
  );

  // 先月より前は参照モード（当月と未来月は編集可）
  return targetYm < previousYm;
};

/**
 * 交通費精算画面用のカスタムフック。
 * 主に次の3つを担当します。
 * 1. 入力値の保持（明細、期間、氏名）
 * 2. 入力値の更新（追加・削除・各項目変更）
 * 3. 補助処理（合計計算、クリア確認、Excel出力確認）
 */
export const useExpenseSettlement = (currentEmpId: string): UseExpenseSettlementReturn => {
  const initialPeriod = getInitialPeriod();

  // 明細テーブルの行データ
  const [expenses, setExpenses] = useState<Expense[]>([createEmptyExpense(1)]);
  const [invalidExpenseIds, setInvalidExpenseIds] = useState<number[]>([]);

  // 確認ダイアログ/警告ダイアログの状態
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  // 画面上部の入力値（精算期間・氏名）
  const [startDate, setStartDate] = useState<string>(initialPeriod.start);
  const [name, setName] = useState<string>("");
  const loadRequestIdRef = useRef(0);

  // 指定した開始日の月に紐づく明細をAPIから取得して画面に反映する
  // 複数の非同期呼び出しが重なった場合は最新のもの以外を破棄する
  const loadExpensesByStartDate = async (targetStartDate: string) => {
    const requestId = ++loadRequestIdRef.current;

    try {
      const monthlyExpenses = await fetchExpensesByStartDate(targetStartDate, currentEmpId);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (monthlyExpenses.length > 0) {
        setInvalidExpenseIds([]);
        setExpenses((prev) => (areExpensesEqual(prev, monthlyExpenses) ? prev : monthlyExpenses));
        return;
      }

      setExpenses((prev) => {
        const emptyRows = [createEmptyExpense(1)];
        setInvalidExpenseIds([]);
        return areExpensesEqual(prev, emptyRows) ? prev : emptyRows;
      });
    } catch (error) {
      console.error("精算期間データの取得に失敗しました", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const currentMonthStart = getInitialPeriod().start;

    // 初期表示時に、固定emp_idの氏名と当月明細を読み込む
    const loadInitialData = async () => {
      try {
        const profile = await fetchEmployeeProfile(currentEmpId);

        if (cancelled) {
          return;
        }

        setName(profile.name);
        await loadExpensesByStartDate(currentMonthStart);
      } catch (error) {
        console.error("初期データの取得に失敗しました", error);
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  // マウント時の1回のみ実行するため依存配列は意図的に空にしている
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 開始日変更時に、その日の属する月データを再取得する
  const handleStartDateChange = (value: string) => {
    if (value === startDate) {
      return;
    }

    setInvalidExpenseIds([]);
    setStartDate(value);
    void loadExpensesByStartDate(value);
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
        setInvalidExpenseIds([]);
        setExpenses([createEmptyExpense(1)]);
        closeDialog();
      },
    });
  };

  // 登録ボタン押下時の処理。バリデーション後に確認ダイアログを表示し、OKならDBへ登録する
  const handleRegisterConfirm = () => {
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

    if (!hasInputInAnyRow(expenses)) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "登録対象の明細を1件以上入力してください。",
        type: "alert",
        onConfirm: closeDialog,
      });
      return;
    }

    const invalidExpenses = expenses.filter(isMissingRequiredFields);

    if (invalidExpenses.length > 0) {
      setInvalidExpenseIds(invalidExpenses.map((expense) => expense.id));
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "区間（乗車駅・降車駅）と金額を入力してください。",
        type: "alert",
        onConfirm: closeDialog,
      });
      return;
    }

    setDialog({
      isOpen: true,
      title: "確認",
      message: "登録します。よろしいですか？",
      type: "confirm",
      onConfirm: async () => {
        try {
          await registerExpenses({
            expenses,
            startDate,
            name,
            empId: currentEmpId,
          });
          setDialog({
            isOpen: true,
            title: "完了",
            message: `登録しました。`,
            type: "info",
            onConfirm: closeDialog,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "DB登録中にエラーが発生しました。";

          setDialog({
            isOpen: true,
            title: "登録エラー",
            message,
            type: "alert",
            onConfirm: closeDialog,
          });
        }
      },
    });
  };

  // 出力ボタン押下時の処理。氏名チェック後に確認ダイアログを表示し、OKならExcelを出力する
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
    // 日数は0〜99の範囲で入力できるように制限する
    if (!/^\d{0,2}$/.test(value)) {
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
  const isReferenceMode = isReferenceModeMonth(startDate);
  const endDate = getMonthEndDateFromStart(startDate);

  return {
    expenses,
    invalidExpenseIds,
    dialog,
    isReferenceMode,
    startDate,
    name,
    totalAmount,
    formatAmount,
    formatAmountInput,
    getRowTotal,
    closeDialog,
    handleStartDateChange,
    handleDateInputClick,
    handleAdd,
    handleDelete,
    handleAmountChange,
    handleTripTypeChange,
    handlePeriodChange,
    handleExpenseFieldChange,
    handleClearAll,
    handleRegisterConfirm,
    handleExportConfirm,
  };
};
