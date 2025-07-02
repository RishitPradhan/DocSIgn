import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, FileSignature, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <FileSignature className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SignaturePro
              </span>
            </div>
            {user && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto justify-center"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 w-full">
        {children}
      </main>
    </div>
  )
}