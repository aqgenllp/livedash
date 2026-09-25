import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {ThemeProvider} from '@mui/material/styles'
import { CssBaseline } from '@mui/material';
import { theme } from './utils/theme.ts';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
  <CssBaseline/>
  <StrictMode>
    <App />
  </StrictMode>
</ThemeProvider>
)
