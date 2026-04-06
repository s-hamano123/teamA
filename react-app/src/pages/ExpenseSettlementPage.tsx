import { SettlementHeader } from "../components/SettlementHeader";
import { AmountSummary } from "../components/AmountSummary";
import { ExpenseTable } from "../components/ExpenseTable";
import { Dialog } from "../components/Dialog";
import { useExpenseSettlement } from "../hooks/useExpenseSettlement";
import "../styles/expenseSettlement.css";

/**
 * 交通費精算機能の画面本体です。
 * 入力欄、明細テーブル、ダイアログを組み合わせて表示します。
 */
export const ExpenseSettlementPage = () => {
  const {
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
  } = useExpenseSettlement();

  return (
    <div>
      <h1>交通費精算</h1>
      <SettlementHeader
        startDate={startDate}
        endDate={endDate}
        name={name}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onNameChange={setName}
        onDateInputClick={handleDateInputClick}
      />

      <AmountSummary
        totalAmount={totalAmount}
        formatAmount={formatAmount}
        onClearAll={handleClearAll}
        onExport={handleExportConfirm}
      />

      <ExpenseTable
        expenses={expenses}
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
