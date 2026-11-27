import { NextRequest, NextResponse } from 'next/server';
import { GridFSService } from '@/lib/gridfsService';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting audio merge process...');
    
    // Parse form data
    const formData = await request.formData();
    const userAudio = formData.get('user') as File;
    const aiAudio = formData.get('ai') as File;

    if (!userAudio || !aiAudio) {
      return NextResponse.json(
        { error: 'Missing user or AI audio file' },
        { status: 400 }
      );
    }

    // Convert File objects to buffers
    const userBuffer = Buffer.from(await userAudio.arrayBuffer());
    const aiBuffer = Buffer.from(await aiAudio.arrayBuffer());

    // Store audio files in GridFS
    const userFileId = await GridFSService.storeAudioFile(
      userBuffer,
      `user-${Date.now()}.webm`,
      'audio/webm',
      { type: 'user', createdAt: new Date() }
    );
    
    const aiFileId = await GridFSService.storeAudioFile(
      aiBuffer,
      `ai-${Date.now()}.webm`,
      'audio/webm',
      { type: 'ai', createdAt: new Date() }
    );

    // Get temporary file paths for ffmpeg processing
    const userFilePath = `/tmp/user-${Date.now()}.webm`;
    const aiFilePath = `/tmp/ai-${Date.now()}.webm`;
    const outputFilePath = `/tmp/merged-${Date.now()}.mp3`;

    // Write files to temporary directory for ffmpeg
    const fsPromises = await import('fs/promises');
    await fsPromises.writeFile(userFilePath, userBuffer);
    await fsPromises.writeFile(aiFilePath, aiBuffer);

    console.log('Files written, starting ffmpeg merge...');

    // Merge audio files using ffmpeg via child_process
    await new Promise<void>((resolve, reject) => {
      if (!ffmpegPath) {
        reject(new Error('FFmpeg binary not found'));
        return;
      }

      const ffmpegProcess = spawn(ffmpegPath, [
        '-i', userFilePath,
        '-i', aiFilePath,
        '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=longest[out]',
        '-map', '[out]',
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        '-ac', '1', // Mono output
        outputFilePath
      ]);

      let stderr = '';

      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Parse progress from stderr (ffmpeg outputs progress to stderr)
        const progressMatch = stderr.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (progressMatch) {
          console.log('Processing...', progressMatch[1]);
        }
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Audio merge completed successfully');
          resolve();
        } else {
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg error:', error);
        reject(error);
      });
    });

    // Read the merged file and store it in GridFS
    const mergedBuffer = await fsPromises.readFile(outputFilePath);
    
    const mergedFileId = await GridFSService.storeAudioFile(
      mergedBuffer,
      `merged-${Date.now()}.mp3`,
      'audio/mpeg',
      {
        type: 'merged',
        userFileId: userFileId.toString(),
        aiFileId: aiFileId.toString(),
        createdAt: new Date()
      }
    );

    // Clean up temporary files
    try {
      await fsPromises.unlink(userFilePath);
      await fsPromises.unlink(aiFilePath);
      await fsPromises.unlink(outputFilePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
    }
    
    // Return the file URL for serving
    const fileUrl = `/api/audio-file?fileId=${mergedFileId.toString()}`;
    
    console.log('Audio merge completed, file available at:', fileUrl);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileId: mergedFileId.toString(),
      message: 'Audio files merged successfully'
    });

  } catch (error) {
    console.error('Error merging audio files:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge audio files' 
      },
      { status: 500 }
    );
  }
}
