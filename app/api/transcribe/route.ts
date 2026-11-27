import { NextResponse } from "next/server";
import OpenAI from "openai";

// Debug: Check if environment variable is loaded
console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
console.log("API Key length:", process.env.OPENAI_API_KEY?.length || 0);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  console.log("Received file:", {
    name: file.name,
    type: file.type,
    size: file.size
  });

  if (file.size === 0) {
    console.error("Received empty file");
    return NextResponse.json({ error: "Empty file received" }, { status: 400 });
  }

  try {
    // Force German language detection and transcription
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "de", // Force German language
      response_format: "text", // returns plain text
      temperature: 0.0, // More deterministic output
    });

    console.log("Transcription result:", transcription);

    return NextResponse.json({ text: transcription });
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Transcription failed' }, { status: 500 });
  }
}
