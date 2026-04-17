import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * SIA WORKSPACE CONNECTOR
 * Reads the AI-generated intelligence file from the project root.
 */

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'ai_workspace.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
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
