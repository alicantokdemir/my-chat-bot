import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "../db";
import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { resources } from "../db/schema/resources";

const embeddingModel = openai.embedding("text-embedding-3-small");

export async function generateEmbeddings(questions: string[]) {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: questions,
  });

  return embeddings;
}

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);

  if (!userQueryEmbedded || userQueryEmbedded.length === 0) {
    throw new Error("Failed to generate embedding for the user query.");
  }

  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`;

  try {
    const similarAnswers = await db
      .select({ answer: resources.answer, similarity })
      .from(embeddings)
      .innerJoin(resources, eq(embeddings.resourceId, resources.id))
      .where(gt(similarity, 0.6))
      .orderBy((t) => desc(t.similarity))
      .limit(1);

    return similarAnswers.map((item) => item.answer).join("");
  } catch (error) {
    console.error("Error finding relevant content:", error);
    throw new Error("Failed to find relevant content.");
  }
};
