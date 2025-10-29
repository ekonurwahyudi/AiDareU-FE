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
      storeUuid,
      destinationProvince,
      destinationCity,
      destinationDistrict,
      weight = 1000 // default 1kg in grams
    } = body

    if (!storeUuid || !destinationProvince || !destinationCity || !destinationDistrict) {
      return NextResponse.json(
        { message: 'Store UUID dan alamat tujuan wajib diisi' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Call Laravel backend API to calculate shipping
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const response = await fetch(`${backendUrl}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        store_uuid: storeUuid,
        destination_province: destinationProvince,
        destination_city: destinationCity,
        destination_district: destinationDistrict,
        weight: weight
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal menghitung biaya pengiriman' },
        { status: response.status, headers: corsHeaders }
      )
    }

    return NextResponse.json(data, { headers: corsHeaders })

  } catch (error) {
    console.error('Calculate shipping API error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500, headers: corsHeaders }
    )
  }
}