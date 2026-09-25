import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import MainLayout from './layout/MainLayout'
import Formation from './components/formation_section/Formation'
import Formation_report from './components/formation_section/Formation_report'
import ProductionMonitor from './components/production_data/ProductionMonitor'
import Cosmetic from './components/cosmetic_section/Cosmetic'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Navigate to="formation" replace />} />
          <Route path="formation" element={<Formation />} />
          <Route path="formation/report" element={<Formation_report />} />
          <Route path="production/monitor" element={<ProductionMonitor />} />
          <Route path="production/cosmetic" element={<Cosmetic />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard/formation" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;



