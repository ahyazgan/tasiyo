import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './index.css'
import App from './App.jsx'
import { registerSW } from './utils/pwa'
import { initNative, isNative } from './native/capacitor'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Native (iOS/Android) kabukta: plugin kurulumu + service worker KAPALI
// (Capacitor kendi WebView'ından servis eder; SW cache çakışması yaratabilir).
if (isNative()) {
  initNative()
} else {
  registerSW()
}
