# ─── STAGE 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the Nuxt app (generates .output/)
RUN npm run build

# ─── STAGE 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Only copy over the built output and installed modules
COPY --from=builder /usr/src/app/.output ./.output
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Expose port
EXPOSE 3000

# Set the Nuxt preview to listen on 0.0.0.0
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

#   docker run -e NUXT_PUBLIC_ESRI_API_KEY=YOUR_KEY -p 3000:3000 your-image
CMD ["npm", "run", "preview", "--", "--hostname", "0.0.0.0"]
