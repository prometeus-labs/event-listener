FROM node:10

WORKDIR /usr/src/app

COPY package.json ./

RUN npm rebuild scrypt --update-binary
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
