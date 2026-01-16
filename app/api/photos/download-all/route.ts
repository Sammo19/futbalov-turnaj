import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function GET() {
  try {
    const photosDir = join(process.cwd(), 'public', 'photos');

    // Read all JPG files from photos directory
    const files = await readdir(photosDir);
    const jpgFiles = files
      .filter(file => file.toLowerCase().endsWith('.jpg'))
      .sort();

    // Create ZIP
    const zip = new JSZip();
    const folder = zip.folder('Bijacovce-Futbalovy-Turnaj-2026');

    // Add all photos to ZIP
    for (const file of jpgFiles) {
      const filePath = join(photosDir, file);
      const fileData = await readFile(filePath);
      folder?.file(file, fileData);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Return ZIP as download
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="Bijacovce-Futbalovy-Turnaj-2026-Vsetky-Fotky.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to create ZIP file' },
      { status: 500 }
    );
  }
}
