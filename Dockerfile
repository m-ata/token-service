FROM node:18-alpine
WORKDIR /tmp/src
COPY package*.json ./
RUN npm install


ENV TZ Europe/Berlin
COPY src/ .
CMD [ "npm", "start" ]
