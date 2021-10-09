#build WHEEL client code
FROM --platform=linux/amd64 node:fermium-slim as builder
WORKDIR /usr/src/

# to install phantomjs
RUN apt-get update && apt -y install bzip2 python3 g++ build-essential

# copy necessary files
COPY client client
COPY server server
COPY build.sh build.sh

RUN ./build.sh

#build base image to run WHEEL
FROM --platform=linux/amd64 node:fermium-slim as runner
RUN apt-get update && apt -y install curl git &&\
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash &&\
    apt-get clean  &&\
    rm -rf /var/lib/apt/lists/*

# run UT
FROM runner as test
WORKDIR /usr/src/
COPY --from=builder /usr/src/server/ .
CMD ["npm", "run", "coverage:server"]

# run WHEEL
FROM runner as exec
WORKDIR /usr/src/

COPY --from=builder /usr/src/server/ .
RUN npm prune --production && rm -fr ./app/config

CMD [ "npm", "start" ]
