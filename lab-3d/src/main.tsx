import '@fontsource-variable/ibm-plex-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Sem StrictMode: no React 19 a montagem dupla de desenvolvimento faz os rótulos
// Html do drei desmontarem suas raízes durante a renderização do R3F (erro no console).
createRoot(document.getElementById('root')!).render(<App />)
