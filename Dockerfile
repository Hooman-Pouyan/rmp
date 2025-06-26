# ───── build stage ──────────────────────────────────────────────
FROM node:20.18.0-slim AS build
WORKDIR /app

# lift the V8 heap cap to 4 GB and turn off source-maps to save RAM
ENV NODE_OPTIONS="--max_old_space_size=4096"
ENV NITRO_NO_SOURCEMAP=1   
ENV TAILWIND_MODE=build    

COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev    # fast, reproducible

COPY . ./
RUN npm run build                         # creates .output/

# ───── runtime stage (tiny) ─────────────────────────────────────
FROM node:20.18.0-slim AS runtime
WORKDIR /app

# copy the production bundle only
COPY --from=build /app/.output ./.output
COPY package.json ./
RUN npm install --production --ignore-scripts --omit=dev

ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]