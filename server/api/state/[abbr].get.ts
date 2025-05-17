import { readState } from '~/server/utils/loaders'

export default defineEventHandler((event) => {
  const { abbr } = event.context.params as { abbr: string }
  return readState(abbr.toUpperCase())
})
