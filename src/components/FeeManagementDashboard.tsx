'use client'

import { useState } from 'react'
import { CreditCard, FileText, Clock, BarChart3, UserCheck, Menu, X, Cake, Users, PlusCircle } from 'lucide-react'
import FeeManagementForm from './FeeManagementForm'
import FeeRecordsComponent from './FeeRecordsComponent'
import PendingFeesComponent from './PendingFeesComponent'
import AttendanceManagement from './AttendanceManagement'
import DashboardAnalytics from './DashboardAnalytics'
import BirthdayManagement from './BirthdayManagement'
import StudentManagement from './StudentManagement'
import BulkFeeEntry from './BulkFeeEntry'
import LogoutButton, { SecurityIndicator } from './LogoutButton'

type TabType = 'dashboard' | 'attendance' | 'collection' | 'bulk-entry' | 'records' | 'pending' | 'birthdays' | 'students'

export default function FeeManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Dashboard', icon: BarChart3, description: 'Overview of attendance and fees' },
    { id: 'attendance' as TabType, name: 'Attendance', icon: UserCheck, description: 'Mark and manage student attendance' },
    { id: 'collection' as TabType, name: 'Fee Collection', icon: CreditCard, description: 'Record new fee payments' },
    { id: 'bulk-entry' as TabType, name: 'Bulk Fee Entry', icon: PlusCircle, description: 'Enter multiple fee payments quickly' },
    { id: 'records' as TabType, name: 'Fee Records', icon: FileText, description: 'View all fee submission records' },
    { id: 'pending' as TabType, name: 'Pending Fees', icon: Clock, description: 'View students with pending fees' },
    { id: 'birthdays' as TabType, name: 'Birthdays', icon: Cake, description: 'Celebrate student birthdays' },
    { id: 'students' as TabType, name: 'Students', icon: Users, description: 'Manage all student records and information' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardAnalytics />
      case 'attendance': return <AttendanceManagement />
      case 'collection': return <FeeManagementForm />
      case 'bulk-entry': return <BulkFeeEntry />
      case 'records': return <FeeRecordsComponent />
      case 'pending': return <PendingFeesComponent />
      case 'birthdays': return <BirthdayManagement />
      case 'students': return <StudentManagement />
      default: return <DashboardAnalytics />
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
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
                  const isActive = activeTab === tab.id
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}>
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{tab.name}</span>
                      </button>
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
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[calc(100vh-8rem)]">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-black">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
