FROM node:14.15-buster-slim
LABEL MAINTAINER="David Vuong <david.vuong@voltron.studio>"

RUN apt-get update -y && apt-get install lsof -y && apt-get clean

COPY . /root/app
WORKDIR /root/app
RUN yarn && npx lerna run build:css
