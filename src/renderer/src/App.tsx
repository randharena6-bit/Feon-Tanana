import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Dataset from './pages/Dataset'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Translate from './pages/Translate'

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/translate" element={<Translate />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
