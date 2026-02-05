import { NextRequest, NextResponse } from 'next/server'
import { feathersServer } from '@/services/feathersServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file metadata from backend
    const file = await feathersServer.service('ai-files').get(fileId)
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file content from R2 storage via backend
    const r2Service = feathersServer.service('r2')
    const content = await r2Service.get(file.r2Key, {
      query: { bucket: file.r2Bucket }
    })

    // Return the file content as plain text
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Error fetching file content:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 }
    )
  }
}