import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { AuthForm } from './components/AuthForm'
import { Dashboard } from './components/Dashboard'

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  return (
    <AuthForm 
      mode={authMode}
      onToggle={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
    />
  )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />
}

const AppRoutes: React.FC = () => {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" /> : <AuthWrapper />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/auth"} />} 
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App