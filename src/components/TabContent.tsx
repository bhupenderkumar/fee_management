'use client'

import FeeManagementForm from './FeeManagementForm'
import FeeRecordsComponent from './FeeRecordsComponent'
import PendingFeesComponent from './PendingFeesComponent'
import AttendanceManagement from './AttendanceManagement'
import DashboardAnalytics from './DashboardAnalytics'
import BirthdayManagement from './BirthdayManagement'
import StudentManagement from './StudentManagement'
import BulkFeeEntry from './BulkFeeEntry'

interface TabContentProps {
  tab: string
}

export default function TabContent({ tab }: TabContentProps) {
  const renderContent = () => {
    switch (tab) {
      case 'dashboard':
        return <DashboardAnalytics />
      case 'attendance':
        return <AttendanceManagement />
      case 'collection':
        return <FeeManagementForm />
      case 'bulk-entry':
        return <BulkFeeEntry />
      case 'records':
        return <FeeRecordsComponent />
      case 'pending':
        return <PendingFeesComponent />
      case 'birthdays':
        return <BirthdayManagement />
      case 'students':
        return <StudentManagement />
      default:
        return <DashboardAnalytics />
    }
  }

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  )
}
