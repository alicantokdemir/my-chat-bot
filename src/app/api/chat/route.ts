import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";
import { z } from "zod";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request. 'messages' must be an array." },
        { status: 400 }
      );
    }

    const result = streamText({
      model: openai("gpt-4o"),
      messages: body.messages,
      system: `
      You are an AI assistant with a predefined knowledge base. When asked a question, you must follow these strict rules: 

      Only respond to questions using information from tool calls.
      if no relevant information is found in the tool calls, respond, "Hmm, I don't have that answer yet—sorry!",
              
      Do not generate any additional or unrelated information outside of the knowledge base.
      
      Keep responses concise and format all responses as valid HTML output including:
      
      Line breaks (<br>), bold (<b>), italics (<em>), and lists (<ul>, <li>), where appropriate.
      `,
      tools: {
        getInformation: tool({
          description: `get information from your knowledge base to answer questions.`,
          parameters: z.object({
            question: z.string().describe("the user's question"),
          }),
          execute: async ({ question }) => {
            try {
              return await findRelevantContent(question);
            } catch (error) {
              console.error("Error in findRelevantContent:", error);
              throw new Error("Failed to retrieve relevant content.");
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST /api/chat:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing the request.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
