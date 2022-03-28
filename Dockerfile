FROM node:16-alpine as build
ARG arg
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/package.json package.json
COPY --from=build /app/package-lock.json package-lock.json
COPY --from=build /app/dist dist
RUN npm install --production
EXPOSE 5000
CMD ["node", "dist/index.js"]
