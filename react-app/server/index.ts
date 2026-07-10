import cors from "cors";
import express, { type Request, type Response } from "express";
import { Pool, type QueryConfig } from "pg";

type ExpensePayload = {
  date: string;
  paymentType: string;
  fromStation: string;
  toStation: string;
  amount: number;
  tripType: "片道" | "往復";
  period: number;
  remark: string;
};

type RegisterRequestBody = {
  expenses: ExpensePayload[];
  startDate: string;
  name: string;
};

type SqlValue = string | number | Date;

type CandidateRow = Record<string, SqlValue>;

type ExpenseSelectRow = {
  item_no: number;
  date: string | Date;
  payee: string | number;
  from_sta: string | null;
  to_sta: string | null;
  amount: string | number;
  type: string | number;
  day_cnt: string | number;
  remarks: string | null;
};

type EmployeeMasterRow = {
  emp_id: string;
  emp_lname: string | null;
  emp_fname: string | null;
};

const PORT = Number(process.env.PORT ?? 3002);
const DB_HOST = process.env.PGHOST ?? "192.168.1.82";
const DB_NAME = process.env.PGDATABASE ?? "actdb";
const DB_USER = process.env.PGUSER ?? "actuser";
const DB_PASSWORD = process.env.PGPASSWORD ?? "actuser";
const DB_PORT = Number(process.env.PGPORT ?? 5432);
const DB_SCHEMA = process.env.PGSCHEMA ?? "public";
const TABLE_NAME = "a_transportation_expenses_info";
const EMPLOYEE_MASTER_TABLE = "employee_mst";
const DEFAULT_EMP_ID = process.env.DEFAULT_EMP_ID ?? "0000000003";

const pool = new Pool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
});

const app = express();
app.use(cors());
app.use(express.json());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const toNumberValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeTripType = (value: unknown): "片道" | "往復" =>
  value === "往復" ? "往復" : "片道";

const normalizeExpense = (value: unknown): ExpensePayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    date: toStringValue(value.date),
    paymentType: toStringValue(value.paymentType),
    fromStation: toStringValue(value.fromStation),
    toStation: toStringValue(value.toStation),
    amount: toNumberValue(value.amount),
    tripType: normalizeTripType(value.tripType),
    period: toNumberValue(value.period),
    remark: toStringValue(value.remark),
  };
};

const parseRegisterRequestBody = (body: unknown): RegisterRequestBody | null => {
  if (!isRecord(body)) {
    return null;
  }

  if (!Array.isArray(body.expenses)) {
    return null;
  }

  const expenses = body.expenses
    .map((expense) => normalizeExpense(expense))
    .filter((expense): expense is ExpensePayload => expense !== null);

  return {
    expenses,
    startDate: toStringValue(body.startDate),
    name: toStringValue(body.name),
  };
};

const isBlankRow = (expense: ExpensePayload): boolean =>
  expense.date.trim() === "" &&
  expense.fromStation.trim() === "" &&
  expense.toStation.trim() === "" &&
  Number(expense.amount) === 0 &&
  expense.remark.trim() === "";

const hasRowMissingDate = (expense: ExpensePayload): boolean =>
  expense.date.trim() === "" &&
  (expense.fromStation.trim() !== "" ||
    expense.toStation.trim() !== "" ||
    Number(expense.amount) > 0 ||
    expense.remark.trim() !== "");

const getRowTotal = (expense: ExpensePayload): number => {
  const base = Number(expense.amount) * Number(expense.period);
  return expense.tripType === "往復" ? base * 2 : base;
};

const getSettlementMonth = (value: string): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const buildInsertRow = (params: {
  empId: string;
  settleMonth: string;
  expense: ExpensePayload;
  itemNo: number;
}): CandidateRow => {
  const { empId, settleMonth, expense, itemNo } = params;
  const rowTotal = getRowTotal(expense);

  return {
    emp_id: empId,
    settle_month: settleMonth,
    item_no: itemNo,
    date: expense.date,
    payee: expense.paymentType === "ICチップ" ? "1" : "2",
    from_sta: expense.fromStation,
    to_sta: expense.toStation,
    amount: Number(expense.amount),
    type: expense.tripType === "往復" ? "1" : "2",
    day_cnt: String(expense.period),
    total_amt: rowTotal,
    remarks: expense.remark,
  };
};

const createInsertStatement = (
  columns: string[],
  values: SqlValue[]
): QueryConfig<SqlValue[]> => {
  const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
  const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(", ");

  return {
    text: `INSERT INTO "${DB_SCHEMA}"."${TABLE_NAME}" (${quotedColumns}) VALUES (${placeholders})`,
    values,
  };
};

const buildInsertStatement = (candidateRow: CandidateRow): QueryConfig<SqlValue[]> => {
  const columns = [
    "emp_id",
    "settle_month",
    "item_no",
    "date",
    "payee",
    "from_sta",
    "to_sta",
    "amount",
    "type",
    "day_cnt",
    "total_amt",
    "remarks",
  ];

  const values = columns.map((column) => candidateRow[column]);

  return createInsertStatement(columns, values);
};

