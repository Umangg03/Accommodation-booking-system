import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PrimeReactProvider } from '@primereact/core';


createRoot(document.getElementById('root')).render(
  <PrimeReactProvider>
  <StrictMode>
      <App />
  </StrictMode>
  </PrimeReactProvider>,
)
