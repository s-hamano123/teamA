import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import { ExpenseSettlementPage } from '../pages/ExpenseSettlementPage'
import { LoginPage } from '../pages/LoginPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [empId, setEmpId] = useState('')

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)