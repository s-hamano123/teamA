import * as XLSX from "xlsx-js-style";

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

const getRowTotal = (expense: Expense): number => {
  const base = expense.amount * expense.period;
  return expense.tripType === "往復" ? base * 2 : base;
};

// 共通の罫線スタイル
const borderStyle = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
};

const ensureStyledCell = (
  ws: XLSX.WorkSheet,
  cellAddress: string,
  style: Record<string, unknown>
) => {
  if (!ws[cellAddress]) {
    ws[cellAddress] = { t: "s", v: "" } as XLSX.CellObject;
  }
  ws[cellAddress].s = style;
};

export const exportToExcel = async (
  expenses: Expense[],
  fromDate: string,
  toDate: string,
  name: string
): Promise<void> => {
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
    ["日付", "支払先", "乗車駅", "降車駅", "金額", "区分", "日数", "合計", "備考"],
  ];

  // 表データを追加
  expenses.forEach((expense) => {
    reportData.push([
      expense.date,
      expense.paymentType,
      expense.fromStation,
      expense.toStation,
      expense.amount,
      expense.tripType,
      expense.period,
      getRowTotal(expense),
      expense.remark,
    ]);
  });

  // 空行を追加
  reportData.push([]);
  reportData.push(["合計金額", "", "", "", totalAmount]);

  // ワークシートを作成
  const ws = XLSX.utils.aoa_to_sheet(reportData);

  // 列幅を設定
  ws["!cols"] = [
    { wch: 12 }, // 日付
    { wch: 10 }, // 支払先
    { wch: 10 }, // 乗車駅
    { wch: 10 }, // 降車駅
    { wch: 12 }, // 金額
    { wch: 8 }, // 区分
    { wch: 6 }, // 日数
    { wch: 12 }, // 合計
    { wch: 15 }, // 備考
  ];

  // タイトル行（A1）のスタイル設定
  if (ws["A1"]) {
    ws["A1"].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "80BB50" } },
    };
  }

  // タイトル行のセル結合 (A1:I1)
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  // A2行（空行）のスタイル設定 - 罫線なし
  const a2Cells = ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "I2"];
  a2Cells.forEach((cell) => {
    ensureStyledCell(ws, cell, {});
  });

  // 精算期間と氏名のスタイル
  ["A3", "A4"].forEach((cell) => {
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "left" },
      };
    }
  });

  // ヘッダー行（6行目）のスタイル設定
  const headerCells = ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6", "I6"];
  headerCells.forEach((cell) => {
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "548235" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderStyle,
      };
    }
  });

  // データ行のスタイル設定（7行目以降）
  const dataStartRow = 7;
  const dataEndRow = dataStartRow + expenses.length - 1;

  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    cols.forEach((col, idx) => {
      const cell = `${col}${r}`;
      if (ws[cell]) {
        ws[cell].s = {
          alignment: { horizontal: idx === 4 || idx === 7 ? "right" : "left" },
          border: borderStyle,
        };
        // 金額列と合計列には数値フォーマット
        if (idx === 4 || idx === 7) {
          ws[cell].z = "#,##0";
        }
      }
    });
  }

  // 合計金額行のスタイル
  const totalRow = dataEndRow + 2;
  if (ws[`A${totalRow}`]) {
    ws[`A${totalRow}`].s = {
      font: { bold: true },
      alignment: { horizontal: "left" },
      border: borderStyle,
    };
  }
  if (ws[`E${totalRow}`]) {
    ws[`E${totalRow}`].s = {
      font: { bold: true },
      alignment: { horizontal: "right" },
      border: borderStyle,
    };
    ws[`E${totalRow}`].z = "#,##0";
  }

  // 合計金額行の空セルにも罫線を追加
  ["B", "C", "D"].forEach((col) => {
    const cell = `${col}${totalRow}`;
    ensureStyledCell(ws, cell, { border: borderStyle });
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
    if ("showSaveFilePicker" in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel ファイル",
            accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
      await writable.write(buffer);
      await writable.close();
    } else {
      // フォールバック: 通常のダウンロード
      XLSX.writeFile(wb, fileName);
    }
  } catch (error) {
    // ユーザーがキャンセルした場合など
    console.log("ファイル保存がキャンセルされました");
  }
};
