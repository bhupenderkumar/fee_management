import { notFound } from 'next/navigation'
import TabContent from '@/components/TabContent'

interface PageProps {
  params: Promise<{
    tab: string
  }>
}

// Valid tab types
const validTabs = ['dashboard', 'attendance', 'collection', 'records', 'pending', 'birthdays', 'students'] as const
type TabType = typeof validTabs[number]

// Tab configuration
const tabConfig = {
  dashboard: { name: 'Dashboard', description: 'Overview of attendance and fees' },
  attendance: { name: 'Attendance', description: 'Mark and manage student attendance' },
  collection: { name: 'Fee Collection', description: 'Record new fee payments' },
  records: { name: 'Fee Records', description: 'View all fee submission records' },
  pending: { name: 'Pending Fees', description: 'View students with pending fees' },
  birthdays: { name: 'Birthdays', description: 'Celebrate student birthdays' },
  students: { name: 'Students', description: 'Manage all student records and information' },
}

export default async function TabPage({ params }: PageProps) {
  const { tab } = await params
  
  // Validate tab parameter
  if (!validTabs.includes(tab as TabType)) {
    notFound()
  }
  
  const tabInfo = tabConfig[tab as TabType]

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-black">
          {tabInfo.name}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {tabInfo.description}
        </p>
      </div>
      <TabContent tab={tab} />
    </div>
  )
}

// Generate static params for better performance
export function generateStaticParams() {
  return validTabs.map((tab) => ({
    tab: tab,
  }))
}
