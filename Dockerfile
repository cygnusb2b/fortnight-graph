FROM mhart/alpine-node:8
RUN npm install -g yarn

WORKDIR /app
COPY . /app

RUN yarn

EXPOSE 8100
ENTRYPOINT ["npm", "run", "start"]
