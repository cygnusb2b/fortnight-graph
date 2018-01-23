FROM node:8-alpine

WORKDIR /app
COPY . /app

EXPOSE 8100
ENTRYPOINT ["npm", "run", "start"]
