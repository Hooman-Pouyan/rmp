// server/api/submissions/[id].get.ts

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing submission ID.",
    });
  }

  // Build the remote URL for this submission’s JSON:
  const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/submissions/${id}.json`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Unable to reach data host: ${e.message}`,
    });
  }

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      statusMessage: `Submission not found: ${id}`,
    });
  }

  const submission = (await res.json()) as any;
  return submission;
});
