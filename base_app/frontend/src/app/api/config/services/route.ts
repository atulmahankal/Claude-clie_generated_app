import { NextResponse } from 'next/server'

const BASE_BACKEND_URL = process.env.BASE_BACKEND_URL || 'http://base-app-backend:3000'

export async function GET() {
  try {
    const response = await fetch(`${BASE_BACKEND_URL}/api/config/services`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
