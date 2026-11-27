import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const prompt = `You are a German language teacher helping a B1 level student. Please analyze the following German text and provide grammar corrections.

Text to analyze: "${text}"

Please provide your response in the following JSON format:
{
  "correctedText": "The corrected version of the entire text",
  "corrections": [
    {
      "original": "Original incorrect phrase or sentence",
      "corrected": "Corrected version",
      "explanation": "Brief explanation of the grammar rule or improvement"
    }
  ],
  "improvements": [
    {
      "original": "Original phrase that could be improved",
      "improved": "Better way to express the same idea",
      "explanation": "Why this is better or more natural"
    }
  ]
}

Focus on:
- Grammar errors (verb conjugations, cases, word order)
- Vocabulary improvements for B1 level
- More natural expressions
- Sentence structure improvements

Respond only with valid JSON, no additional text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful German language teacher specializing in B1 level corrections. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const grammarData = JSON.parse(content);

    return NextResponse.json({
      success: true,
      correctedText: grammarData.correctedText,
      corrections: grammarData.corrections || [],
      improvements: grammarData.improvements || []
    });

  } catch (error) {
    console.error("Error in grammar correction:", error);
    return NextResponse.json(
      { error: "Failed to correct grammar" },
      { status: 500 }
    );
  }
}
