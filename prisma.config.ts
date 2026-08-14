import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    seed: 'tsx prisma/seed.ts', // بسته به اجراکننده پروژه
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
