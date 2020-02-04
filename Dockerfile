FROM node:8

WORKDIR /app
COPY . /app
RUN yarn install --production

ENV NODE_ENV production
ENTRYPOINT ["node", "src/index.js"]
