import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feePaymentId = searchParams.get('fee_payment_id')

    if (!feePaymentId) {
      return NextResponse.json(
        { error: 'fee_payment_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('fee_history_update')
      .select('*')
      .eq('fee_payment_id', feePaymentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching fee history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee history' },
      { status: 500 }
    )
  }
}
