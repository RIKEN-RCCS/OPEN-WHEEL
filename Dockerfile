# syntax=docker/dockerfile:1
#build WHEEL client code
FROM --platform=linux/amd64 node:hydrogen-slim as builder
WORKDIR /usr/src/
# to install phantomjs
RUN apt-get update && apt -y install bzip2 python3 g++ build-essential
# build WHEEL
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
RUN rm -fr server/app/config/*

# Resolve one version string for this build from the .git in the build context.
# This happens at build time so the value is frozen into the image (static, not
# recomputed at server start). Everything in this stage is discarded except
# /wheel-version - the copied .git never reaches the final image. See issue #1014.
# (Do not add .git to .dockerignore or every build falls back to "unknown".)
# No --dirty: git describe would inspect the working tree, but .dockerignore
# hides tracked paths (documentMD/ etc.) from `COPY . .`, so --dirty would always
# fire. The abbreviated commit is enough to identify the source.
FROM base AS versioner
COPY . .
RUN git describe --tags --always --long --abbrev=12 > /wheel-version 2>/dev/null \
    || echo unknown > /wheel-version

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

# bake the build version (issue #1014):
#  - WHEEL_VERSION build-arg wins (CI passes the release/beta string)
#  - else the git-derived value from the versioner stage, marked -local
#  - else leave version.json as shipped (committed placeholder, or a
#    source.tar.gz that already carries a baked version)
COPY --from=versioner /wheel-version /tmp/wheel-version
ARG WHEEL_VERSION=
RUN if [ -n "${WHEEL_VERSION}" ]; then \
      printf '{"version": "%s" }\n' "${WHEEL_VERSION}" > app/db/version.json ; \
    elif [ "$(cat /tmp/wheel-version)" != unknown ]; then \
      printf '{"version": "%s-local" }\n' "$(cat /tmp/wheel-version)" > app/db/version.json ; \
    fi
COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
COPY entrypoint.sh /usr/src/server/
RUN rm -fr server/app/config/* server/test/

ENTRYPOINT ["./entrypoint.sh"]
