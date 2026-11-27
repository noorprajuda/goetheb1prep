import { NextRequest, NextResponse } from 'next/server';
import { GridFSService } from '@/lib/gridfsService';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { fileIds } = await request.json();
    
    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json(
        { error: 'File IDs array is required' },
        { status: 400 }
      );
    }

    console.log('Cleaning up test audio files:', fileIds);
    
    let deletedCount = 0;
    const errors: string[] = [];
    
    // Delete each file from GridFS
    for (const fileId of fileIds) {
      try {
        if (ObjectId.isValid(fileId)) {
          const success = await GridFSService.deleteAudioFile(new ObjectId(fileId));
          if (success) {
            deletedCount++;
            console.log(`✅ Deleted audio file: ${fileId}`);
          } else {
            errors.push(`Failed to delete file: ${fileId}`);
          }
        } else {
          errors.push(`Invalid file ID: ${fileId}`);
        }
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
        errors.push(`Error deleting file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Audio cleanup completed: ${deletedCount} files deleted, ${errors.length} errors`);
    
    return NextResponse.json({
      success: true,
      deletedCount,
      totalRequested: fileIds.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} out of ${fileIds.length} audio files`
    });
    
  } catch (error) {
    console.error('Error in cleanup-test-audio API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cleanup audio files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
