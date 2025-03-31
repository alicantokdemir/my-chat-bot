import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { resources } from "./resources";

export const embeddings = pgTable(
  "embeddings",
  {
    id: serial("id").primaryKey(),
    resourceId: integer("resource_id")
      .references(() => resources.id, { onDelete: "cascade" })
      .notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(), // For text-embedding-3-small
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
