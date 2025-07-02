import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FileSignature, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggle: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggle }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-2 sm:px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-100">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-3 sm:mb-4">
              <FileSignature className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SignaturePro
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              {mode === 'signin' ? 'Welcome back! Please sign in' : 'Create your account to get started'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-12 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <p className="text-red-600 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Processing...</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={onToggle}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}