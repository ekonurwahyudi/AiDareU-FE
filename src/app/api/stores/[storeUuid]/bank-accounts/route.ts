import { NextRequest, NextResponse } from 'next/server'

// CORS headers for cross-origin requests from subdomains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { storeUuid: string } }
) {
  try {
    const { storeUuid } = params

    if (!storeUuid) {
      return NextResponse.json(
        { success: false, message: 'Store UUID is required' },
        { status: 400, headers: corsHeaders }
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
        { status: response.status, headers: corsHeaders }
      )
    }

    return NextResponse.json(data, { headers: corsHeaders })

  } catch (error) {
    console.error('Bank accounts API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
