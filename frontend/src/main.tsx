import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'; 
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css';

// Import QueryClient dan QueryClientProvider dari react-query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import AuthProvider
import { AuthProvider } from './context/AuthContext';

// Init QueryClient
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)