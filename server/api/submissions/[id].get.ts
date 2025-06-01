// File: server/api/submissions/[id].get.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SubmissionDetail } from "~/core/types/facility";

export default defineEventHandler((event) => {
  const { id } = event.context.params as { id: string };
  try {
    // Assumes each submission’s full JSON lives under data/facilities/submissions/{id}.json
    const filepath = join(
      process.cwd(),
      "data",
      "submissions",
      `${id}.json`
    );
    const raw = readFileSync(filepath, "utf-8");
    const submission = JSON.parse(raw) as SubmissionDetail;
    return submission;
  } catch (err) {
    throw createError({
      statusCode: 404,
      statusMessage: `Submission not found: ${id}`,
    });
  }
});
