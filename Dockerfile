# syntax=docker/dockerfile:1
ARG PLATFORM=${BUILDPLATFORM}
FROM --platform=${PLATFORM} node:22-slim AS base
# tzdata's postinstall script needs a TZ value available at build time to
# configure /usr/share/zoneinfo correctly; without one (even non-interactively)
# it leaves corrupted/stub zoneinfo files. This is only a build-time default -
# entrypoint.sh determines the real, per-container TZ at runtime.
ENV TZ=Etc/UTC
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt -y install curl git rsync openssh-server bzip2 python3 g++ build-essential tzdata&&\
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash &&\
    apt -y install git-lfs &&\
    apt-get clean  &&\
    rm -rf /var/lib/apt/lists/*

FROM base AS run_base
WORKDIR /usr/src/
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN mkdir server client
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm install
RUN arch=$(uname -m) && \
    if [ "$arch" = "x86_64" ]; then npm install --no-save @rollup/rollup-linux-x64-gnu; \
    elif [ "$arch" = "aarch64" ]; then npm install --no-save @rollup/rollup-linux-arm64-gnu; \
    fi
# Ensure tar v7 dependencies are available
RUN cd server && npm install @isaacs/fs-minipass --no-save

#build client
FROM run_base AS builder
WORKDIR /usr/src/
COPY common common
COPY client client
WORKDIR /usr/src/client
RUN npm run build

# dev image: full source (server incl. test, client) + prebuilt client, for compose.dev.yml
FROM run_base AS dev
WORKDIR /usr/src
COPY common common
COPY client client
COPY server server
WORKDIR /usr/src/client
RUN npm run build
COPY entrypoint.sh /usr/src/server/
WORKDIR /usr/src/server
ENTRYPOINT ["./entrypoint.sh"]

# run UT
FROM run_base AS ut
WORKDIR /usr/src/
COPY common common
COPY server server
WORKDIR /usr/src/server
CMD ["npm", "run", "coverage"]

# run WHEEL
FROM run_base AS exec
WORKDIR /usr/src
COPY common common
COPY server server
# Don't prune - keep all dependencies to avoid ESM resolution issues
COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
COPY entrypoint.sh /usr/src/server/
RUN rm -fr client server/app/config/* server/test
WORKDIR /usr/src/server
ENTRYPOINT ["./entrypoint.sh"]
