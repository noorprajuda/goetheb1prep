import { inngest } from "./client";
import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import OpenAI from "openai";
import { AutoRenewalService } from "@/lib/autoRenewalService";
import { GridFSService } from "@/lib/gridfsService";

import { File } from "node:buffer";

if (!globalThis.File) {
  (globalThis as any).File = File;
}

console.log("Environment check:");
// API key loaded successfully

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processAudio = inngest.createFunction(
  {
    id: "process-audio",
  },
  { event: "audio/received" },
  async ({ event, step }) => {
    console.log("Processing audio file...:", event.data);
    const { memoId, audioFileId } = event.data;
    
    const transcription = await step.run("transcribe-audio", async () => {
      try {
        // Get the audio file from GridFS
        const { stream, file } = await GridFSService.getAudioFile(new ObjectId(audioFileId));
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);
        
        // Create a File object from the buffer
        const audioFile = new File([audioBuffer], file.filename, {
          type: file.contentType
        });

        const response = await openai.audio.transcriptions.create({
          file: audioFile as any,
          model: "whisper-1",
          language: "de", // Force German language
          response_format: "text",
          temperature: 0.0, // More deterministic output
        });

        console.log("Transcription result:", response);
        return response;
      } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
      }
    });

    await step.run("update-memo-in-db-transcription", async () => {
      try {
        await dbConnect();
        if (!mongoose.connection.db) {
          throw new Error("Failed to connect to database");
        }
        const db = mongoose.connection.db;
        const audioMemos = db.collection('audioMemos');
        
        await audioMemos.updateOne(
          { _id: new ObjectId(memoId) },
          { 
            $set: { 
              transcription: transcription,
              status: "completed",
              updatedAt: new Date()
            }
          }
        );
        console.log("Database updated successfully");
      } catch (error) {
        console.error("Error updating database:", error);
        throw error;
      }
    });

    console.log("Audio processing completed for memo:", memoId);
  }
);

// Auto-renewal cron job - runs daily at midnight UTC
export const processAutoRenewals = inngest.createFunction(
  {
    id: "process-auto-renewals",
  },
  { cron: "0 0 * * *" }, // Daily at midnight UTC
  async ({ event, step }) => {
    console.log("🔄 Starting daily auto-renewal process...");
    
    const result = await step.run("process-auto-renewals", async () => {
      try {
        const renewalResult = await AutoRenewalService.processAutoRenewals();
        console.log("Auto-renewal process completed:", renewalResult);
        return renewalResult;
      } catch (error) {
        console.error("Error in auto-renewal process:", error);
        throw error;
      }
    });

    console.log(`✅ Auto-renewal process completed: ${result.successful} successful, ${result.failed} failed out of ${result.processed} total`);
    
    return result;
  }
);