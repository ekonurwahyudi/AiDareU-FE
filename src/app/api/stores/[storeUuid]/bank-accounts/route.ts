import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { storeUuid: string } }
) {
  try {
    const { storeUuid } = params

    if (!storeUuid) {
      return NextResponse.json(
        { success: false, message: 'Store UUID is required' },
        { status: 400 }
      )
    }

    // Call Laravel backend API to get bank accounts
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(backendUrl + '/api/stores/' + storeUuid + '/bank-accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch bank accounts' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Bank accounts API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
