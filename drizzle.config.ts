import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts", 
  out: "./drizzle",
  dialect: "postgresql", // Change this from 'mysql'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
