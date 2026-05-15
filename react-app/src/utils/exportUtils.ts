/**
 * 交通費データを Excel 形式で出力するためのユーティリティファイル
 */

export type Expense = {
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

// 1行分の合計を計算（往復は2倍）
const getRowTotal = (expense: Expense): number => {
  const base = expense.amount * expense.period;
  return expense.tripType === "往復" ? base * 2 : base;
};

// どのセルにも使う共通の罫線スタイル
const borderStyle = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
};

type WorksheetCell = {
  t?: string;
  v?: string | number;
  s?: Record<string, unknown>;
  z?: string;
};

type WorksheetLike = {
  [key: string]: unknown;
  ["!cols"]?: Array<{ wch: number }>;
  ["!merges"]?: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>;
};

const ensureStyledCell = (
  ws: Record<string, WorksheetCell | undefined>,
  cellAddress: string,
  style: Record<string, unknown>
) => {
  const existingCell = ws[cellAddress];

  // セルが未作成なら空セルを先に作る
  if (!existingCell) {
    ws[cellAddress] = { t: "s", v: "" };
  }

  (ws[cellAddress] as WorksheetCell).s = style;
};

/**
 * 入力された明細を Excel ファイルとして保存します。
 */
export const exportToExcel = async (
  expenses: Expense[],
  fromDate: string,
  toDate: string,
  name: string
): Promise<void> => {
  const XLSX = await import("xlsx-js-style");

  // ワークブックを作成
  const wb = XLSX.utils.book_new();

  // 合計を計算
  const totalAmount = expenses.reduce((sum, e) => sum + getRowTotal(e), 0);

  // データの準備
  const reportData: (string | number)[][] = [
    ["交通費精算書"],
    [],
    ["精算期間", `${fromDate}〜${toDate}`],
    ["氏名", name],
    [],
    ["合計金額：", totalAmount, "", "", "", "", "", ""], // 6行目：合計行
    [], // 7行目：空行
    ["日付", "支払先", "区間", "金額", "区分", "日数", "合計", "備考"], // 8行目：ヘッダー行
  ];

  // 表データを追加
  expenses.forEach((expense) => {
    const fromStation = expense.fromStation.trim();
    const toStation = expense.toStation.trim();
    const route =
      fromStation && toStation
        ? `${fromStation}〜${toStation}`
        : fromStation || toStation || "";

    reportData.push([
      expense.date,
      expense.paymentType,
      route,
      expense.amount,
      expense.tripType,
      expense.period,
      getRowTotal(expense),
      expense.remark,
    ]);
  });

  // ワークシートを作成
  const ws = XLSX.utils.aoa_to_sheet(reportData) as WorksheetLike;
  const cellMap = ws as Record<string, WorksheetCell | undefined>;

  // 列幅を設定
  ws["!cols"] = [
    { wch: 12 }, // 日付
    { wch: 10 }, // 支払先
    { wch: 24 }, // 利用区間
    { wch: 12 }, // 金額
    { wch: 8 }, // 区分
    { wch: 6 }, // 日数
    { wch: 12 }, // 合計
    { wch: 15 }, // 備考
  ];

  // タイトル行（A1）のスタイル設定
  if (cellMap["A1"]) {
    cellMap["A1"].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "80BB50" } },
    };
  }

  // タイトル行のセル結合 (A1:H1)
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

  // A2行（空行）のスタイル設定 - 罫線なし
  const a2Cells = ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"];
  a2Cells.forEach((cell) => {
    ensureStyledCell(cellMap, cell, {});
  });

  // 精算期間と氏名のスタイル
  ["A3", "A4"].forEach((cell) => {
    if (cellMap[cell]) {
      cellMap[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "left" },
      };
    }
  });

  // ヘッダー行（8行目）のスタイル設定
  const headerCells = ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"];
  headerCells.forEach((cell) => {
    if (cellMap[cell]) {
      cellMap[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "548235" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderStyle,
      };
    }
  });

  // データ行のスタイル設定（9行目以降）
  const dataStartRow = 9;
  const dataEndRow = dataStartRow + expenses.length - 1;

  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
    cols.forEach((col, idx) => {
      const cell = `${col}${r}`;
      if (cellMap[cell]) {
        cellMap[cell].s = {
          alignment: { horizontal: idx === 3 || idx === 6 ? "right" : "left" },
          border: borderStyle,
        };
        // 金額列と合計列には数値フォーマット
        if (idx === 3 || idx === 6) {
          cellMap[cell].z = "#,##0";
        }
      }
    });
  }

  // 合計金額行のスタイル
  const totalRow = 6; // 合計行は6行目に固定
  
  // 外側の枠線を適用
  const leftBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
  };
  const rightBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  
  ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col, index) => {
    const cell = `${col}${totalRow}`;
    ensureStyledCell(cellMap, cell, {});
    
    const cellObj = cellMap[cell] as WorksheetCell;
    let borderToUse = {}; // デフォルトは枠線なし
    
    // 外側の枠線を設定（A・B列のみ）
    if (index === 0) {
      borderToUse = leftBorder; // A列: 左枠線
    } else if (index === 1) {
      borderToUse = rightBorder; // B列: 右枠線（A・B列をボックスで囲む）
    }
    // C～H列は枠線なし
    
    if (index === 0) {
      // A列: ラベル
      cellObj.s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderToUse,
        fill: { patternType: "solid", fgColor: { rgb: "E8F5E9" } },
      };
    } else if (index === 1) {
      // B列: 合計金額
      cellObj.t = "n"; // 数値型に明示的に設定
      cellObj.s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "right", vertical: "center" },
        border: borderToUse,
        fill: { patternType: "solid", fgColor: { rgb: "F1F8E9" } },
      };
      cellObj.z = "¥#,##0"; // 通貨フォーマット（円記号付きカンマ区切り）
    } else {
      // C～H列: 空セル（背景色なし、枠線なし）
      cellObj.s = {};
    }
  });

  // ワークシートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws, "交通費精算");

  // ファイル名を作成（YYYY年MM月 会計報告書_氏名）
  const date = new Date(fromDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const fileName = `${year}年${month}月 会計報告書_${name || "未記入"}.xlsx`;

  // ファイルを出力（保存先を選択）
  try {
    // File System Access API をサポートしている場合
    type WritableFileStream = {
      write: (data: ArrayBuffer | Uint8Array | Blob) => Promise<void>;
      close: () => Promise<void>;
    };
    type SaveFileHandle = {
      createWritable: () => Promise<WritableFileStream>;
    };
    const windowWithPicker = window as Window & {
      showSaveFilePicker?: (options?: unknown) => Promise<SaveFileHandle>;
    };

    if (windowWithPicker.showSaveFilePicker) {
      const handle = await windowWithPicker.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel ファイル",
            accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      const workbookData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const workbookBlob = new Blob([workbookData as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      await writable.write(workbookBlob);
      await writable.close();
    } else {
      // フォールバック: 通常のダウンロード
      XLSX.writeFile(wb, fileName);
    }
  } catch {
    // ユーザーがキャンセルした場合など
    console.log("ファイル保存がキャンセルされました");
  }
};
