// server/api/facilities/[id].get.ts

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing facility ID.",
    });
  }

  // Build the remote‐host URL (GitHub Pages) for this facility’s JSON:
  const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/detail/${id}.json`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e: any) {
    // Network failure / DNS issue etc.
    throw createError({
      statusCode: 502,
      statusMessage: `Unable to reach data host: ${e.message}`,
    });
  }

  if (!res.ok) {
    // 404 or other HTTP error
    throw createError({
      statusCode: res.status,
      statusMessage: `Facility not found: ${id}`,
    });
  }

  const facility = (await res.json()) as any;
  return facility;
});
