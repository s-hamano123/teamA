import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '../styles/index.css'
import { ExpenseSettlementPage } from '../pages/ExpenseSettlementPage'
import { LoginPage } from '../pages/LoginPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ExpenseSettlementPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)