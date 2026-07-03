# build
FROM node:26-alpine AS build-stage
WORKDIR /app
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
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
