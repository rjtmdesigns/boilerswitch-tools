import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import EligibilityCalculator from './pages/EligibilityCalculator'
import ComparisonTool from './pages/ComparisonTool'
import GetAQuote from './pages/GetAQuote'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EligibilityCalculator />} />
        <Route path="/eligibility" element={<EligibilityCalculator />} />
        <Route path="/comparison" element={<ComparisonTool />} />
        <Route path="/get-quotes" element={<GetAQuote />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
