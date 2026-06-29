import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import ChatPage    from './pages/ChatPage'
import MemoryPage  from './pages/MemoryPage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/analyze"       element={<AnalyzePage />} />
        <Route path="/chat/:repoId"  element={<ChatPage />} />
        <Route path="/memory/:repoId" element={<MemoryPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
