"use server";

import { resources } from "@/lib/db/schema/resources";
import { db } from "../../../lib/db";
import { embeddings as embeddingsTable } from "../../../lib/db/schema/embeddings";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { parse } from "csv-parse";
import { generateEmbeddings } from "@/lib/ai/embedding";

const csvFilePath = path.join(process.cwd(), "example_data", "questions.csv");

async function parseAndSeedCSV() {
  return new Promise<void>((resolve, reject) => {
    const stream = fs
      .createReadStream(csvFilePath)
      .pipe(parse({ delimiter: ";", columns: true, trim: true }));

    stream
      .on("data", async (row) => {
        try {
          await db.transaction(async (trx) => {
            const embedding = await generateEmbeddings([row.question]);

            const [insertedResource] = await trx
              .insert(resources)
              .values({
                question: row.question,
                answer: row.answer,
              })
              .returning({ id: resources.id });

            await trx.insert(embeddingsTable).values({
              resourceId: insertedResource.id,
              embedding: embedding[0],
            });

            console.log(`Processed row: ${row.question}`);
          });
        } catch (error) {
          console.error("Error processing row:", error);
          reject(error); // Stop processing on error
        }
      })
      .on("end", () => {
        console.log("CSV data seeded into database!");
        resolve();
      })
      .on("error", (error) => {
        console.error("Error parsing CSV:", error);
        reject(error);
      });
  });
}

export async function POST(req: Request) {
  try {
    await parseAndSeedCSV();
    return NextResponse.json(
      { message: "Setup completed successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in setup process:", error);

    return NextResponse.json(
      {
        message: "An error occurred during setup.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
