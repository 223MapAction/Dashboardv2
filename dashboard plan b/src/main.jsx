import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modals.css'
import App from './App.jsx'

// Suppress harmless maplibre-gl / browser tile abort warnings & error overlays in development
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.name === 'AbortError' || 
      event.reason.message === 'signal is aborted without reason' ||
      (event.reason.message && event.reason.message.includes('aborted'))
    )) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
