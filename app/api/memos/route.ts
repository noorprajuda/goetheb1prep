import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { inngest } from "@/inngest/client";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { GridFSService } from "@/lib/gridfsService";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting audio memo save process...");
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      console.log("No audio file provided");
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }
    
    console.log("Audio file received:", audioFile.name, audioFile.size, "bytes");

    // Generate unique memo ID
    const memoId = `memo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Convert audio file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Store audio file in GridFS
    console.log("Storing audio file in GridFS...");
    const audioFileId = await GridFSService.storeAudioFile(
      buffer,
      `${memoId}.webm`,
      audioFile.type || 'audio/webm',
      {
        memoId,
        originalName: audioFile.name,
        size: audioFile.size
      }
    );
    
    console.log("Audio file stored with ID:", audioFileId);

    // Save to database
    console.log("Connecting to database...");
    await dbConnect();
    if (!mongoose.connection.db) {
      console.error('MongoDB database not available');
      throw new Error('MongoDB database not available');
    }
    console.log("Database connected successfully");
    const audioMemos = mongoose.connection.db.collection('audioMemos');
    
    const audioMemo = {
      _id: new ObjectId(),
      audioFileId: audioFileId, // Store GridFS file ID instead of file path
      status: "processing",
      transcription: null,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await audioMemos.insertOne(audioMemo);

    console.log("Audio memo created:", audioMemo);

    // Try to send to Inngest, but don't fail if it's not configured
    try {
      console.log("Sending to Inngest...");
      await inngest.send({
        name: "audio/received",
        data: {
          memoId: audioMemo._id.toString(),
          audioFileId: audioFileId.toString(),
        },
      });
      console.log("Inngest event sent successfully");
    } catch (inngestError) {
      console.warn("Inngest event failed (non-critical):", inngestError);
      // Continue without failing - the audio memo is still saved
    }

    return NextResponse.json({ 
      success: true, 
      memoId: audioMemo._id.toString(),
      message: "Audio memo saved successfully" 
    });

  } catch (error) {
    console.error("Error saving audio memo:", error);
    return NextResponse.json(
      { 
        error: "Failed to save audio memo", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching test results...");
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Connect to database
    await dbConnect();
    if (!mongoose.connection.db) {
      console.error('MongoDB database not available');
      throw new Error('MongoDB database not available');
    }
    
    const audioMemos = mongoose.connection.db.collection('audioMemos');
    
    // Get user ID from request headers or query params
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');
    console.log("User ID from headers:", request.headers.get('x-user-id'));
    console.log("User ID from query params:", request.nextUrl.searchParams.get('userId'));
    console.log("Final user ID:", userId);
    
    if (!userId) {
      console.error("No user ID provided in request");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    
    // Fetch all test results for the user
    const testResults = await audioMemos.find({ 
      userId: userId,
      status: 'completed' // Only fetch completed tests
    }).sort({ createdAt: -1 }).toArray();
    
    // Transform the data to match the expected format
    const formattedResults = testResults.map((result: Record<string, unknown>) => ({
      id: (result._id as ObjectId).toString(),
      task_topic: result.topic || result.taskTopic || 'Unknown Topic',
      created_date: result.createdAt || result.created_date,
      audio_url: result.audioUrl,
      teil_type: result.teilType || 'teil1', // Default to teil1 if not specified
      scores: result.scores || {
        fluency: 0,
        vocabulary: 0,
        grammar: 0,
        pronunciation: 0,
        task_completion: 0,
        overall: 0
      },
      passed: result.passed || false,
      feedback: result.feedback || {
        strengths: [],
        areas_for_improvement: [],
        specific_feedback: '',
        recommendations: []
      },
      summary: result.summary,
      transcript: result.transcript,
      conversation: result.conversation,
      grammarCorrections: result.grammarCorrections,
      betterExpressions: result.betterExpressions,
      redemittelUsed: result.redemittelUsed,
      modelAnswer: result.modelAnswer,
      modelAnswerExplanation: result.modelAnswerExplanation,
      exampleConversation: result.exampleConversation,
      vorteile: result.vorteile,
      nachteile: result.nachteile,
      presentation: result.presentation,
      conversationMetrics: result.conversationMetrics
    }));
    
    console.log(`Found ${formattedResults.length} test results for user ${userId}`);
    
    return NextResponse.json(formattedResults);
    
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch test results", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
