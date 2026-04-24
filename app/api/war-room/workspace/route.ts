import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { readWorkspace, readWorkspaceContainer, writeWorkspace, WorkspaceContainer, WorkspaceArticle } from '@/lib/ai/workspace-io';

/**
 * SIA WORKSPACE CONNECTOR
 * Handles reading and writing to the AI-generated intelligence file.
 */

export async function GET() {
  try {
    const data = await readWorkspace();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Workspace file not found or corrupted: ' + error.message
    }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const currentWorkspace = await readWorkspaceContainer();

    // If it's a full container, use it directly
    if (payload.articles) {
      await writeWorkspace(payload as WorkspaceContainer);
    } else if (payload.id || payload.en) {
      // If it's a single article, prepend it to the existing array
      const container: WorkspaceContainer = {
        ...currentWorkspace,
        articles: [payload as WorkspaceArticle, ...currentWorkspace.articles].slice(0, 10) // Keep last 10
      };
      await writeWorkspace(container);
    } else {
      throw new Error('Invalid workspace payload structure');
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update workspace: ' + error.message
    }, { status: 500 });
  }
}
