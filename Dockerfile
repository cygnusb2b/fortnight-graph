FROM limit0/node-build:latest

WORKDIR /app
COPY . /app

EXPOSE 8100
ENTRYPOINT ["npm", "run", "start"]
