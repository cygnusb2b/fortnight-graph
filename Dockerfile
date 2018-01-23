FROM node:8-alpine

WORKDIR /app
COPY . /app

# Ensure working binary deps are brought in
RUN npm rebuild

EXPOSE 8100
ENTRYPOINT ["npm", "run", "start"]
