import { filesService } from '@/services/api/files'
import { projectsService } from '@/services/api/projects'
import feathersClient from '@/services/featherClient'
import JSZip from 'jszip'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT token using Feathers.js authentication
    await feathersClient.authenticate({ strategy: 'jwt', accessToken: token })
    
    // Get authenticated user from feathersClient
    const authUser = feathersClient.get('authentication')?.user
    if (!authUser || !authUser._id) {
      return NextResponse.json(
        { error: 'Invalid or expired authorization token' },
        { status: 401 }
      )
    }
    
    const userId = authUser._id

    // Fetch project metadata
    const project = await projectsService.get(projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // CRITICAL FIX: Verify that the project belongs to the authenticated user
    if (project.userId !== userId) {
      console.warn(`Unauthorized download attempt: User ${userId} tried to download project ${projectId} owned by ${project.userId}`)
      return NextResponse.json(
        { error: 'You do not have permission to access this project' },
        { status: 403 }
      )
    }

    // Fetch all files for project
    const filesResult = await filesService.find({
      projectId
    })
    const files = filesResult.data || []

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files found for this project' },
        { status: 404 }
      )
    }

    // Create a new zip file
    const zip = new JSZip()

    // WARNING FIX: Track failed files to warn the user
    const failedFiles: string[] = []

    // Add each file to zip
    for (const file of files) {
      try {
        // Fetch file content from backend
        const contentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/${file._id}/content`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': request.headers.get('authorization') || ''
            }
          }
        )

        if (!contentResponse.ok) {
          console.error(`Failed to fetch content for file: ${file.name}`)
          failedFiles.push(file.name)
          continue
        }

        const content = await contentResponse.text()
        zip.file(file.name, content)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        failedFiles.push(file.name)
      }
    }

    // WARNING FIX: Log warning if any files failed to download
    if (failedFiles.length > 0) {
      console.warn(
        `WARNING: ${failedFiles.length} file(s) failed to download for project ${projectId}: ${failedFiles.join(', ')}`
      )
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    // Return zip file as a download
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error downloading project:', error)
    return NextResponse.json(
      { error: 'Failed to download project' },
      { status: 500 }
    )
  }
}
