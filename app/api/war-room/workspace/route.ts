import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * SIA WORKSPACE CONNECTOR
 * Reads the AI-generated intelligence file from the project root.
 * Falls back to public/ directory if not found at root.
 */

export async function GET() {
  try {
    const rootPath = path.join(process.cwd(), 'ai_workspace.json');
    const publicPath = path.join(process.cwd(), 'public', 'ai_workspace.json');
    
    let fileContent: string;
    
    // Try project root first
    try {
      fileContent = await fs.readFile(rootPath, 'utf8');
    } catch {
      // Fall back to public directory
      fileContent = await fs.readFile(publicPath, 'utf8');
    }
    
    const data = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Workspace file not found or corrupted. Please ask AI to generate the report first.'
    }, { status: 404 });
  }
}
