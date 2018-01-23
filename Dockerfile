FROM mhart/alpine-node:8

WORKDIR /app
COPY . /app

RUN npm rebuild

EXPOSE 8100
ENTRYPOINT ["npm", "run", "start"]
