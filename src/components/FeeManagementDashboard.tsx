'use client'

import { useState } from 'react'
import { CreditCard, FileText, Clock, Users, BarChart3, UserCheck } from 'lucide-react'
import FeeManagementForm from './FeeManagementForm'
import FeeRecordsComponent from './FeeRecordsComponent'
import PendingFeesComponent from './PendingFeesComponent'
import AttendanceManagement from './AttendanceManagement'
import DashboardAnalytics from './DashboardAnalytics'

type TabType = 'dashboard' | 'attendance' | 'collection' | 'records' | 'pending'

export default function FeeManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Overview of attendance and fees'
    },
    {
      id: 'attendance' as TabType,
      name: 'Attendance',
      icon: UserCheck,
      description: 'Mark and manage student attendance'
    },
    {
      id: 'collection' as TabType,
      name: 'Fee Collection',
      icon: CreditCard,
      description: 'Record new fee payments'
    },
    {
      id: 'records' as TabType,
      name: 'Fee Records',
      icon: FileText,
      description: 'View all fee submission records'
    },
    {
      id: 'pending' as TabType,
      name: 'Pending Fees',
      icon: Clock,
      description: 'View students with pending fees'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardAnalytics />
      case 'attendance':
        return <AttendanceManagement />
      case 'collection':
        return <FeeManagementForm />
      case 'records':
        return <FeeRecordsComponent />
      case 'pending':
        return <PendingFeesComponent />
      default:
        return <DashboardAnalytics />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                First Step School
              </h1>
              <p className="text-lg text-gray-600">
                Saurabh Vihar, Jaitpur, Delhi
              </p>
              <p className="text-sm text-gray-500">
                School Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 rounded-t-lg`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {/* Tab Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
              <p className="text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
