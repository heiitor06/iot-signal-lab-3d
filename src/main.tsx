import '@fontsource-variable/ibm-plex-sans'
import '@fontsource/ibm-plex-mono/400.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyTheme, readStoredTheme } from './hooks/useTheme'
import './index.css'

applyTheme(readStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
