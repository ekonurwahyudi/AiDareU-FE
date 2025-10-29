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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customer,
      order,
      items
    } = body

    // Validate required fields
    if (!customer || !order || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Forward request to Laravel backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        customer,
        order,
        items
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status, headers: corsHeaders })
    }

    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}