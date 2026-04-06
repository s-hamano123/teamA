import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import { ExpenseSettlementPage } from '../pages/ExpenseSettlementPage'

/**
 * アプリを起動する入口です。
 * ここで App コンポーネントを画面に表示します。
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExpenseSettlementPage />
  </StrictMode>,
)
