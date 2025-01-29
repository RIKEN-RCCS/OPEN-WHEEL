# syntax=docker/dockerfile:1
#build WHEEL client code
# FROM node:20-slim AS builder
FROM --platform=linux/amd64 node:20-slim AS builder
WORKDIR /usr/src/
# to install phantomjs
RUN apt-get update && apt -y install bzip2 python3 g++ build-essential
# build WHEEL
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY server server
COPY common common
COPY client client
RUN ls -l
RUN npm install
WORKDIR /usr/src/client
RUN npm run build

#build base image to run WHEEL
# FROM node:20-slim AS base
FROM --platform=linux/amd64 node:20-slim AS base
WORKDIR /usr/src/
RUN apt-get update && apt -y install curl git rsync openssh-server &&\
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash &&\
    apt -y install git-lfs &&\
    apt-get clean  &&\
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/node_modules /usr/src/node_modules
COPY --from=builder /usr/src/server /usr/src/server
COPY --from=builder /usr/src/common /usr/src/common
RUN rm -fr server/app/config/*

# run UT
FROM base AS ut
WORKDIR /usr/src/server
RUN apt-get update && apt -y install python3 g++ build-essential
RUN npm install cross-env\
    chai chai-as-promised chai-fs chai-iterator chai-json-schema deep-equal-in-any-order\
    mocha nyc rewire sinon sinon-chai
CMD ["npm", "run", "coverage"]

# run WHEEL
FROM base AS exec
WORKDIR /usr/src/server

COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
COPY entrypoint.sh /usr/src/server/
RUN rm -fr server/app/config/* server/test/

ENTRYPOINT ["./entrypoint.sh"]
