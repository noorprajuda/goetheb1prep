import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memoId } = await params;
    
    await dbConnect();
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }
    const audioMemos = mongoose.connection.db.collection('audioMemos');
    
    const audioMemo = await audioMemos.findOne(
      { _id: new ObjectId(memoId) },
      {
        projection: {
          _id: true,
          transcription: true,
          status: true,
          summary: true,
          createdAt: true,
        }
      }
    );

    if (!audioMemo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Convert _id to id for consistency
    const result = {
      id: audioMemo._id.toString(),
      transcription: audioMemo.transcription,
      status: audioMemo.status,
      summary: audioMemo.summary,
      createdAt: audioMemo.createdAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching memo:", error);
    return NextResponse.json(
      { error: "Failed to fetch memo" },
      { status: 500 }
    );
  }
}
