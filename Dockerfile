# syntax=docker/dockerfile:1
#build WHEEL client code
FROM --platform=linux/amd64 node:hydrogen-slim as builder
WORKDIR /usr/src/
# to install phantomjs
RUN apt-get update && apt -y install bzip2 python3 g++ build-essential
# build WHEEL
COPY common common
COPY server server
RUN cd server && npm install --omit=dev
COPY client client
RUN cd client; npm install; npm run build

#build base image to run WHEEL
FROM --platform=linux/amd64 node:hydrogen-slim as base
WORKDIR /usr/src/
RUN apt-get update && apt -y install curl git rsync openssh-server &&\
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash &&\
    apt -y install git-lfs &&\
    apt-get clean  &&\
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/server /usr/src/server
COPY common common
RUN rm -fr server/app/config/*

# run UT
FROM base as UT
WORKDIR /usr/src/server
RUN npm install cross-env\
    chai chai-as-promised chai-fs chai-iterator chai-json-schema deep-equal-in-any-order\
    mocha nyc rewire sinon sinon-chai
CMD ["npm", "run", "coverage"]

# run WHEEL
FROM base as exec
WORKDIR /usr/src/server

COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
COPY entrypoint.sh /usr/src/server/
RUN rm -fr server/app/config/* server/test/

ENTRYPOINT ["./entrypoint.sh"]
