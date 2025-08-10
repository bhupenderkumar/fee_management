'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Save, RotateCcw, Copy, AlertCircle, CheckCircle, DollarSign, Users, FileText } from 'lucide-react'
import { Student } from '@/types/database'
import { BulkFeeEntryUIData, calculateBulkFeeEntrySummary, validateBulkFeeEntry } from '@/lib/validations/bulk-fee-entry'
import { getClassesWithNames, getStudentsByClass, bulkCreateFeePayments } from '@/lib/database'

interface ClassInfo {
  id: string
  name: string
  section: string
}

export default function BulkFeeEntry() {
  const [entries, setEntries] = useState<BulkFeeEntryUIData[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([]) // Back to ClassInfo array
  const [allStudents, setAllStudents] = useState<Student[]>([]) // Store all students
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Load classes and all students on component mount
  useEffect(() => {
    loadClasses()
    loadAllStudents()
  }, [])

  const loadClasses = async () => {
    setLoadingClasses(true)
    try {
      const response = await fetch('/api/classes-with-names')
      if (!response.ok) throw new Error('Failed to fetch classes')
      const classesData = await response.json()

      console.log('🏫 Loaded classes data:', {
        totalClasses: classesData?.length || 0,
        sampleClass: classesData?.[0],
        allClassIds: classesData?.map((c: any) => c.id) || []
      })

      setClasses(classesData || [])
    } catch (error) {
      console.error('Error loading classes:', error)
      alert('Failed to load classes. Please refresh the page.')
    } finally {
      setLoadingClasses(false)
    }
  }

  const loadAllStudents = async () => {
    setLoadingStudents(true)
    try {
      // Load all students from all classes
      const response = await fetch('/api/students-management?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch students')
      const data = await response.json()
      console.log('📚 Loaded students data:', {
        totalStudents: data.data?.length || 0,
        sampleStudent: data.data?.[0],
        allClassIds: [...new Set(data.data?.map((s: any) => s.class_id) || [])]
      })
      setAllStudents(data.data || [])
    } catch (error) {
      console.error('Error loading students:', error)
      alert('Failed to load students. Please refresh the page.')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Initialize with one empty entry
  useEffect(() => {
    if (entries.length === 0) {
      addNewEntry()
    }
  }, [])

  const generateEntryId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addNewEntry = () => {
    const newEntry: BulkFeeEntryUIData = {
      id: generateEntryId(),
      student_id: '',
      student_name: '',
      class_name: '', // This will store the class_id (like CLS201)
      amount_received: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      balance_remaining: 0,
      payment_status: 'completed',
      notes: '',
      fee_month: new Date().getMonth() + 1,
      fee_year: new Date().getFullYear(),
      isValid: false,
      validationErrors: {}
    }
    setEntries(prev => [...prev, newEntry])
  }

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter(entry => entry.id !== id))
    }
  }

  const duplicateEntry = (id: string) => {
    const entryToDuplicate = entries.find(entry => entry.id === id)
    if (entryToDuplicate) {
      const duplicatedEntry: BulkFeeEntryUIData = {
        ...entryToDuplicate,
        id: generateEntryId(),
        payment_date: format(new Date(), 'yyyy-MM-dd'), // Reset to today's date
        isValid: false,
        validationErrors: {}
      }
      const index = entries.findIndex(entry => entry.id === id)
      setEntries(prev => [
        ...prev.slice(0, index + 1),
        duplicatedEntry,
        ...prev.slice(index + 1)
      ])
    }
  }

  const clearAllEntries = () => {
    if (confirm('Are you sure you want to clear all entries? This action cannot be undone.')) {
      setEntries([])
      // Add one empty entry
      setTimeout(addNewEntry, 0)
    }
  }

  // Debounced validation to improve performance
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  const updateEntry = useCallback((id: string, field: keyof BulkFeeEntryUIData, value: any) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value }

        // Update student name when student is selected
        if (field === 'student_id' && value) {
          const selectedStudent = allStudents.find(s => s.id === value)
          if (selectedStudent) {
            updatedEntry.student_name = selectedStudent.student_name
            // Don't update class_name here as it should be set by the class dropdown
          }
        }

        // Clear existing validation timeout for this entry
        if (validationTimeouts[id]) {
          clearTimeout(validationTimeouts[id])
        }

        // Set new validation timeout (debounced validation)
        const timeout = setTimeout(() => {
          setEntries(current => current.map(currentEntry => {
            if (currentEntry.id === id) {
              const validation = validateBulkFeeEntry(currentEntry)
              return {
                ...currentEntry,
                isValid: validation.isValid,
                validationErrors: validation.errors
              }
            }
            return currentEntry
          }))

          // Clean up timeout
          setValidationTimeouts(timeouts => {
            const newTimeouts = { ...timeouts }
            delete newTimeouts[id]
            return newTimeouts
          })
        }, 300) // 300ms debounce

        setValidationTimeouts(timeouts => ({
          ...timeouts,
          [id]: timeout
        }))

        return updatedEntry
      }
      return entry
    }))
  }, [allStudents, validationTimeouts])

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [validationTimeouts])

  // Calculate summary with memoization for performance
  const summary = useMemo(() => calculateBulkFeeEntrySummary(entries), [entries])

  const handleSave = async () => {
    // Validate all entries
    const validEntries = entries.filter(entry => entry.isValid)
    
    if (validEntries.length === 0) {
      alert('Please add at least one valid entry before saving.')
      return
    }

    if (validEntries.length < entries.length) {
      const proceed = confirm(
        `${entries.length - validEntries.length} entries have validation errors and will be skipped. ` +
        `Do you want to proceed with saving ${validEntries.length} valid entries?`
      )
      if (!proceed) return
    }

    setSaving(true)
    try {
      // Prepare entries for API
      const entriesToSave = validEntries.map(entry => ({
        student_id: entry.student_id,
        amount_received: entry.amount_received,
        payment_date: entry.payment_date,
        payment_method: entry.payment_method,
        balance_remaining: entry.balance_remaining,
        payment_status: entry.payment_status,
        notes: entry.notes || '',
        fee_month: entry.fee_month,
        fee_year: entry.fee_year
      }))

      const result = await bulkCreateFeePayments(entriesToSave)

      if (result.success) {
        alert(`Successfully created ${result.summary.successfulEntries} fee payments!`)
        // Clear entries and start fresh
        setEntries([])
        setTimeout(addNewEntry, 0)
      } else {
        const errorMessage = `Created ${result.summary.successfulEntries} payments successfully. ` +
          `${result.summary.failedEntries} entries failed. Check the console for details.`
        alert(errorMessage)
        console.error('Bulk creation errors:', result.errors)
      }
    } catch (error) {
      console.error('Error saving bulk entries:', error)
      alert('Failed to save entries. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-amber-900">Bulk Fee Entry</h2>
            <p className="text-amber-700 mt-1">Enter multiple fee payments quickly and efficiently</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-amber-600">Total Entries</div>
              <div className="text-2xl font-bold text-amber-900">{summary.totalEntries}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-600">Total Amount</div>
              <div className="text-2xl font-bold text-amber-900">₹{summary.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>



      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-sm text-amber-600">Total Entries</div>
              <div className="text-xl font-bold text-amber-900">{summary.totalEntries}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-green-600">Valid Entries</div>
              <div className="text-xl font-bold text-green-900">{summary.validEntries}</div>
            </div>
          </div>
        </div>

        <div className="bg-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-sm text-red-600">Invalid Entries</div>
              <div className="text-xl font-bold text-red-900">{summary.invalidEntries}</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600">Total Amount</div>
              <div className="text-xl font-bold text-blue-900">₹{summary.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={addNewEntry}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>

            <button
              onClick={clearAllEntries}
              className="flex items-center gap-2 px-4 py-2 bg-amber-200 text-amber-800 rounded-md hover:bg-amber-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-amber-700">
              {summary.validEntries} of {summary.totalEntries} entries ready to save
            </div>
            <button
              onClick={handleSave}
              disabled={saving || summary.validEntries === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save ${summary.validEntries} Entries`}
            </button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-200">
              {entries.map((entry) => (
                <BulkFeeEntryRow
                  key={entry.id}
                  entry={entry}
                  classes={classes}
                  students={allStudents}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                  onDuplicate={duplicateEntry}
                  canRemove={entries.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
              <div className="text-lg font-medium text-gray-900">Saving entries...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual entry row component
interface BulkFeeEntryRowProps {
  entry: BulkFeeEntryUIData
  classes: ClassInfo[]
  students: Student[]
  onUpdate: (id: string, field: keyof BulkFeeEntryUIData, value: any) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  canRemove: boolean
}

function BulkFeeEntryRow({
  entry,
  classes,
  students,
  onUpdate,
  onRemove,
  onDuplicate,
  canRemove
}: BulkFeeEntryRowProps) {
  const hasErrors = !entry.isValid && Object.keys(entry.validationErrors || {}).length > 0

  // Filter students by selected class (entry.class_name contains the class_id like "CLS201")
  const filteredStudents = entry.class_name
    ? students.filter(s => s.class_id === entry.class_name)
    : students



  return (
    <tr className={`${hasErrors ? 'bg-red-50' : entry.isValid ? 'bg-green-50' : 'bg-gray-50'} hover:bg-amber-50 transition-colors`}>
      {/* Class Selection */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <select
            value={entry.class_name || ''}
            onChange={(e) => {
              onUpdate(entry.id!, 'class_name', e.target.value)
              // Clear student selection when class changes
              if (entry.student_id) {
                onUpdate(entry.id!, 'student_id', '')
                onUpdate(entry.id!, 'student_name', '')
              }
            }}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.class_name ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Class</option>
            {classes.map((classInfo) => (
              <option key={classInfo.id} value={classInfo.id}>
                {classInfo.name} {classInfo.section && `- ${classInfo.section}`}
              </option>
            ))}
          </select>
          {entry.validationErrors?.class_name && (
            <div className="text-xs text-red-600">{entry.validationErrors.class_name}</div>
          )}
        </div>
      </td>

      {/* Student Selection */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <select
            value={entry.student_id}
            onChange={(e) => onUpdate(entry.id!, 'student_id', e.target.value)}
            disabled={!entry.class_name}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.student_id ? 'border-red-500' : 'border-gray-300'
            } ${!entry.class_name ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">Select Student</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.student_name}
              </option>
            ))}
          </select>
          {entry.validationErrors?.student_id && (
            <div className="text-xs text-red-600">{entry.validationErrors.student_id}</div>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <input
            type="number"
            value={entry.amount_received || ''}
            onChange={(e) => onUpdate(entry.id!, 'amount_received', parseFloat(e.target.value) || 0)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.amount_received ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {entry.validationErrors?.amount_received && (
            <div className="text-xs text-red-600">{entry.validationErrors.amount_received}</div>
          )}
        </div>
      </td>

      {/* Balance */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <input
            type="number"
            value={entry.balance_remaining || ''}
            onChange={(e) => onUpdate(entry.id!, 'balance_remaining', parseFloat(e.target.value) || 0)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.balance_remaining ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {entry.validationErrors?.balance_remaining && (
            <div className="text-xs text-red-600">{entry.validationErrors.balance_remaining}</div>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <input
            type="date"
            value={entry.payment_date}
            onChange={(e) => onUpdate(entry.id!, 'payment_date', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.payment_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {entry.validationErrors?.payment_date && (
            <div className="text-xs text-red-600">{entry.validationErrors.payment_date}</div>
          )}
        </div>
      </td>

      {/* Payment Method */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <select
            value={entry.payment_method}
            onChange={(e) => onUpdate(entry.id!, 'payment_method', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.payment_method ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
          {entry.validationErrors?.payment_method && (
            <div className="text-xs text-red-600">{entry.validationErrors.payment_method}</div>
          )}
        </div>
      </td>

      {/* Payment Status */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <select
            value={entry.payment_status}
            onChange={(e) => onUpdate(entry.id!, 'payment_status', e.target.value)}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              entry.validationErrors?.payment_status ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="completed">Completed</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
          {entry.validationErrors?.payment_status && (
            <div className="text-xs text-red-600">{entry.validationErrors.payment_status}</div>
          )}
        </div>
      </td>

      {/* Notes */}
      <td className="px-4 py-3">
        <input
          type="text"
          value={entry.notes || ''}
          onChange={(e) => onUpdate(entry.id!, 'notes', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Optional notes"
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(entry.id!)}
            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
            title="Duplicate entry"
          >
            <Copy className="w-4 h-4" />
          </button>
          {canRemove && (
            <button
              onClick={() => onRemove(entry.id!)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
              title="Remove entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="ml-2">
            {entry.isValid ? (
              <div title="Valid entry">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div title="Invalid entry">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}
