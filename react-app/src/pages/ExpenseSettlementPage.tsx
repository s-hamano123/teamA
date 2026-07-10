import { SettlementHeader } from "../components/SettlementHeader";
import { AmountSummary } from "../components/AmountSummary";
import { ExpenseTable } from "../components/ExpenseTable";
import { Dialog } from "../components/Dialog";
import { useExpenseSettlement } from "../hooks/useExpenseSettlement";
import "../styles/expenseSettlement.css";

/**
 * 交通費精算ページの本体
 * 入力欄・明細テーブル・ダイアログをまとめて表示
 */
type ExpenseSettlementPageProps = {
  empId: string;
};

export const ExpenseSettlementPage = ({ empId }: ExpenseSettlementPageProps) => {
  const {
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
  } = useExpenseSettlement(empId);

  return (
    <div>
      <h1>交通費精算</h1>
      <SettlementHeader
        startDate={startDate}
        name={name}
        onStartDateChange={handleStartDateChange}
      />

      <AmountSummary
        totalAmount={totalAmount}
        isReferenceMode={isReferenceMode}
        formatAmount={formatAmount}
        onClearAll={handleClearAll}
        onRegister={handleRegisterConfirm}
        onExport={handleExportConfirm}
      />

      <ExpenseTable
        expenses={expenses}
        invalidExpenseIds={invalidExpenseIds}
        isReferenceMode={isReferenceMode}
        formatAmount={formatAmount}
        formatAmountInput={formatAmountInput}
        getRowTotal={getRowTotal}
        onDateInputClick={handleDateInputClick}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onAmountChange={handleAmountChange}
        onTripTypeChange={handleTripTypeChange}
        onPeriodChange={handlePeriodChange}
        onExpenseFieldChange={handleExpenseFieldChange}
      />

      <Dialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
};
