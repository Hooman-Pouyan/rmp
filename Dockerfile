# ───────────────────────────────────────────────────────────────────────────────
# Stage 1: “builder” → install dependencies, compile, generate .output
# ───────────────────────────────────────────────────────────────────────────────
FROM node:20.18.0-alpine AS builder

# 1) Set working directory
WORKDIR /app

# 2) Copy package.json / yarn.lock (or package-lock.json) and install
COPY package.json yarn.lock* package-lock.json* ./

# 3) Install all node_modules
#    (if you use npm: change to `RUN npm ci`; if you use yarn: `RUN yarn install --frozen-lockfile`)
RUN yarn install --frozen-lockfile

# 4) Copy the rest of your source code (including “data/” and “static/” folders)
#    We assume your project structure is:
#      /app
#        ● package.json, nuxt.config.ts, tsconfig.json, etc.
#        ● /server/api  (your search.get.ts)
#        ● /data        (master_submissions.json, lookups, county-fips-fixes.json, etc.)
#        ● /static      (any other static assets)
#        ● /components, /pages, /… etc.
COPY . .

# 5) Build the Nuxt/Nitro application
#    This will generate a “.output” folder containing:
#      • /output/server/index.mjs
#      • /output/public  (the client dist)
#      • /output/server/api (compiled server endpoints)
RUN yarn build

# ───────────────────────────────────────────────────────────────────────────────
# Stage 2: “production” → copy only the compiled .output + data/lookups → run
# ───────────────────────────────────────────────────────────────────────────────
FROM node:20.18.0-alpine AS runtime

# 1) Create a non-root user (optional but recommended)
RUN addgroup -S nuxtgroup && adduser -S nuxtuser -G nuxtgroup

WORKDIR /app

# 2) Copy in the built output from the builder stage
COPY --from=builder /app/.output ./ .output

# 3) Copy the “data” folder (master_submissions.json + any lookups) into /app/data
#    If you have a “static/data/” folder rather than “data/”, adjust accordingly:
COPY --from=builder /app/data ./data

# 4) Copy any static assets (if you rely on “/static/…” at runtime):
COPY --from=builder /app/static ./static

# 5) (Re-install production dependencies if needed—Nuxt/Nitro is already bundled into .output,
#    so you usually do NOT need to run npm install again. We just ensure node_modules is not needed.)
#    If you have runtime dependencies that Nitro needs, you can uncomment and adjust:
# RUN npm ci --production

# 6) Change ownership to the non-root user (so we don’t run as root)
RUN chown -R nuxtuser:nuxtgroup /app

# 7) Switch to non-root user
USER nuxtuser

# 8) Expose the port Nitro will listen on
EXPOSE 3000

# 9) Finally, start the Nitro server
#    Nuxt 3 / Nitro’s default production command is:
CMD ["node", ".output/server/index.mjs"]