FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
ENV NODE_ENV=production
ENV PORT=3006
EXPOSE 3006
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3006/ || exit 1
CMD ["npx", "next", "start", "-p", "3006"]
