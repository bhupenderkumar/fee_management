import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to dashboard tab by default
  redirect('/dashboard/dashboard')
}
