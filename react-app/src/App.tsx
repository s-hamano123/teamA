/**
 * アプリのルートコンポーネント。
 * ログイン状態を管理し、未ログイン時はログイン画面、ログイン後は精算画面を表示する。
 */
import { useState } from 'react'
import { ExpenseSettlementPage } from './pages/ExpenseSettlementPage'
import { LoginPage } from './pages/LoginPage'

// ログイン状態と社員IDを保持するルートコンポーネント
export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [empId, setEmpId] = useState('')

  // ログイン済みなら精算画面、未ログインならログイン画面を表示する
  return isLoggedIn ? (
    <ExpenseSettlementPage empId={empId} />
  ) : (
    <LoginPage
      onLoginSuccess={(nextEmpId) => {
        setEmpId(nextEmpId)
        setIsLoggedIn(true)
      }}
    />
  )
}
