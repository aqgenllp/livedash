import { useEffect, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import MainLayout from './layout/MainLayout'
import Formation from './components/formation_section/Formation'
import Formation_report from './components/formation_section/Formation_report'
import ProductionMonitor from './components/production_data/ProductionMonitor'
import Cosmetic from './components/cosmetic_section/Cosmetic'
import { api } from './utils/Api'
import type { MachineSection } from './utils/sidebarConfig'

interface ClientDataResponse {
  text: string
  data?: {
    section?: string
  }
}

function App() {
  return (
    <BrowserRouter>
      <MachineRoutes />
    </BrowserRouter>
  )
}

function MachineRoutes() {
  const [machineSection, setMachineSection] = useState<MachineSection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    api.get<ClientDataResponse>('/api/clientData')
      .then(({ data }) => {
        if (!active) return

        if (data.text === 'MACHINE DATA FOUND') {
          const section = data.data?.section?.trim().toUpperCase()
          setMachineSection(section === 'HOT' || section === 'COLD' ? section : 'UNREGISTERED')
        } else if (data.text === 'MACHINE NOT REGISTERED') {
          setMachineSection('UNREGISTERED')
        } else {
          throw new Error(data.text || 'Unable to determine machine registration')
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to determine machine registration')
        }
      })

    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Failed to determine machine registration: {error}
        </Typography>
      </Box>
    )
  }

  if (!machineSection) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: '100vh' }}>
        <CircularProgress />
        <Typography>Checking machine registration...</Typography>
      </Box>
    )
  }

  const defaultPath = machineSection === 'HOT' ? 'formation'
    : machineSection === 'COLD'
      ? 'production/cosmetic'
      : 'production/monitor'
  const defaultRoute = `/dashboard/${defaultPath}`

  return (
    <Routes>
      <Route path="/dashboard" element={<MainLayout machineSection={machineSection} />}>
        <Route index element={<Navigate to={defaultRoute} replace />} />
        {machineSection === 'HOT' && (
          <>
            <Route path="formation" element={<Formation />} />
            <Route path="formation/report" element={<Formation_report />} />
          </>
        )}
        {machineSection === 'COLD' && (
          <Route path="production/cosmetic" element={<Cosmetic />} />
        )}
        {machineSection === 'UNREGISTERED' && (
          <Route path="production/monitor" element={<ProductionMonitor />} />
        )}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  )
}

export default App;

