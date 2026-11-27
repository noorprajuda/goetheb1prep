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

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, audioBlob, mimeType } = await request.json();
    
    if (!content || !contentType || !audioBlob) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }
    const audioCollection = mongoose.connection.db.collection<AudioStorage>('audio_storage');

    // Check if audio already exists for this content
    const existingAudio = await audioCollection.findOne({ 
      content: content,
      contentType: contentType 
    });

    if (existingAudio) {
      return NextResponse.json({
        success: true,
        audioId: existingAudio._id?.toString(),
        audioUrl: existingAudio.audioUrl,
        cached: true
      });
    }

    // Store audio file in GridFS
    const audioBuffer = Buffer.from(audioBlob, 'base64');
    const audioFileId = await GridFSService.storeAudioFile(
      audioBuffer,
      `audio-${contentType}-${Date.now()}.mp3`,
      mimeType || 'audio/mpeg',
      {
        content,
        contentType,
        createdAt: new Date()
      }
    );

    // Store audio metadata in collection
    const audioStorage: Omit<AudioStorage, '_id'> = {
      content,
      contentType,
      audioUrl: `/api/audio-storage/play/${new ObjectId()}`,
      audioFileId: audioFileId,
      mimeType: mimeType || 'audio/mpeg',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    const result = await audioCollection.insertOne(audioStorage);
    
    return NextResponse.json({
      success: true,
      audioId: result.insertedId.toString(),
      audioUrl: audioStorage.audioUrl,
      cached: false
    });

  } catch (error) {
    console.error("Error storing audio:", error);
    return NextResponse.json(
      { error: "Failed to store audio" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioId = searchParams.get('audioId');
    
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

    return NextResponse.json({
      success: true,
      audioUrl: audio.audioUrl,
      mimeType: audio.mimeType
    });

  } catch (error) {
    console.error("Error retrieving audio:", error);
    return NextResponse.json(
      { error: "Failed to retrieve audio" },
      { status: 500 }
    );
  }
}
