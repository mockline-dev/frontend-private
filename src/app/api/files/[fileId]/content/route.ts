import { createFeathersServerClient } from '@/services/feathersServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {

    const params = await props.params;
    const { fileId } = params

    if (!fileId) {
      console.error('[File Content API] Missing fileId in params')
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    console.log('[File Content API] Fetching file content for fileId:', fileId)

    // Get feathers client instance
    const app = await createFeathersServerClient()

    // Get file metadata from backend (changed from 'ai-files' to 'files')
    console.log('[File Content API] Getting file metadata...')
    const file = await app.service('files').get(fileId)

    if (!file) {
      console.error('[File Content API] File not found:', fileId)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    console.log('[File Content API] File found:', { fileId, name: file.name, key: file.key })

    // Get signed URL from file-stream service
    console.log('[File Content API] Getting signed URL for key:', file.key)
    const streamResult = await app.service('file-stream').get(file.key)

    if (!streamResult || !streamResult.url) {
      console.error('[File Content API] Failed to get file URL:', { fileKey: file.key, streamResult })
      return NextResponse.json(
        { error: 'Failed to get file URL' },
        { status: 500 }
      )
    }

    console.log('[File Content API] Signed URL obtained successfully')

    // Fetch file content from signed URL
    console.log('[File Content API] Fetching file content from signed URL...')
    const response = await fetch(streamResult.url)

    if (!response.ok) {
      console.error('[File Content API] Failed to fetch file content:', { url: streamResult.url, status: response.status })
      return NextResponse.json(
        { error: 'Failed to fetch file content' },
        { status: response.status }
      )
    }

    const content = await response.text()

    console.log('[File Content API] File content fetched successfully, size:', content.length)

    // Return the file content as plain text
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('[File Content API] Error fetching file content:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch file content' },
      { status: 500 }
    )
  }
}