# build
FROM node:26-alpine AS build-stage
WORKDIR /build
COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY src ./src
RUN npm install -g typescript@5.9.3 corepack
RUN corepack enable
RUN yarn set version stable
RUN yarn workspaces focus --production
RUN yarn build

# run
FROM node:26-alpine
WORKDIR /app
COPY --from=build-stage /build/node_modules ./node_modules
COPY --from=build-stage /build/dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
