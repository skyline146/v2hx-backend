FROM node:18

WORKDIR /backend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:prod" ]