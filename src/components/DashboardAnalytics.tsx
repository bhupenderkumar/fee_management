'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AttendanceStats {
  totalStudents: number
  presentCount: number
  absentCount: number
  attendancePercentage: number
}

interface FeeStats {
  totalCollected: number
  totalPending: number
  totalStudents: number
  studentsWithPending: number
}

interface AttendanceTrend {
  date: string
  presentCount: number
  absentCount: number
  attendancePercentage: number
}

const COLORS = ['#000000', '#404040', '#737373', '#A3A3A3']

export default function DashboardAnalytics() {
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [feeStats, setFeeStats] = useState<FeeStats | null>(null)
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    loadDashboardData()
  }, [selectedDate])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      // Load attendance statistics for selected date
      const attendanceResponse = await fetch(`/api/attendance/statistics?date=${dateStr}`)
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        setAttendanceStats(attendanceData)
      }

      // Load fee statistics
      const feeResponse = await fetch('/api/pending-fees')
      if (feeResponse.ok) {
        const feeData = await feeResponse.json()
        // Calculate fee statistics from the response
        const totalCollected = feeData.reduce((sum: number, student: any) => sum + (student.totalPaid || 0), 0)
        const totalPending = feeData.reduce((sum: number, student: any) => sum + (student.totalPending || 0), 0)
        
        setFeeStats({
          totalCollected,
          totalPending,
          totalStudents: feeData.length,
          studentsWithPending: feeData.filter((student: any) => student.totalPending > 0).length
        })
      }

      // Load attendance trends for last 30 days
      const trendsResponse = await fetch('/api/attendance/trends?days=30')
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setAttendanceTrends(trendsData)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const attendancePieData = attendanceStats ? [
    { name: 'Present', value: attendanceStats.presentCount, color: '#10B981' },
    { name: 'Absent', value: attendanceStats.absentCount, color: '#EF4444' }
  ] : []

  const feesPieData = feeStats ? [
    { name: 'Collected', value: feeStats.totalCollected, color: '#10B981' },
    { name: 'Pending', value: feeStats.totalPending, color: '#F59E0B' }
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              First Step School Dashboard
            </h2>
            <p className="text-gray-600">Saurabh Vihar, Jaitpur, Delhi</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-6 h-6 text-black" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-black">
                {attendanceStats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-black rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-black">
                {attendanceStats?.presentCount || 0}
              </p>
              <p className="text-xs text-gray-700">
                {attendanceStats?.attendancePercentage.toFixed(1)}% attendance
              </p>
            </div>
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-200 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-black">
                {attendanceStats?.absentCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Collection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-800 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fees Collected</p>
              <p className="text-2xl font-bold text-black">
                ₹{feeStats?.totalCollected.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-700">
                ₹{feeStats?.totalPending.toLocaleString() || 0} pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Trends (30 Days)</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MM/dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="presentCount" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Present"
              />
              <Line 
                type="monotone" 
                dataKey="absentCount" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Absent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Attendance Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={attendancePieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {attendancePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fee Collection Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Fee Collection Overview</h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={feesPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {feesPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Percentage Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Percentage Trend</h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MM/dd')}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                formatter={(value) => [`${value}%`, 'Attendance']}
              />
              <Area
                type="monotone"
                dataKey="attendancePercentage"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Attendance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Students</span>
              <span className="font-semibold text-black">{attendanceStats?.totalStudents || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Present Today</span>
              <span className="font-semibold text-black">{attendanceStats?.presentCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Absent Today</span>
              <span className="font-semibold text-gray-700">{attendanceStats?.absentCount || 0}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Attendance Rate</span>
              <span className="font-semibold text-black">
                {attendanceStats?.attendancePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Fee Collection Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Students</span>
              <span className="font-semibold text-black">{feeStats?.totalStudents || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fees Collected</span>
              <span className="font-semibold text-black">
                ₹{feeStats?.totalCollected.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Fees</span>
              <span className="font-semibold text-gray-700">
                ₹{feeStats?.totalPending.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Students with Pending</span>
              <span className="font-semibold text-gray-700">
                {feeStats?.studentsWithPending || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="w-6 h-6 text-black mb-2" />
            <p className="font-medium text-black">Mark Attendance</p>
            <p className="text-sm text-gray-600">Record today's attendance</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <DollarSign className="w-6 h-6 text-black mb-2" />
            <p className="font-medium text-black">Collect Fees</p>
            <p className="text-sm text-gray-600">Record fee payments</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BarChart3 className="w-6 h-6 text-black mb-2" />
            <p className="font-medium text-black">View Reports</p>
            <p className="text-sm text-gray-600">Generate detailed reports</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Calendar className="w-6 h-6 text-black mb-2" />
            <p className="font-medium text-black">View Calendar</p>
            <p className="text-sm text-gray-600">Check school calendar</p>
          </button>
        </div>
      </div>
    </div>
  )
}
