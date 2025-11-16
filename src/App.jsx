import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Viewer from './pages/Viewer'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/viewer" element={<Viewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}