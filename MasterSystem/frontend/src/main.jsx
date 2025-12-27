import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './electron.css'
import App from './App.jsx'

// Detect if running in Electron and add class for transparent background
if (window.electronAPI) {
  document.body.classList.add('electron-mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
