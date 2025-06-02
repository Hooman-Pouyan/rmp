// server/api/facilities/by-state/[abbr].get.ts

export default defineEventHandler(async (event) => {
  const { abbr } = event.context.params as { abbr: string };
  if (!abbr) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing state abbreviation.",
    });
  }

  const upper = abbr.toUpperCase();
  const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/${upper}.json`;

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
      statusMessage: `State file not found: ${upper}`,
    });
  }

  const stateData = (await res.json()) as any;
  return stateData;
});
