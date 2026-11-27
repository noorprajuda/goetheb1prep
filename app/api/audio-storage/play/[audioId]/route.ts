import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { GridFSService } from "@/lib/gridfsService";

interface AudioStorage {
  _id?: ObjectId;
  content: string;
  contentType: 'transcript' | 'corrected' | 'presentation' | 'model_answer';
  audioUrl: string;
  audioFileId: ObjectId; // Store GridFS file ID instead of audioBlob
  mimeType: string;
  createdAt: Date;
  expiresAt?: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> }
) {
  try {
    const { audioId } = await params;
    
    if (!audioId) {
      return NextResponse.json({ error: "Audio ID required" }, { status: 400 });
    }

    await dbConnect();
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }
    const audioCollection = mongoose.connection.db.collection<AudioStorage>('audio_storage');
    
    const audio = await audioCollection.findOne({ 
      _id: new ObjectId(audioId) 
    });

    if (!audio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    // Check if audio has expired
    if (audio.expiresAt && new Date() > audio.expiresAt) {
      // Delete from both collection and GridFS
      await audioCollection.deleteOne({ _id: audio._id });
      await GridFSService.deleteAudioFile(audio.audioFileId);
      return NextResponse.json({ error: "Audio has expired" }, { status: 410 });
    }

    // Get audio file from GridFS
    try {
      const { stream, file } = await GridFSService.getAudioFile(audio.audioFileId);
      
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
          'Content-Type': audio.mimeType,
          'Content-Length': file.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="audio-${audioId}.mp3"`
        }
      });
    } catch (gridfsError) {
      console.error('Error retrieving audio from GridFS:', gridfsError);
      return NextResponse.json({ error: "Audio file not found in storage" }, { status: 404 });
    }

  } catch (error) {
    console.error("Error serving audio:", error);
    return NextResponse.json(
      { error: "Failed to serve audio" },
      { status: 500 }
    );
  }
}
