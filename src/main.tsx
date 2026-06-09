import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import CreatorsPage from './pages/CreatorsPage.tsx'
import TermsPage from './pages/TermsPage.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
