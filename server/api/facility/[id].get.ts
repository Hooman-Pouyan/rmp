import { readFacility } from '~/server/utils/loaders'
export default defineEventHandler((event) => {
  const { id } = event.context.params as { id: string }
  return readFacility(id)
})
