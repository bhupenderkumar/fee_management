'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, FileText, Clock, BarChart3, UserCheck, Menu, X, Cake, Users, PlusCircle } from 'lucide-react'
import LogoutButton, { SecurityIndicator } from '@/components/LogoutButton'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Extract current tab from pathname
  const currentTab = pathname.split('/')[2] || 'dashboard'

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Overview of attendance and fees' },
    { id: 'attendance', name: 'Attendance', icon: UserCheck, description: 'Mark and manage student attendance' },
    { id: 'collection', name: 'Fee Collection', icon: CreditCard, description: 'Record new fee payments' },
    { id: 'bulk-entry', name: 'Bulk Fee Entry', icon: PlusCircle, description: 'Enter multiple fee payments quickly' },
    { id: 'records', name: 'Fee Records', icon: FileText, description: 'View all fee submission records' },
    { id: 'pending', name: 'Pending Fees', icon: Clock, description: 'View students with pending fees' },
    { id: 'birthdays', name: 'Birthdays', icon: Cake, description: 'Celebrate student birthdays' },
    { id: 'students', name: 'Students', icon: Users, description: 'Manage all student records and information' },
  ]

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-amber-200">
                FS
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">
                  First Step School
                </h1>
                <p className="text-xs text-gray-600">
                  Saurabh Vihar, Jaitpur, Delhi
                </p>
              </div>
            </div>
            
            {/* Right side - Security indicator and logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <SecurityIndicator />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="hidden md:block">
                  <LogoutButton />
                </div>
                
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-black hover:text-gray-600 transition-colors">
                    {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Sidebar Navigation */}
          <aside className={`md:w-60 mb-6 md:mb-0 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-20 md:z-0`}>
            <nav className="h-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 pt-20 md:pt-4">
              <h2 className="text-lg font-semibold mb-4 text-black px-4">Menu</h2>
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = currentTab === tab.id
                  return (
                    <li key={tab.id}>
                      <Link
                        href={`/dashboard/${tab.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-300'
                            : 'text-amber-800 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 hover:text-amber-900 hover:shadow-sm'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{tab.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              
              {/* Mobile logout button and security indicator */}
              <div className="md:hidden mt-6 pt-4 border-t border-gray-200 px-4 space-y-3">
                <SecurityIndicator />
                <LogoutButton variant="menu-item" className="w-full" />
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white border border-amber-200 rounded-xl shadow-lg min-h-[calc(100vh-8rem)] overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  )
}
