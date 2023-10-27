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
> docker run -d -v ${HOME}:/root -v CONFIG_DIR:/usr/src/server/app/config -p 8089:8089 tmkawanabe/wheel:latest
```

`CONFIG_DIR` must be absolute path in host machine.

above command line, we specify following options

- project files will be create under ${HOME}
- port 8089 is used for WHEEL

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
we have 3 main directories at top level

- documentMD
- client
- server

"documentMD" contains documents written in markdown.
Only files under `documentMD/user_guide` will be converted to html and be publishd at github.io pages
when pull request will be merged to master branch
Any other markdown files under documentMD is detailed informatin for developpers

"client" and "server" has client and server code respectively.

### How to run without docker
1. install and build
```
> npm build
```
2. start server
```
> cd server
> npm start
```

### CI/CD process
when you push new commit to github, server/app/db/version.json will be updated during CI/CD process.
So, you have to pull before make further commit.
