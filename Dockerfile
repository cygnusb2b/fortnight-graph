FROM node:8

WORKDIR /app
COPY . /app

EXPOSE 8100

ENV NODE_ENV production
ENTRYPOINT ["node", "src/index.js"]
