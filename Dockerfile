# syntax=docker/dockerfile:1
#build WHEEL client code
FROM --platform=linux/amd64 node:fermium-slim as builder
WORKDIR /usr/src/
# to install phantomjs
RUN apt-get update && apt -y install bzip2 python3 g++ build-essential

# copy necessary files
COPY client client
RUN cd client; npm install; npm run build

#build base image to run WHEEL
FROM --platform=linux/amd64 node:fermium-slim as runner
WORKDIR /usr/src/
COPY server server
RUN apt-get update && apt -y install curl git &&\
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash &&\
    apt -y install git-lfs &&\
    apt-get clean  &&\
    rm -rf /var/lib/apt/lists/* &&\
    cd server && npm install --production

# run UT
FROM runner as UT
WORKDIR /usr/src/server
RUN npm install cross-env\
    chai chai-as-promised chai-fs chai-iterator chai-json-schema deep-equal-in-any-order\
    mocha nyc rewire sinon sinon-chai
CMD ["npm", "run", "coverage"]

# run WHEEL
FROM runner as exec
WORKDIR /usr/src/server

COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
RUN rm -fr server/app/config/*

CMD [ "npm", "start" ]
