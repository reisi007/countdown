FROM ghcr.io/pnpm/pnpm:11 AS build
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM ghcr.io/pnpm/pnpm:11 AS prune
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM gcr.io/distroless/nodejs26-debian13:nonroot
WORKDIR /app
COPY --from=prune --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/.next ./.next
COPY --from=build --chown=nonroot:nonroot /app/public ./public
COPY --from=build --chown=nonroot:nonroot /app/package.json ./package.json
COPY --from=build --chown=nonroot:nonroot /app/server.js ./server.js
COPY --from=build --chown=nonroot:nonroot /app/next.config.mjs ./next.config.mjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["server.js"]
