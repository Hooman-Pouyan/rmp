import { readFacility } from "~/server/utils/loaders";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };

  // Ensure the ID is valid
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing facility ID.",
    });
  }

  // Attempt to read the facility data
  const facility = await readFacility(id);

  // Handle not found
  if (!facility) {
    throw createError({
      statusCode: 404,
      statusMessage: "Facility not found.",
    });
  }

  return facility;
});
