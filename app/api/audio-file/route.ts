import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { GridFSService } from '@/lib/gridfsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID format' },
        { status: 400 }
      );
    }

    try {
      // Get audio file from GridFS
      const { stream, file } = await GridFSService.getAudioFile(new ObjectId(fileId));

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const fileBuffer = Buffer.concat(chunks);

      // Return the audio file
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': file.contentType || 'audio/webm',
          'Content-Length': file.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="${file.filename}"`
        },
      });

    } catch (error) {
      console.error('Error retrieving audio file from GridFS:', error);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio file' },
      { status: 500 }
    );
  }
}
