FROM node:18 AS production

WORKDIR /backend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:prod" ]

FROM node:18 AS development

WORKDIR /backend

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "start:dev" ]