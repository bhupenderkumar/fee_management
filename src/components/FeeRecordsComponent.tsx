'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Edit, Save, X, History, Trash2 } from 'lucide-react'
import { FeePayment, FeeHistoryUpdate } from '@/types/database'
import { updateFeePayment, deleteFeePayment } from '@/lib/database'

interface FeeRecordsFilters {
  studentName: string
  className: string
  status: string
  method: string
  startDate: string
  endDate: string
}

export default function FeeRecordsComponent() {
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FeePayment>>({})
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<FeeHistoryUpdate[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [updateReason, setUpdateReason] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState<FeeRecordsFilters>({
    studentName: '',
    className: '',
    status: '',
    method: '',
    startDate: '',
    endDate: ''
  })

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: 'payment_date',
        sortOrder: 'desc',
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.studentName && { studentName: filters.studentName }),
        ...(filters.className && { className: filters.className }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/payments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch payments')

      const result = await response.json()
      setPayments(result.data)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError('Failed to load payment records. Please try again.')
      setPayments([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [currentPage, filters])

  const handleFilterChange = (key: keyof FeeRecordsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      studentName: '',
      className: '',
      status: '',
      method: '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Student Name', 'Class', 'Amount', 'Method', 'Status', 'Balance', 'Notes']
    const csvData = payments.map(payment => [
      format(new Date(payment.payment_date), 'dd/MM/yyyy'),
      payment.student?.student_name || '',
      payment.student?.class ? `${payment.student.class.name} ${payment.student.class.section}` : '',
      payment.amount_received,
      payment.payment_method,
      payment.payment_status,
      payment.balance_remaining,
      payment.notes || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fee-records-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-black text-white'
      case 'partial':
        return 'bg-gray-600 text-white'
      case 'pending':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'upi':
        return 'UPI'
      default:
        return method.charAt(0).toUpperCase() + method.slice(1)
    }
  }

  const handleEditClick = (payment: FeePayment) => {
    setEditingPayment(payment.id)
    setEditForm({
      amount_received: payment.amount_received,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      balance_remaining: payment.balance_remaining,
      notes: payment.notes
    })
    setUpdateReason('')
  }

  const handleSaveEdit = async () => {
    if (!editingPayment || !updateReason.trim()) {
      alert('Please provide a reason for the update')
      return
    }

    setUpdating(true)
    try {
      await updateFeePayment(editingPayment, editForm, 'admin', updateReason)
      setEditingPayment(null)
      setEditForm({})
      setUpdateReason('')
      fetchPayments() // Refresh the data
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment record')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingPayment(null)
    setEditForm({})
    setUpdateReason('')
  }

  const handleDeleteClick = (payment: FeePayment) => {
    setDeletingPayment(payment.id)
    setDeleteReason('')
  }

  const handleConfirmDelete = async () => {
    if (!deletingPayment || !deleteReason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    setDeleting(true)
    try {
      const result = await deleteFeePayment(deletingPayment, 'admin', deleteReason)
      setDeletingPayment(null)
      setDeleteReason('')

      // Refresh the data and reset to first page if current page becomes empty
      await fetchPayments()

      // Show success message with deleted record info
      const deletedStudent = result.deleted_record.student?.student_name || 'Unknown Student'
      alert(`Payment record for ${deletedStudent} deleted successfully`)
    } catch (error) {
      console.error('Error deleting payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment record'
      alert(`Error: ${errorMessage}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingPayment(null)
    setDeleteReason('')
  }

  const fetchHistory = async (paymentId: string) => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/fee-history?fee_payment_id=${paymentId}`)
      if (!response.ok) throw new Error('Failed to fetch history')
      const history = await response.json()
      setHistoryData(history)
      setShowHistory(paymentId)
    } catch (error) {
      console.error('Error fetching history:', error)
      alert('Failed to fetch payment history')
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-black">Fee Payment Records</h3>
          <p className="text-sm text-gray-600">View and manage all fee payment submissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Student Name</label>
              <input
                type="text"
                value={filters.studentName}
                onChange={(e) => handleFilterChange('studentName', e.target.value)}
                placeholder="Search by student name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Class</label>
              <input
                type="text"
                value={filters.className}
                onChange={(e) => handleFilterChange('className', e.target.value)}
                placeholder="Search by class..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Payment Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Payment Method</label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-black"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading fee records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-black mb-4">
              <p className="font-medium">Error Loading Records</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchPayments}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No fee records found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPayment === payment.id ? (
                          <input
                            type="date"
                            value={editForm.payment_date || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, payment_date: e.target.value }))}
                            className="w-full px-2 py-1 border border-color-neutral-300 rounded text-color-neutral-900"
                          />
                        ) : (
                          format(new Date(payment.payment_date), 'dd/MM/yyyy')
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.student?.student_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.student?.class ? `${payment.student.class.name} ${payment.student.class.section}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPayment === payment.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount_received || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amount_received: parseFloat(e.target.value) }))}
                            className="w-full px-2 py-1 border border-color-neutral-300 rounded text-color-neutral-900"
                          />
                        ) : (
                          `₹${payment.amount_received.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPayment === payment.id ? (
                          <select
                            value={editForm.payment_method || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, payment_method: e.target.value as any }))}
                            className="w-full px-2 py-1 border border-color-neutral-300 rounded text-color-neutral-900"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                          </select>
                        ) : (
                          formatPaymentMethod(payment.payment_method)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPayment === payment.id ? (
                          <select
                            value={editForm.payment_status || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, payment_status: e.target.value as any }))}
                            className="w-full px-2 py-1 border border-color-neutral-300 rounded text-color-neutral-900"
                          >
                            <option value="completed">Completed</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Pending</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.payment_status)}`}>
                            {payment.payment_status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPayment === payment.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.balance_remaining || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, balance_remaining: parseFloat(e.target.value) }))}
                            className="w-full px-2 py-1 border border-color-neutral-300 rounded text-color-neutral-900"
                          />
                        ) : (
                          `₹${payment.balance_remaining.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {editingPayment === payment.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="text-color-primary hover:text-color-secondary"
                                title="Save changes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-color-accent hover:text-pink-700"
                                title="Cancel edit"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(payment)}
                                className="text-color-primary hover:text-color-secondary"
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {payment.has_updates && (
                                <button
                                  onClick={() => fetchHistory(payment.id)}
                                  className="text-color-neutral-600 hover:text-color-neutral-900"
                                  title="View history"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              )}
                              <a
                                href={payment.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-color-neutral-600 hover:text-color-neutral-900"
                                title="View receipt"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteClick(payment)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-color-neutral-300 text-sm font-medium rounded-md text-color-neutral-700 bg-white hover:bg-color-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-color-neutral-300 text-sm font-medium rounded-md text-color-neutral-700 bg-white hover:bg-color-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-color-neutral-300 bg-white text-sm font-medium text-color-neutral-500 hover:bg-color-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-color-neutral-300 bg-white text-sm font-medium text-color-neutral-500 hover:bg-color-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Reason Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Reason</h3>
            <textarea
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              placeholder="Please provide a reason for this update..."
              className="w-full px-3 py-2 border border-color-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary text-color-neutral-900"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-color-neutral-700 border border-color-neutral-300 rounded-md hover:bg-color-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!updateReason.trim() || updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this payment record? This action cannot be undone.
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Please provide a reason for deletion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim() || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {deleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              <button
                onClick={() => setShowHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading history...</p>
              </div>
            ) : historyData.length === 0 ? (
              <p className="text-gray-500">No history records found.</p>
            ) : (
              <div className="space-y-4">
                {historyData.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        Field: {record.field_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Old Value:</span>
                        <div className="text-gray-900 bg-red-50 px-2 py-1 rounded">
                          {record.old_value || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">New Value:</span>
                        <div className="text-color-neutral-900 bg-color-primary-50 px-2 py-1 rounded">
                          {record.new_value || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Updated by:</span>
                      <span className="text-gray-900 ml-1">{record.updated_by}</span>
                    </div>
                    {record.update_reason && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Reason:</span>
                        <div className="text-gray-900 bg-gray-50 px-2 py-1 rounded mt-1">
                          {record.update_reason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