const toYyyyMmDd = (value: string | Date): string => {
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (text.includes("T") && text.length >= 10) {
    return text.slice(0, 10);
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toPaymentType = (value: string | number): "ICチップ" | "切符" =>
  String(value) === "1" ? "ICチップ" : "切符";

const toTripType = (value: string | number): "往復" | "片道" =>
  String(value) === "1" ? "往復" : "片道";

const getEmpIdFromQuery = (value: unknown): string => {
  if (typeof value !== "string") {
    return DEFAULT_EMP_ID;
  }

  const trimmed = value.trim();
  return trimmed === "" ? DEFAULT_EMP_ID : trimmed;
};

const toEmployeeName = (params: {
  empLname: string | null;
  empFname: string | null;
}): string => {
  const { empLname, empFname } = params;
  return [empLname ?? "", empFname ?? ""].filter(Boolean).join(" ");
};

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/employee-profile", async (req: Request, res: Response) => {
  const empId = getEmpIdFromQuery(req.query.empId);

  try {
    const result = await pool.query<EmployeeMasterRow>(
      `SELECT emp_id, emp_lname, emp_fname
         FROM "${DB_SCHEMA}"."${EMPLOYEE_MASTER_TABLE}"
        WHERE emp_id = $1
        LIMIT 1`,
      [empId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "社員マスタに対象社員が存在しません。" });
      return;
    }

    const row = result.rows[0];
    const name = toEmployeeName({
      empLname: row.emp_lname,
      empFname: row.emp_fname,
    });

    res.json({
      empId: row.emp_id,
      name,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "社員情報取得中に予期しないエラーが発生しました。";

    res.status(500).json({ message });
  }
});

app.get("/api/transportation-expenses", async (req: Request, res: Response) => {
  const startDateQuery =
    typeof req.query.startDate === "string" ? req.query.startDate : "";
  const empId = getEmpIdFromQuery(req.query.empId);

  const baseDate = startDateQuery || new Date().toISOString().slice(0, 10);
  const settleMonth = getSettlementMonth(baseDate);

  if (!settleMonth) {
    res.status(400).json({ message: "startDate の形式が不正です。" });
    return;
  }

  try {
    // 初期表示用: 指定月の明細を画面表示順(item_no)で返す
    const result = await pool.query<ExpenseSelectRow>(
      `SELECT item_no, date, payee, from_sta, to_sta, amount, type, day_cnt, remarks
         FROM "${DB_SCHEMA}"."${TABLE_NAME}"
        WHERE emp_id = $1
          AND settle_month = $2
        ORDER BY item_no`,
      [empId, settleMonth]
    );

    const expenses = result.rows.map((row) => ({
      id: Number(row.item_no),
      date: toYyyyMmDd(row.date),
      paymentType: toPaymentType(row.payee),
      fromStation: row.from_sta ?? "",
      toStation: row.to_sta ?? "",
      amount: toNumberValue(row.amount),
      tripType: toTripType(row.type),
      period: toNumberValue(row.day_cnt),
      remark: row.remarks ?? "",
    }));

    res.json({ expenses });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "データ取得中に予期しないエラーが発生しました。";

    res.status(500).json({ message });
  }
});

app.post(
  "/api/transportation-expenses/register",
  async (req: Request, res: Response) => {
    const body = parseRegisterRequestBody(req.body);

    if (!body) {
      res.status(400).json({ message: "リクエスト形式が不正です。" });
      return;
    }

    const { expenses, startDate, name } = body;

    if (!name || name.trim() === "") {
      res.status(400).json({ message: "氏名を入力してください。" });
      return;
    }

    if (expenses.length === 0) {
      res.status(400).json({ message: "登録対象の明細がありません。" });
      return;
    }

    const validExpenses = expenses.filter((expense) => !isBlankRow(expense));

    if (validExpenses.length === 0) {
      res.status(400).json({ message: "登録対象の明細を1件以上入力してください。" });
      return;
    }

    if (validExpenses.some(hasRowMissingDate)) {
      res.status(400).json({ message: "登録する明細の日付を入力してください。" });
      return;
    }

    const client = await pool.connect();
    const empId = DEFAULT_EMP_ID;
    const settleMonth = getSettlementMonth(startDate);

    try {
      await client.query("BEGIN");

      // 画面順で再採番するため、対象月の既存データを一度置き換える
      await client.query(
        `DELETE FROM "${DB_SCHEMA}"."${TABLE_NAME}"
          WHERE emp_id = $1
            AND settle_month = $2`,
        [empId, settleMonth]
      );

      let insertedCount = 0;

      for (const [index, expense] of validExpenses.entries()) {
        const candidateRow = buildInsertRow({
          empId,
          settleMonth,
          expense,
          itemNo: index + 1,
        });

        const statement = buildInsertStatement(candidateRow);

        await client.query(statement);
        insertedCount += 1;
      }

      if (insertedCount === 0) {
        throw new Error(
          "テーブルのカラム定義と登録データの対応が取れず、登録できませんでした。"
        );
      }

      await client.query("COMMIT");
      res.json({ insertedCount });
    } catch (error) {
      await client.query("ROLLBACK");

      const message =
        error instanceof Error
          ? error.message
          : "DB登録中に予期しないエラーが発生しました。";

      res.status(500).json({ message });
    } finally {
      client.release();
    }
  }
);

app.listen(PORT, () => {
  console.log(`API server started on http://localhost:${PORT}`);
});
