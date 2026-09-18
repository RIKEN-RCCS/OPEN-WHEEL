# OPEN-WHEEL
Workflow in Hierarchical distributEd parallEL

[public repo](https://github.com/RIKEN-RCCS/OPEN-WHEEL)

[docker image](https://hub.docker.com/r/tmkawanabe/wheel)

## Prerequirements
latest version of [docker](https://www.docker.com/) and [git](https://git-scm.com/)

remotehost must have [rsync](https://rsync.samba.org/)

## User guide
user guide and tutorials are available here.

https://riken-rccs.github.io/OPEN-WHEEL/

## Prepareation
If you have never use git on your machine, you have to install it.
(even if you want to boot wheel from docker container, you need to install it to host OS)

after installation, please type following commands to minimum setup

```
> git config --global user.name "YOUR NAME"
> git config --global user.email "YOUR EMAIL ADDRESS"
```

this preparation required only once.

## How to use with docker
1. create new directory (hereafter referrd to as `CONFIG_DIR`)
2. put server certificatin and key file into `CONFIG_DIR` for https
3. type following command

```
> docker run -d -v ${HOME}:/root -v CONFIG_DIR:/usr/src/server/app/config -e TZ=$(readlink /etc/localtime | sed 's#.*/zoneinfo/##') -p 8089:8089 tmkawanabe/wheel:latest
```

`CONFIG_DIR` must be absolute path in host machine.

above command line, we specify following options

- project files will be create under ${HOME}
- port 8089 is used for WHEEL
- the `-e TZ=...` part makes the container's clock match your host's local timezone (skip it and the container defaults to UTC). to force a specific timezone instead of following the host, replace it with e.g. `-e TZ=Asia/Tokyo`

if you would like to use http instead of https add following option to `docker run`.
you do not need to put certification and key file into `CONFIG_DIR` in this case

```
-e WHEEL_USE_HTTP=1
```

for detailed information about configuration, see [administrator's guide](./documentMD/AdminGuide.md)

## History
WHEEL was originaly developed by Research Institute for Information Technology(RITT), Kyushu University in 2016

It is still hosted at https://github.com/RIIT-KyushuUniv/WHEEL

RIKEN R-CCS forks it and continues the development


## For developpers
### Directory structure
we have 4 main directories at top level

- documentMD
- client
- server
- test

"documentMD" contains documents written in markdown.
Only files under `documentMD/user_guide` will be converted to html and be publishd at github.io pages
when pull request will be merged to main branch
Any other markdown files under documentMD is detailed informatin for developpers

"client" and "server" has client and server code respectively.
"test" contains E2E test code based on cypress, you can find server-side unit test code under server/test

### Branch strategy
- `main` reflects the latest published release. It only moves forward when a release is cut - either by merging in `dev/YYYY` at a cycle-end release, or by merging a `maint/YYYY` hotfix line forward for a patch release. Do not open feature/bugfix pull requests directly against `main` - see below for where changes should target instead.
- `dev/YYYY` is the active development branch for fiscal year YYYY, branched off `main`. All feature and bugfix pull requests during an active development cycle target this branch.
- Once `dev/YYYY`'s cycle is done, it is merged into `main` (a release point) and then renamed in place (not re-created) to `maint/YYYY`, becoming a hotfix-only branch that receives no new features.
- From that rename until the next `dev/YYYY+1` is created, any hotfix targets the current `maint/YYYY`, not `main` directly.
- Both `dev/YYYY` and `maint/YYYY` are protected: no direct commits/pushes, changes only land via reviewed pull requests.
- `maintenance2023` and `maintenance2026` predate this naming rule and are kept as-is (legacy exceptions); any new long-lived release-maintenance branch going forward uses the `maint/YYYY` scheme.

### preparation
run following commands
1. npm install
2. npm run build (install dependent modules for server and client code)
3. cd test; npm install (install e2e test modules)

please read [TEST_GUIDE.md](TEST_GUIDE.md) for test execution guide (UT and E2E)
