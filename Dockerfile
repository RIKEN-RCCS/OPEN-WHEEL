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

# entrypoint.sh starts an ssh-agent on this fixed, container-local socket; let
# `docker exec ... bash` sessions attach to the same agent without writing to the
# bind-mounted home. No-op when the socket is absent.
RUN printf '\n[ -S /tmp/wheel-ssh-agent.sock ] && export SSH_AUTH_SOCK=/tmp/wheel-ssh-agent.sock\n' >> /etc/bash.bashrc

# Resolve one version string for this build from the .git in the build context.
# This happens at build time so the value is frozen into the image (static, not
# recomputed at server start). Everything in this stage is discarded except
# /wheel-version - the copied .git never reaches the final image. See issue #1014.
# (Do not add .git to .dockerignore or every build falls back to "unknown".)
# No --dirty: git describe would inspect the working tree, but .dockerignore
# hides tracked paths (documentMD/ etc.) from `COPY . .`, so --dirty would always
# fire. The abbreviated commit is enough to identify the source.
FROM base AS versioner
WORKDIR /wheel-src
COPY . .
RUN git describe --tags --always --long --abbrev=12 > /wheel-version 2>/dev/null \
    || echo unknown > /wheel-version

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
# bake the build version (issue #1014):
#  - WHEEL_VERSION build-arg wins (CI passes the release/beta string)
#  - else the git-derived value from the versioner stage, marked -local
#  - else leave version.json as shipped (committed placeholder, or a
#    source.tar.gz that already carries a baked version)
COPY --from=versioner /wheel-version /tmp/wheel-version
ARG WHEEL_VERSION=
RUN if [ -n "${WHEEL_VERSION}" ]; then \
      printf '{"version": "%s" }\n' "${WHEEL_VERSION}" > server/app/db/version.json ; \
    elif [ "$(cat /tmp/wheel-version)" != unknown ]; then \
      printf '{"version": "%s-local" }\n' "$(cat /tmp/wheel-version)" > server/app/db/version.json ; \
    fi
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
# bake the build version - same rule as the dev stage (issue #1014)
COPY --from=versioner /wheel-version /tmp/wheel-version
ARG WHEEL_VERSION=
RUN if [ -n "${WHEEL_VERSION}" ]; then \
      printf '{"version": "%s" }\n' "${WHEEL_VERSION}" > server/app/db/version.json ; \
    elif [ "$(cat /tmp/wheel-version)" != unknown ]; then \
      printf '{"version": "%s-local" }\n' "$(cat /tmp/wheel-version)" > server/app/db/version.json ; \
    fi
# Don't prune - keep all dependencies to avoid ESM resolution issues
COPY --from=builder /usr/src/server/app/public /usr/src/server/app/public
COPY entrypoint.sh /usr/src/server/
RUN rm -fr client server/app/config/* server/test
WORKDIR /usr/src/server
ENTRYPOINT ["./entrypoint.sh"]
