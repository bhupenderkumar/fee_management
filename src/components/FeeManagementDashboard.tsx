'use client'

import { useState } from 'react'
import { CreditCard, FileText, Clock, BarChart3, UserCheck, Menu, X } from 'lucide-react'
import FeeManagementForm from './FeeManagementForm'
import FeeRecordsComponent from './FeeRecordsComponent'
import PendingFeesComponent from './PendingFeesComponent'
import AttendanceManagement from './AttendanceManagement'
import DashboardAnalytics from './DashboardAnalytics'

type TabType = 'dashboard' | 'attendance' | 'collection' | 'records' | 'pending'

export default function FeeManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Dashboard', icon: BarChart3, description: 'Overview of attendance and fees' },
    { id: 'attendance' as TabType, name: 'Attendance', icon: UserCheck, description: 'Mark and manage student attendance' },
    { id: 'collection' as TabType, name: 'Fee Collection', icon: CreditCard, description: 'Record new fee payments' },
    { id: 'records' as TabType, name: 'Fee Records', icon: FileText, description: 'View all fee submission records' },
    { id: 'pending' as TabType, name: 'Pending Fees', icon: Clock, description: 'View students with pending fees' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardAnalytics />
      case 'attendance': return <AttendanceManagement />
      case 'collection': return <FeeManagementForm />
      case 'records': return <FeeRecordsComponent />
      case 'pending': return <PendingFeesComponent />
      default: return <DashboardAnalytics />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/80 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                FS
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  First Step School
                </h1>
                <p className="text-xs text-blue-200">
                  Saurabh Vihar, Jaitpur, Delhi
                </p>
              </div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-blue-300 transition-colors">
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Sidebar Navigation */}
          <aside className={`md:w-60 mb-6 md:mb-0 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-20 md:z-0`}>
            <nav className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 pt-20 md:pt-4">
              <h2 className="text-lg font-semibold mb-4 text-blue-200 px-4">Menu</h2>
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${isActive ? 'bg-blue-500/80 text-white shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}>
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{tab.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-h-[calc(100vh-8rem)]">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="mt-1 text-sm text-blue-200">
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
